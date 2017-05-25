"use strict";

var userName = ""; //UserName selected at the begining of the game. This is duplicated into the player.name object
var userKey = ""; //The unique key generated for the player by pushing to Firebase. This key is used to reference the player in code
var userInput = ""; //Represents what the user played in the current round
var oppPlay = ""; //Holds the value of the hand played by the opponent in the current round
var lastRound = -1; //Holds the result of the prior round - this is used to toggle the colors around the r,p,s images after a reset
var results = 0; //Code used that will indicate that result of that particular round. 0 = loss, 1 = draw, 2 = win
var currentNumberOfPlayers = 0; //Holds the total people on the RPS server at the time
var playedFlag = false; //Flag that indicates whether player clicked an r,p,s image in the current round (prevents from multiple or changed choices)
var pannelIsToggled = false; //Flag whether the login panel has been toggled to orange on an invalid sign-in
var playable = ["r", "p", "s"]; //The values users can play by clicking the buttons
var fullWord = ["Rock", "Paper", "Scissors"]; //Array that holds the word-string value of a user"s play
var winCombos = ["rs", "pr", "sp"]; //Each index holds the winner if user plays the first char
var resultsVal = ["Loss", "Draw", "Win"]; //Holds the strings of possible outcomes to a round
var resultsColor = ["lossBox", "drawBox", "winBox"]; //Holds array of classnames which will change the DOM colors based on round win/loss
var record = [0, 0, 0]; //Win,loss,draw
var validChars = [ //List of valid characters to check username input
  "a", "b", "c", "d", "e", "f",
  "g", "h", "i", "j", "k", "l",
  "m", "n", "o", "p", "q", "r",
  "s", "t", "u", "v", "w", "x",
  "y", "z", "1", "2", "3", "4",
  "5", "6", "7", "8", "9", "-"
];

var player = { //Built out object of the player where certain key values are stored. Also pushed to DB to create new player
  "name": "", //duplicated userName from above
  "round": 1, //the current round of the game (default is 1)
  "opp": { //information about the opponenet
    "name": "",
    "key": "",
    "play": ""
  },
  "session": "" //Unique session ID established with another player
};

var playTranslator = { //object to translate the rock paper scissor image names in dom to play characters
  rockimg: "r",
  paperimg: "p",
  scissorsimg: "s"
};

var db = firebase.database(); //reference to firebase Database

//Function adds the player to the DB when they submit their username 
$("#submitButton").on("click", function (event) {
  event.preventDefault();
  userName = $("#nameInput").val().trim().toLowerCase(); //Get the input for username

  //Check that userName is valid then...
  if (checkUserNameValid(userName)) {
    var usersRef = db.ref("/players");
    var newUser = usersRef.push(player);
    userName = firstLetterUpper(userName);

    newUser.onDisconnect().remove(); //when the user disconnects remove their player from DB
    userKey = newUser.key; //store the key for reference
    $(".userNameInput").toggle("done"); //hide the username form with animation

    //Update the DB with your player information
    var updates = {};
    updates["/players/" + userKey + "/name"] = userName;
    db.ref().update(updates);

    $(".mainContent").toggle("done"); //show play field with animation
    $(".panel-warning").toggleClass("panel-warning"); //turn off the orange if it exists

    //If the Username is invalid
  } else {

    //Put a message that it is invalid
    $("#login-title").html("Invalid Username. Must be between 3 and 15 characters and contain only letters and numbers.");

    //Change the panel color to orange/warning
    if (!pannelIsToggled) {
      $(".panel-success").toggleClass("panel-warning");
      pannelIsToggled = true;
    }

    shakeLoginOnWrong(); //Animate panel-shake
  }
});

//Allow user to click "enter" when submiting their username
$("#nameInput").on("keypress", function (event) {
  var enterKey = 13;
  if (event.keyCode === enterKey) {
    $("#submitButton").click();
  }
});

//listen for new players joining the DB to extract a live count
function getNumPlayers(snap) {
  if (userName !== "") {
    var s = snap.val();
    var sKeys = Object.keys(s);
    currentNumberOfPlayers = sKeys.length; //Get total amount of players to display on screen.
    return currentNumberOfPlayers;
  }
  return 0;
}

//listen for opponent disconnect
db.ref("/players/").on("value", function (snap) {

  //When number of players change update the total players
  if (userName !== "") {
    $("#playerCounter").html("There are currently " + getNumPlayers(snap) + " RPS players in the world!");
  }

  //Only runs when the user has signed in and
  //has an opponent
  if (userName !== "" && player.opp.key !== "") {
    var s = snap.val();
    var sKeys = Object.keys(s);

    //If opponent"s key is not in game player list then...
    if (sKeys.indexOf(player.opp.key) === -1) {

      //Send disconnect message
      var dte = moment().format("h:mm:ss a");
      var newChat = db.ref("/chat/" + player.session).push({
        "name": player.opp.name,
        "time": dte,
        "comment": "disconnected from the game.",
        "type": "auto"
      });

      $("#notes").html(player.opp.name + " left the game...");

      //reset user"s data to be able to receive another opp
      player.opp.name = "";
      player.opp.key = "";
      player.opp.play = "";
      player.session = "";
      player.round = 1;
      userInput = "";
      oppPlay = "";
      playedFlag = false;

      //reset the data on server
      var updates = {};
      updates["players/" + userKey + "/session"] = "";
      updates["players/" + userKey + "/round"] = "";
      updates["players/" + userKey + "/opp/key"] = "";
      updates["players/" + userKey + "/opp/name"] = "";
      updates["players/" + userKey + "/opp/play"] = "";
      db.ref().update(updates);
    }
  }
}); //Close listen for disconnect

//Extract opponent"s name from the chat join. The is an issue
//with performing this task at the time the keys are identified
//and therefore needs to be performed as a separate function
db.ref("/chat/" + player.session).on("value", function (snap) {
  if (player.session !== "" && player.opp.name === "") {
    var s = snap.val();
    var sKeys = Object.keys(s[player.session]);
    var i = 0;

    while (i < sKeys.length) {
      if (s[player.session][sKeys[i]].name !== userName && s[player.session][sKeys[i]].name != "") {
        player.opp.name = s[player.session][sKeys[i]].name;
        $("#notes").html("Playing against " + player.opp.name);
      }
      i++;
    }
  }
});

//This listener does a couple key things... it is where the player pairing
//mechanism occurs. It also initiates the chat in the pair session and 
//adds the listener for when plays are made to the "round"
db.ref("/players/" + userKey).on("value", function (snap) {
  if (userName !== "") {
    var s = snap.val();
    var sKeys = Object.keys(s);
    var i;
    var thisSession;
    var updates = {};
    var dte;

    //if there is more than 1 player and user has a key
    if (sKeys.length > 1 && userKey !== "") {

      //Go through each player in the DB
      for (i = 0; i < sKeys.length; i++) {

        //If the player doesnt have an opponenet, the player is not this user, 
        //and this user doesnt already have an opponent
        if (s[sKeys[i]].opp.key === "" && sKeys[i] !== userKey && player.opp.key === "") {
          player.opp.key = sKeys[i]; //Establish this player as your opponent
          player.opp.name = s[sKeys[i]].name;

          //Determine unique sessionID
          thisSession = getUniqueSessionID(userKey, player.opp.key);
          player.session = thisSession;

          //Update the DB with the session keys and opp keys
          updates["/players/" + userKey + "/opp/key"] = player.opp.key;
          updates["/players/" + sKeys[i] + "/opp/key"] = userKey; //establish to your opponent that you are the their opp
          updates["/players/" + sKeys[i] + "/opp/name"] = userName;
          updates["/players/" + userKey + "/session"] = thisSession;
          updates["/players/" + sKeys[i] + "/session"] = thisSession;
          db.ref().update(updates);

          $("#notes").html("Playing against " + player.opp.name); //Let the user know who they are playing against

          //Push a message to the chat that the user has joined the game
          dte = moment().format("h:mm:ss a");
          db.ref("/chat/" + thisSession).push({
            "name": userName,
            "time": dte,
            "comment": "Joined the game.",
            "type": "auto"
          });

          addRoundListener();
        }
      }
    } else { //If you are the only player in the database
      $("#notes").html("Waiting for someone else to join the game...");
    }
  }
});

//Listens if the player made a play to the current round
//Due to scoping this listener needs to be instantiated at the time
//the session id is established
function addRoundListener() {
  db.ref("/rounds/" + player.session).on("value", function (snap) {
    if (userName !== "" && player.session !== "") {
      var curSess = snap.val();

      //Bail if curSess is null
      if (curSess === null) {
        return;
      }

      //Drill in to the round data to find what users played
      var rounds = Object.keys(curSess);
      var mostRecentRound = rounds.indexOf("round" + player.round);
      var curRound = curSess[rounds[mostRecentRound]];
      var plays = Object.keys(curRound);

      //If both players played in the round
      if (plays.length == 2) {

        var pushKey = Object.keys(curRound[player.opp.key]); //Grab the key the opponent used in the round for ref
        player.opp.play = curRound[player.opp.key][pushKey].played; //Store the opponent"s played hand
        runRps(userInput, player.opp.play); //Send user and opp plays to the game engine
        $("#notes").html("Playing against " + player.opp.name); //Put default note in the notes section

        // If the round was updated and the user played a hand, but opp did not
      } else if (userInput !== "") {

        $("#input").html(fullWord[playable.indexOf(userInput)]); //Display what the user played in the current round
        $("#" + fullWord[playable.indexOf(userInput)]).html("Played"); //Indicate over the icon which hand was played
        $("#notes").html("Waiting for " + player.opp.name + "..."); //Indicate that waiting for opp to play

        // The round was updated because opp played and user hasn"t
      } else {

        $("#notes").html("Your turn! " + player.opp.name + " has gone."); //Remind user it is their turn												
      }
    }
  });
}

//Listen if user plays with a click of the image
$("#playPick").on("click", function (event) {
  if (userName !== "" && player.opp.key !== "" && playedFlag === false) {
    event.preventDefault();
    var id = event.target.parentNode.id; //Identify the parent holder of the specific image clicked
    if (Object.keys(playTranslator).indexOf(id) > -1) {
      userInput = playTranslator[id];
      playedFlag = true;

      if (lastRound > -1) {
        newRoundFormat(lastRound);
        lastRound = -1;
      }

      db.ref("/rounds/" + player.session + "/round" + player.round + "/" + userKey).push({
        played: userInput,
        name: userName
      });
    }
  } else if (player.opp.key === "") {
    $("#notes").html("Waiting for an opponent...");
  }
});

//Makes the first letter of the passed string uppercase
function firstLetterUpper(str) {
  var s = str.split("");
  s[0] = s[0].toUpperCase();
  return s.join("");
}

//Generates the unique session ID used by each player
//Combines each player"s unique session ID based on
//smallest to biggest value. This means each player
//will calculate the same unique session ID
function getUniqueSessionID(usrKey, oppKey) {
  if (usrKey < oppKey) {
    return usrKey + oppKey;
  } else {
    return oppKey + usrKey;
  }
}

//Animates the sign-in box "shake" when invalid username is selected
function shakeLoginOnWrong() {
  var mv = 5;
  var i = 0;
  while (i <= 7) {
    $(".userNameInput").animate({
      "margin-left": "+=" + (mv = -mv) + "px",
      "margin-right": "-=" + mv + "px"
    }, 40);
    i++;
  }
}

//Function applies some rules to the desired userName to see
//if it is valid/acceptable
function checkUserNameValid(usrNme) {
  var usrChars = usrNme.split("");
  var vld = true;

  //Size check
  if (usrNme.length < 3 || usrNme.length > 16) {
    vld = false; //Too many or too few characters in UN
  }

  //Character check
  usrChars.forEach(function (chr) {
    if (validChars.indexOf(chr) < 0) {
      vld = false; //UserName had invalid characters	
    }
  });

  return vld;

}

/////////////////////////
//Below this point is the actual game mechanics (game engine)
/////////////////////////

//executes a "round" of the game
function runRps(usrInput, oppPlay) {
  outputResults(checkWin(usrInput, oppPlay)); //See who wins the round then display the results to DOM
  player.round++; //advance the round
  userInput = ""; //reset the user Input
  playedFlag = false; //reset the playedFlag
}

//Checks if the user"s play wins the round
//Essentially the game is run here...
function checkWin(usrInput, oppPlay) {

  if (winCombos.indexOf(usrInput + oppPlay) >= 0) {
    record[0]++;
    results = 2; //win
  } else if (usrInput === oppPlay) {
    record[2]++;
    results = 1; //draw
  } else {
    record[1]++;
    results = 0; //lose;
  }
  return results;
}

//Function resets the visuals on DOM (usually called a begin of new round)
function newRoundFormat(lastRound) {
  $("#Rock").html("_");
  $("#Paper").html("_");
  $("#Scissors").html("_");
  $("#input").html("");
  $("#comp-play").html("");
  $("#match-results").html("");
  $("#match-round").html(player.round)
  $(".playbox").toggleClass(resultsColor[lastRound]);
  $(".imgbox").toggleClass(resultsColor[lastRound]);
}

//Display results of round on the DOM
function outputResults(checkWin) {
  //Rests indicators above hand imgs
  $("#Rock").html("_");
  $("#Paper").html("_");
  $("#Scissors").html("_");

  //Outputs results of round to the panel
  $("#input").html(fullWord[playable.indexOf(userInput)]);
  $("#comp-play").html(fullWord[playable.indexOf(player.opp.play)]);
  $("#match-results").html(resultsVal[results]);
  $("#match-round").html(player.round);

  //Changes values on the scoreboard
  $("#scoreboard-wins").html(record[0]);
  $("#scoreboard-losses").html(record[1]);
  $("#scoreboard-draws").html(record[2]);

  //Change the values over the imgs to indicate who played what
  $("#" + fullWord[playable.indexOf(userInput)]).html("You");
  $("#" + fullWord[playable.indexOf(player.opp.play)]).html(player.opp.name);
  if (results === 1) { //If draw game
    $("#" + fullWord[playable.indexOf(userInput)]).html("Draw");
  }

  //Change the color of the img holder containers based on results (green/red == win/loss)
  $(".playbox").toggleClass(resultsColor[checkWin]);
  $(".imgbox").toggleClass(resultsColor[checkWin]);

  lastRound = checkWin; //Store the results of this round to toggle the results colors on reset
}