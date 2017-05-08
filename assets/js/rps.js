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
    "round": 0,
    "opp": {
    	"name": "",
    	"key": "",
    	"played": "",
    	"round": 0
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
      var dte = moment().format('h:mm:ss a');

      newUser.onDisconnect().remove(); //when the user disconnects remove their player from DB
      userKey = newUser.key; //store the key for reference
	    $(".userNameInput").toggle("done"); //hide the username form
	    var updates = {};
	    updates["/players/" + userKey + "/name"] = userName;
	    db.ref().update(updates);
	    $(".mainContent").toggle("done")
	    
	     db.ref("/chat/").push({
        "name": "",
        "time": dte,
        "comment": userName + " has joined the game."
      });

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

						//Listens if the player made a play
						db.ref("/players/" + userName + "/opp/played/").on("value", function(snap) {
							player.opp.played = snap.val();

							if(player.played !== "" && player.opp.round === player.round){
								runRps(player.played, player.opp.played);
							}
						});

						db.ref("/players/" + player.opp.key + "/round/").on("value", function(snap) {
							player.opp.round = snap.val();
						});
					}
				}
			}
		}	
	});

	//Listen if user plays with a click of the image
	$("#playPick").on("click", function(event){
		if(userName !== ""){
			event.preventDefault();
			var id = event.target.parentNode.id //Identify the parent holder of the specific image clicked
			if(Object.keys(playTranslater).indexOf(id) > -1 ){
				userInput = playTranslater[id];
				player.played = userInput;

				var updates = {};
				updates["/players/" + userKey + "/played/"] = userInput;
				updates["/players/" + player.opp.key + "/opp/played"] = userInput;
				updates["/players/" + player.opp.key + "/opp/round"] = player.round;
				updates["/players/" + player.opp.key + "/opp/name"] = userName;
				db.ref().update(updates);
				//db.ref("/players/" + userKey + "/playHistory/" + userInput).set(played[playable.indexOf(userInput)][0])
			}
		}
	});


	/////////////////////////
	//Below this point is the actual game mechanics
	/////////////////////////

	//executes a "round" of the game
	function runRps(userInput, oppPlay){
		outputResults(checkWin(userInput));
		player.round ++;
		db.ref("/players/" + userKey + "/round").set(player.round);
	}

	//Checks if the user's play wins the round
	//Essentially the game is run here...
	function checkWin (userInput, oppPlay){
		//played[playable.indexOf(oppPlay)][1]++
		//played[playable.indexOf(oppPlay)][2]++
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
		console.log("results: " + results);
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
		$("#comp-play").html ( fullWord[playable.indexOf(player.opp.played)]);
		$("#match-results").html ( resultsVal[results]);
		$("#scoreboard-wins").html ( record[0]);
		$("#scoreboard-losses").html ( record[1]);
		$("#scoreboard-draws").html ( record[2]);
		$("#" + fullWord[playable.indexOf(userInput)]).html('You');
		$("#" + fullWord[playable.indexOf(player.opp.played)]).html(player.opp.name)
		colorBox('playbox'); //use class for this
		colorBox('imgbox');

		if (results === 1) { //If draw game
			$(fullWord[playable.indexOf(userInput)]).html('Draw');
		}
		//console.log(fullWord[playable.indexOf(compPlay)], fullWord[playable.indexOf(userInput)], 'Loss', record[0], record[1],record[2], played[0], played[1], played[2], Date());
	}


	



    
