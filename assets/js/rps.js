  var userName = ""; 													//userName selected at the begining of the game. This is duplicated into the player.name object
	var userKey = ""; 													//The unique key generated for the player by pushing to firebase. This key is used to reference the player in code
	var userInput = ""; 												//represents what the user played in the current roudn
	var oppPlay = ""; 													//Holds the value of the hand played by the opponent in the current round
	var lastRound = -1; 												//holds the result of the prior round - this is used to toggle the colors around the r,p,s images after a reset
	var playedFlag = false; 										//Flag that indicates whether player clicked an r,p,s image in the current round (prevents from multiple or changed choices)
	var playable = ['r','p','s']; 							//the values users can play by clicking the buttons
	var fullWord = ['Rock', 'Paper', 'Scissors']; //array that holds the word-string value of a user's play
	var winCombos = ['rs','pr','sp']; 					//each index holds the winner if user plays the first char
	var results = 0; 														//code used that will indicate that result of that particular round. 0 = loss, 1 = draw, 2 = win
	var resultsVal = ['Loss', 'Draw', 'Win']; 	//holds the strings of possible outcomes to a round
	var resultsColor = ['lossBox','drawBox','winBox']; //holds array of classnames which will change the DOM colors based on round win/loss
	var record = [0,0,0]; 											//win,loss,draw
	var db = firebase.database(); 							//reference to firebase Database
	var validChars = ["a","b","c","d","e","f",
										"g","h","i","j","k","l",
										"m","n","o","p","q","r",
										"s","t","u","v","w","x",
										"y","z","1","2","3","4",
										"5","6","7","8","9","-"] //List of valid characters to check username input
	
	var player = { 		//Built out object of the player where certain key values are stored. Also pushed to DB to create new player
    "name": "", 		//duplicated userName from above
    "round": 1, 		//the current round of the game (default is 1)
    "opp": { 				//information about the opponenet
    	"name": "",
    	"key": "",
    	"play": ""
    },
    "session": ""		//Unique session ID established with another player
  };

	var playTranslater = {	//object to translate the rock paper scissor image names in dom to play characters
		rockimg: "r",
		paperimg: "p",
		scissorsimg: "s"
	};

	//Function adds the player to the DB when they submit their username 
	$("#submitButton").on("click", function(event){
	  event.preventDefault();
	  userName = $("#employeeNameInput").val().trim().toLowerCase() //Get the input for username

	  //Check that userName is valid then...
	  if(checkUserNameValid(userName)){
		  var usersRef = db.ref("/players");
      var newUser = usersRef.push(player);

      newUser.onDisconnect().remove(); //when the user disconnects remove their player from DB
      userKey = newUser.key; //store the key for reference
	    $(".userNameInput").toggle("done"); //hide the username form with animation

	    var updates = {};
	    updates["/players/" + userKey + "/name"] = userName;
	    db.ref().update(updates);

	    $(".mainContent").toggle("done");//show play field with animation

    } else {
    	console.log("Invalid User Name. Must be between 3 and 15 characters and contain only letters and numbers.");
    }
  });


  $("#employeeNameInput").on("keypress", function(event){
    if(event.keyCode === 13){
      $("#submitButton").click();
    }
  })

  //listen for opponent disconnect
  db.ref("/players/").on("value", function(snap) {
  	//Only runs when the user has signed in and
  	//has an opponent
  	if(userName !== "" && player.opp.key !== ""){  
  		var s = snap.val();
			var sKeys = Object.keys(s);

			//If opponent's key is not in game player list then...
			if(sKeys.indexOf(player.opp.key) === -1){

				//Send disconnect message
				var dte = moment().format('h:mm:ss a');
				var newChat = db.ref("/chat/" + player.session).push({
	        "name": player.opp.name,
	        "time": dte,
	        "comment": "disconnected from the game."
	      });

				//reset user's data to be able to receive another opp
				player.opp.name = "";
				player.opp.key = "";
				player.opp.play = "";
				player.session = "";
				player.round = 1;

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

	db.ref("/players/" + userKey).on("value", function(snap) {
		if(userName !== ""){
			var s = snap.val();
			var sKeys = Object.keys(s);
			var i;

			if(sKeys.length > 1 && userKey !== ""){ //if there is more than 1 player

				for(i = 0; i < sKeys.length ; i++){
					if(s[sKeys[i]].opp.key === "" && sKeys[i] !== userKey && player.opp.key === ""){
						player.opp.key = sKeys[i];
						var thisSession;

						//determine unique sessionID
						thisSession = getUniqueSessionID(userKey, player.opp.key)
						player.session = thisSession;

						var updates = {};
						updates["/players/" + userKey + "/opp/key"] = player.opp.key;
						updates["/players/" + sKeys[i] + "/opp/key"] = userKey;
						updates["/players/" + userKey + "/session"] = thisSession;
						updates["/players/" + sKeys[i] + "/session"] = thisSession;
						db.ref().update(updates);

						var dte = moment().format('h:mm:ss a');

						var chatInstance = db.ref("/chat/" + thisSession).push({
			        "name": "",
			        "time": dte,
			        "comment": userName + " has joined the game."
			      });

						//Listens if the player made a play to the current round
						db.ref("/rounds/" + player.session).on("value", function(snap) {
							if(userName !== "" && player.session !== ""){
								var curSess = snap.val();
								var rounds = Object.keys(curSess);
								var lastRound = rounds.indexOf("round" + player.round);
								var curRound = curSess[rounds[lastRound]];
								var plays = Object.keys(curRound)

								//If both players played in the round
								
								if(plays.length == 2){
									var pushKey = Object.keys(curRound[player.opp.key])
									player.opp.name = curRound[player.opp.key][pushKey].name
									player.opp.play = curRound[player.opp.key][pushKey].played
									runRps(userInput, player.opp.play)
									$("#notes").html("Playing against " + player.opp.name);
								} else if(userInput !== ""){
									$("#input").html(fullWord[playable.indexOf(userInput)]);
									$("#" + fullWord[playable.indexOf(userInput)]).html("Played");
									$("#comp-play").html("Waiting...");
									$("#notes").html("Playing against " + player.opp.name);
								} else {
									$("#input").html("Waiting...");
									$("#comp-play").html("**HIDDEN**");
									$("#notes").html("Playing against " + player.opp.name);
								}
							}
						});					
					}
				}
			}
		}	
	});

	//Listen if user plays with a click of the image
	$("#playPick").on("click", function(event){
		if(userName !== "" && player.opp.key !== "" && playedFlag === false){
			event.preventDefault();
			var id = event.target.parentNode.id //Identify the parent holder of the specific image clicked
			if(Object.keys(playTranslater).indexOf(id) > -1 ){
				userInput = playTranslater[id];
				playedFlag = true;

				if(lastRound > -1){
					newRoundFormat(lastRound);
					lastRound = -1;
				}

				db.ref("/rounds/" + player.session + "/round" + player.round + "/" + userKey).push({
					played: userInput,
					name: userName
				});
			}
		} else if(player.opp.key === "") {
			$("#notes").html("Waiting for an opponent...")
		}
	});

	function getUniqueSessionID(usrKey, oppKey){
		if(usrKey < oppKey){
			return usrKey + oppKey;
		} else {
			return oppKey + usrKey;
		}
	}

	//Function applies some rules to the desired userName to see
	//if it is valid/acceptable
	function checkUserNameValid(usrNme){
		var usrChars = usrNme.split("");
		var vld = true;

		//Size check
		if(usrNme.length < 3 || usrNme.length > 16){
			vld = false; 	//Too many or too few characters in UN
		}

		//Character check
		usrChars.forEach(function(chr){
			if(validChars.indexOf(chr) < 0){
				vld = false; //UserName had invalid characters	
			}
		});

		return vld;

	}

	/////////////////////////
	//Below this point is the actual game mechanics
	/////////////////////////

	//executes a "round" of the game
	function runRps(usrInput, oppPlay){
		outputResults(checkWin(usrInput, oppPlay));
		player.round ++;
		userInput = "";
		playedFlag = false;
	}

	//Checks if the user's play wins the round
	//Essentially the game is run here...
	function checkWin (usrInput, oppPlay){
		//played[playable.indexOf(oppPlay)][1]++
		//played[playable.indexOf(oppPlay)][2]++
		if (winCombos.indexOf(usrInput + oppPlay) >= 0){
			record[0]++
			results = 2 //win
		} else if (usrInput === oppPlay) {
			record[2]++
			results = 1 //draw
		} else {
			record[1]++;
			results = 0 //lose;
		}
		return results;
	}

	function newRoundFormat(lastRound){
		$("#Rock").html("_");
		$("#Paper").html("_");
		$("#Scissors").html("_");
		$("#input").html("");
		$("#comp-play").html("");
		$("#match-results").html("");
		$("#match-round").html(player.round)
		$('.playbox').toggleClass(resultsColor[lastRound]); 
		$('.imgbox').toggleClass(resultsColor[lastRound]);
	}

	function outputResults (checkWin) {
		$("#Rock").html("_");
		$("#Paper").html("_");
		$("#Scissors").html("_");
		$("#input").html(fullWord[playable.indexOf(userInput)]);
		$("#comp-play").html(fullWord[playable.indexOf(player.opp.play)]);
		$("#match-results").html(resultsVal[results]);
		$("#match-round").html(player.round)
		$("#scoreboard-wins").html(record[0]);
		$("#scoreboard-losses").html(record[1]);
		$("#scoreboard-draws").html(record[2]);
		$("#" + fullWord[playable.indexOf(userInput)]).html('You');
		$("#" + fullWord[playable.indexOf(player.opp.play)]).html(player.opp.name)
		$('.playbox').toggleClass(resultsColor[checkWin]); 
		$('.imgbox').toggleClass(resultsColor[checkWin]);
		if (results === 1) { //If draw game
			$("#" + fullWord[playable.indexOf(userInput)]).html('Draw');
		}
		lastRound = checkWin;
	}


	



    
