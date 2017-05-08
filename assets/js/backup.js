    // Get User Input
  
  var userName = "";
  var userInput = '';
  var compPlay = '';
  var playable = ['r','p','s'];
  var fullWord = ['Rock', 'Paper', 'Scissors'];
  var winCombos = ['rs','pr','sp']; //each index holds the winner if user plays the first char
  var results = 0;
  var resultsVal = ['Loss', 'Draw', 'Win'];
  var resultsColor = ['#FF4136','lightgray','#25AC29'];
  var record = [0,0,0]; //win,loss,draw
  var played = [[0,0,0],[0,0,0],[0,0,0]]; //rock[player,pc,total], paper[player,pc,total], scissor[player,pc,total]
  var db = firebase.database();
  
  var gameState = {
    player2: "",
    currentSession: "",
    userKey: "",
    roundStatus: "",
    pairing: ""
  };

  var playTranslater = {  //object to translate the rock paper scissor image names in dom to play characters
    rockimg: "r",
    paperimg: "p",
    scissorsimg: "s"
  };

  //Function adds the player to the DB when they submit their username 
  $("#submitButton").on("click", function(event){
    event.preventDefault();
    userName = $("#employeeNameInput").val().trim() //Get the input for username
    var usersRef = db.ref("/players");
    var sessRef = db.ref("/session/");
    
    //Check that userName is valid
    if(userName.length > 2 && userName.length < 16){
      var newUser = usersRef.push({ //push the new user to the players dir
        "name": userName,
        "played": "",
        "result": "",
        "record": record,
        "playHistory": {
          "r": 0,
          "p": 0,
          "s": 0
        },
        "session": ""
      });
      newUser.onDisconnect().remove(); //when the user disconnects remove their player from DB
      gameState.userKey = newUser.key; //store the key for reference
      $(".userNameInput").toggle("done"); //hide the username form

      var newSess = sessRef.push({
        playerKeys: [gameState.userKey],
      });

      gameState.currentSession = newSess.key;
      newSess.onDisconnect().remove();

    } else {
      console.log("Invalid User Name. Must be between 3 and 15 characters.")
    }
  });

  db.ref("/players/" + gameState.userKey).on("value", function(snap) {
    if(userName !== ""){

    } 
  });

  db.ref("/session/").on("value", function(snap) {
    if(userName !== ""){
      var s = snap.val();
      var sessions = Object.keys(s);
      var curSess = "";

      if(sessions.length > 1){
        var userSess = "";
        var i = 0;

        if(gameState.currentSession === "" && gameState.pairing === ""){
          //Find the session with user
          while(userSess === "" || i < sessions.length -1){
            if(s[sessions[i]].playerKeys[0] === gameState.userKey){
              userSess = sessions[i];
            }
            i++;
          }

          for(i=0 ; i < sessions.length ; i++){ //find an open session
            curSess = s[sessions[i]]
            if(curSess.playerKeys.length === 1 && curSess !== userSess){ //if the session has only 1 player and its not your session then join
              var sPlayers = curSess.playerKeys;
              var ref1 = db.ref("/players/" + gameState.userKey + "/");
              var ref2 = db.ref("/players/" + curSess.playerKeys[0] + "/");
              sPlayers.push(gameState.userKey);

              db.ref("/session/" + sessions[i]).set({
                playerKeys: sPlayers,
                round: "",
                chat: ""
              });

              ref1.update({session:sessions[i]});
              ref2.update({session:sessions[i]});
              console.log(userSess)
              //db.ref("/session/" + userSess + "/").remove();
            }
          }
        } 
        gameState.pairing = "wait";
      }
    }
  })

  /*db.ref("/session/waitRoom").on("value", function(snap) {
    if(userName !== "" && gameState.currentSession === ""){ //if user has a name and doesnt have a session
      var s = snap.val(); 
      var waitRoomKeys = Object.keys(s); //get all the players in the wait room
      var playerWaitKey = "";
      var player2WaitKey = "";
      var i = 0;

      //Find user's waiting room key
      while(playerWaitKey === ""){
        if(s[waitRoomKeys[i]].player === gameState.userKey){
          playerWaitKey = waitRoomKeys[i];
        }
        i++;
      }
      //If the wait room has more than 1 person (user will automatically be in there upon username creation)
      //and the user hasn't checked the waitroom before then:
      if(waitRoomKeys.length > 1 && gameState.roundStatus === ""){ 

        if(s[waitRoomKeys[0]].player === gameState.userKey) { //check whether the first user in the WR is the user
          gameState.player2 = [waitRoomKeys[1]].player; //if it is, then take the second user as the opponent
          player2WaitKey = waitRoomKeys[1];
        } else {
          gameState.player2 = s[waitRoomKeys[0]].player; //otherwise take the first user as the opponenet
          player2WaitKey = waitRoomKeys[0];
        }

        gameState.currentSession = "session" + gameState.userKey; //establish unique sessionID
        db.ref("/players/" + gameState.player2 + "/").set({"session": gameState.currentSession}); //set the current session on the opponenet
        db.ref("/session/" + gameState.currentSession + "/" ).set({
          "playerKeys": [gameState.userKey],
          "playerUserNames": [userName],
          "chat": [userName + " has joined the game."],
          "status": "building"
        });
      //If user is the only one in the waitroom then change the gameState.Status to "wait"
      //That will cause the user to "wait" for an opponent rather than be the one activly
      //Seeking the opponent  
      } else {
        gameState.roundStatus = "wait";
        db.ref("/session/waitRoom/" + playerWaitKey + "/").status = "wait";
      }
    } 
  });*/




  //Listen if user plays with a keypress
  $(document).on("keypress", function(event) {
    if(userName !== ""){
      userInput = event.key.toLowerCase();

      if (playable.indexOf(userInput) > -1) {
        played[playable.indexOf(userInput)][0]++;
        played[playable.indexOf(userInput)][2]++;
        db.ref("/players/" + gameState.userKey + "/played/").set(userInput);
        db.ref("/players/" + gameState.userKey + "/playHistory/" + userInput).set(played[playable.indexOf(userInput)][0])
        runRps(userInput);
        console.log(db.ref("/players/" + gameState.userKey + "/name").val())
      } 
    }
  })

  //Listen if user plays with a click of the image
  $("#playPick").on("click", function(event){
      event.preventDefault();
      var id = event.target.parentNode.id //Identify the parent holder of the specific image clicked
      if( Object.keys(playTranslater).indexOf(id) > -1 ){
        userInput = playTranslater[event.target.parentNode.id];
        played[0][0]++;
        played[0][2]++;
        runRps(userInput);
      }
  });

  //executes a "round" of the game
  function runRps(userInput){
    outputResults(checkWin(userInput));
  }

  //Generates a random play or R, P, or S
  function genRandom (){
    return playable[(Math.floor((Math.random() * 3) + 1))-1];
  }

  //Checks if the user's play wins the round
  //Essentially the game is run here...
  function checkWin (userInput){
    compPlay = genRandom()
    played[playable.indexOf(compPlay)][1]++
    played[playable.indexOf(compPlay)][2]++
    if (winCombos.indexOf(userInput + compPlay) >= 0){
      record[0]++
      results = 2 //win
    } else if (userInput === compPlay) {
      record[2]++
      results = 1 //draw
    } else {
      record[1]++;
      results = 0 //lose;
    }
    return results;
  }

  function colorBox(x) {
      elements = document.getElementsByClassName(x);
      for (var i = 0; i < elements.length; i++) {
          elements[i].style.backgroundColor=resultsColor[results];
      }
  }

  function outputResults (checkWin) {
    document.getElementById('Rock').innerHTML ='_'
    document.getElementById('Paper').innerHTML ='_'
    document.getElementById('Scissors').innerHTML ='_'
    document.getElementById('input').innerHTML = fullWord[playable.indexOf(userInput)];
    document.getElementById('comp-play').innerHTML = fullWord[playable.indexOf(compPlay)];
    document.getElementById('match-results').innerHTML = resultsVal[results];
    document.getElementById('scoreboard-wins').innerHTML = record[0];
    document.getElementById('scoreboard-losses').innerHTML = record[1];
    document.getElementById('scoreboard-draws').innerHTML = record[2];
    document.getElementById('stats-rocks-player').innerHTML = played[0][0];
    document.getElementById('stats-rocks-computer').innerHTML = played[0][1];
    document.getElementById('stats-rocks-total').innerHTML = played[0][2];
    document.getElementById('stats-paper-player').innerHTML = played[1][0];
    document.getElementById('stats-paper-computer').innerHTML = played[1][1];
    document.getElementById('stats-paper-total').innerHTML = played[1][2];
    document.getElementById('stats-scissors-player').innerHTML = played[2][0];
    document.getElementById('stats-scissors-computer').innerHTML = played[2][1];
    document.getElementById('stats-scissors-total').innerHTML = played[2][2];
    document.getElementById('stats-total-player').innerHTML = played[0][0] + played[1][0] + played[2][0];
    document.getElementById('stats-total-computer').innerHTML = played[0][1] + played[1][1] + played[2][1];
    document.getElementById('stats-total-total').innerHTML = played[0][2] + played[1][2] + played[2][2];
    document.getElementById('stats-total-computer').innerHTML = played[0][1] + played[1][1] + played[2][1];
    document.getElementById('stats-total-total').innerHTML = played[0][2] + played[1][2] + played[2][2];
    document.getElementById(fullWord[playable.indexOf(userInput)]).innerHTML = 'You'
    document.getElementById(fullWord[playable.indexOf(compPlay)]).innerHTML = 'Computer'
    colorBox('playbox');
    colorBox('imgbox');
    if (results === 1) {
      document.getElementById(fullWord[playable.indexOf(compPlay)]).innerHTML = 'Draw'
    }
    console.log(fullWord[playable.indexOf(compPlay)], fullWord[playable.indexOf(userInput)], 'Loss', record[0], record[1],record[2], played[0], played[1], played[2], Date());

  }


  



    
