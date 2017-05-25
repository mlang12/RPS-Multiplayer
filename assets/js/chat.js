//This file contains the code that operates the chat box 
//In the play window.
//Below handles when user submits chat
"use strict";
$("#chatSend").on("click", function (event) {
  event.preventDefault();
  if (userName !== "" && player.opp.key !== "") {
    var comment = $("#chatComment").val().trim();
    var dte = moment().format("h:mm:ss a");

    db.ref("/chat/" + player.session).push({
      "name": userName,
      "time": dte,
      "comment": comment,
      "type": userKey
    });

    $("#chatComment").val("");

    //In a case where the user is waiting for an opp
  } else if (userName !== "" && player.opp.key === "") {
    $("#chatTable").append(
      "<tr>" +
      "<td class=\"auto\">" + "Waiting for an opponent..." + "</td>" +
      "</tr>"
    );

    //Require the user sign in to chat
    //This may be rare, however if user unhides the 
    //chat area in the html before signing in we would 
    //want to control their ability to send a chat
  } else {
    $("#chatTable").append(
      "<tr>" +
      "<td class=\"auto\">" + "You must be signed in to chat..." + "</td>" +
      "</tr>"
    );

  }
});

//allow the user to press enter to send a chat
$("#chatComment").on("keypress", function (event) {
  var enterkey = 13;
  if (userName !== "" && event.keyCode === enterkey) {
    $("#chatSend").click();
  }
});

//This will listen to a change in the chat on the database
//and repopulate the database with the new chat info
db.ref("/chat/" + player.session).on("value", function (snapshot) {
  if (player.session.length > 1) {
    if (userName !== "") {
      var snap = snapshot.val();
      var sKeys = Object.keys(snap[player.session]);
      var objLen = sKeys.length - 1;
      var i;
      var current;

      $("#chatTable").empty(); //clear the chat

      //Read the chat from DB and display to DOM
      for (i = 0 ; i < objLen + 1 ; i++) {
        current = snap[player.session][sKeys[i]];
        addRow(current.name, current.time, current.comment, returnClass(current.type));
      }

      $("#tableHolder").scrollTop($("#tableHolder")[0].scrollHeight);
    }
  }
});

//Function adds a chat row to the chat table
function addRow(name, timestamp, comment, className) {
  $("#chatTable").append(
    "<tr>" +
    "<td class=\"" + className + "\">" + timestamp + " " + name + ": " + comment + "</td>" +
    "</tr>"
  );
}

//Function returns the class name to use to color the chat row
function returnClass(typeOfComment) {
  var type = "";

  //Determine which class to use to color the chat row
  if (typeOfComment === "auto") {
    type = "auto"; //If the text came from the system     
  } else if (typeOfComment === userKey) {
    type = "usr"; //If the user typed the text
  } else if (typeOfComment === player.opp.key) {
    type = "opp"; //If the opponent typed the text
  } else {
    type = "auto";
  }

  return type;
}