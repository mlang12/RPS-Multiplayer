    // Get User Input
  
	var userName = "";
	var userKey = "";
	var userInput = '';
	var oppPlay = "";
	var playable = ['r','p','s'];
	var fullWord = ['Rock', 'Paper', 'Scissors'];
	var winCombos = ['rs','pr','sp']; //each index holds the winner if user plays the first char
	var results = 0;
	var resultsVal = ['Loss', 'Draw', 'Win'];
	var resultsColor = ['#FF4136','lightgray','#25AC29'];
	var record = [0,0,0]; //win,loss,draw
	var played = [[0,0,0],[0,0,0],[0,0,0]]; //rock[player,pc,total], paper[player,pc,total], scissor[player,pc,total]
	var db = firebase.database();
	
	var player = { //push the new user to the players dir
    "name": userName,
    "played": "",
    "result": "",
    "record": record,
    "playHistory": {
      "r": 0,
      "p": 0,
      "s": 0
    },
    "opp": {
    	"name": "",
    	"key": ""
    }
  };

	var playTranslater = {	//object to translate the rock paper scissor image names in dom to play characters
		rockimg: "r",
		paperimg: "p",
		scissorsimg: "s"
	};

	//Function adds the player to the DB when they submit their username 
	$("#submitButton").on("click", function(event){
	  event.preventDefault();
	  userName = $("#employeeNameInput").val().trim() //Get the input for username
	  //Check that userName is valid
	  if(userName.length > 2 && userName.length < 16){
		  var usersRef = db.ref("/players");
      var newUser = usersRef.push(player);
      newUser.onDisconnect().remove(); //when the user disconnects remove their player from DB
      userKey = newUser.key; //store the key for reference
	    $(".userNameInput").toggle("done"); //hide the username form
	    var updates = {};
	    updates["/players/" + userKey + "/name"] = userName;
	    db.ref().update(updates);
    } else {
    	console.log("Invalid User Name. Must be between 3 and 15 characters.")
    }
  });

	db.ref("/players/" + userKey).on("value", function(snap) {
		if(userName !== ""){
			var s = snap.val();
			var sKeys = Object.keys(s);
			var i;

			if(sKeys.length > 1 && userKey !== ""){ //if there is more than 1 player

				for(i = 0; i < sKeys.length ; i++){
					if(s[sKeys[i]].opp.key === "" && sKeys[i] !== userKey){
						player.opp.key = sKeys[i];
						player.opp.name = s[sKeys[i]].name;
						var updates = {};
						updates["/players/" + userKey + "/opp/key"] = player.opp.key;
						updates["/players/" + sKeys[i] + "/opp/key"] = userKey;
						db.ref().update(updates);
					}
				}
			}
		}	
	});

	db.ref("/players/" + player.opp.key + "/played/").on("value", function(snap) {
		console.log("gotHere")
		if(userName !== ""){
			console.log(snap.val());
		}	
	});

	//Listen if user plays with a keypress
	$(document).on("keypress", function(event) {
		if(userName !== ""){
			userInput = event.key.toLowerCase();

			if (playable.indexOf(userInput) > -1) {
				played[playable.indexOf(userInput)][0]++;
				played[playable.indexOf(userInput)][2]++;
				db.ref("/players/" + userKey + "/played/").set(userInput);
				db.ref("/players/" + userKey + "/playHistory/" + userInput).set(played[playable.indexOf(userInput)][0])
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
				player.played = userInput;
				db.ref("/players/" + userKey + "/played/").set(userInput)
				db.ref("/players/" + userKey + "/playHistory/" + userInput).set(played[playable.indexOf(userInput)][0])
			}
	});

	//executes a "round" of the game
	function runRps(userInput, oppPlay){
		outputResults(checkWin(userInput));
	}

	//Checks if the user's play wins the round
	//Essentially the game is run here...
	function checkWin (userInput, oppPlay){
		played[playable.indexOf(oppPlay)][1]++
		played[playable.indexOf(oppPlay)][2]++
		if (winCombos.indexOf(userInput + oppPlay) >= 0){
			record[0]++
			results = 2 //win
		} else if (userInput === oppPlay) {
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
		$("#Rock").html ("_");
		$("#Paper").html ("_");
		$("#Scissors").html ("_");
		$("#input").html ( fullWord[playable.indexOf(userInput)]);
		$("#comp-play").html ( fullWord[playable.indexOf(compPlay)]);
		$("#match-results").html ( resultsVal[results]);
		$("#scoreboard-wins").html ( record[0]);
		$("#scoreboard-losses").html ( record[1]);
		$("#scoreboard-draws").html ( record[2]);
		$("#" + fullWord[playable.indexOf(userInput)]).html('You');
		$("#" + fullWord[playable.indexOf(compPlay)]).html(player.opp.name)
		colorBox('playbox');
		colorBox('imgbox');
		if (results === 1) {
			$(fullWord[playable.indexOf(compPlay)]).html('Draw');
		}
		//console.log(fullWord[playable.indexOf(compPlay)], fullWord[playable.indexOf(userInput)], 'Loss', record[0], record[1],record[2], played[0], played[1], played[2], Date());
	}


	



    
