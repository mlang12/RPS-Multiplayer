

  $("#chatSend").on("click", function(event){
    event.preventDefault();
    if(userName !== "" && player.opp.key !== ""){
      var comment = $("#chatComment").val().trim()
      var dte = moment().format('h:mm:ss a');

      var newChat = db.ref("/chat/" + player.session).push({
        "name": userName,
        "time": dte,
        "comment": comment,
        "type":  userKey
      });

      $("#chatComment").val("");

    } else if(userName !== "" && player.opp.key === "") {
      $('#chatTable').append(  
        '<tr>' + 
          '<td class="auto">' + "Waiting for an opponent..." + '</td>' +
        '</tr>'
      );

    } else {
      $('#chatTable').append(  
      '<tr>' + 
        '<td class="auto">' + "You must be signed in to chat..." + '</td>' +
      '</tr>'
      );
      
    }
  })

  $("#chatComment").on("keypress", function(event){
    if(userName !== "" && event.keyCode === 13){
      $("#chatSend").click()  ;
    }
  })
  
  db.ref("/chat/" + player.session).on("value", function(snap){
    if(player.session.length  > 1){
      if(userName != ""){
        var s = snap.val();
        var sKeys = Object.keys(s[player.session]);
        var objLen = sKeys.length - 1;
        var i = objLen;
        var cur;

        $("#chatTable").empty();

        for (; i > -1 ; i--){
          cur = s[player.session][sKeys[objLen - i]];
          addRow(cur.name, cur.time, cur.comment, returnClass(cur.type));
        }

        $("#tableHolder").scrollTop($("#tableHolder")[0].scrollHeight)
      }
    }
  })

  function addRow (name, timestamp, comment, className){

    var convertedStart = moment(new Date(timestamp));
  
    $('#chatTable').append(  
      '<tr>' + 
        '<td class="'+ className + '">' + timestamp + " " + name + ": " + comment + '</td>' + 
      '</tr>'
    );
  }

  //Function returns the class name to use to color the chat row
  function returnClass(typeOfComment){
    var type = "";

    //Determine which class to use to color the chat row
    if(typeOfComment === "auto"){
      type = "auto";       //If the text came from the system     
    } else if(typeOfComment === userKey){
      type = "usr";       //If the user typed the text
    } else if(typeOfComment === player.opp.key){
      type = "opp";       //If the opponent typed the text
    }

    return type;
  }

