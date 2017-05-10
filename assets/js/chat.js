

  $("#chatSend").on("click", function(event){
    event.preventDefault();
    if(userName != "" ){
      var comment = $("#chatComment").val().trim()
      var dte = moment().format('h:mm:ss a');

      var newChat = db.ref("/chat/" + player.session).push({
        "name": userName,
        "time": dte,
        "comment": comment
      });

      $("#chatComment").val("");

    } else {

      $('#chatTable').empty();
      $('#chatTable').append(  
      '<tr>' + 
        '<td>' + "You must be signed in to chat..." + '</td>' +
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
        var blanks = 0;
        var cur;

        if (objLen < 6){
          blanks = 6 - objLen;
        }

        $("#chatTable").empty();


        /*while(blanks > 0){  
          addRow("","","");
          blanks--;
        }*/

        for (; i > -1 ; i--){
          cur = s[player.session][sKeys[objLen - i]];
          addRow(cur.name, cur.time, cur.comment);
        }

        $("#tableHolder").scrollTop($("#tableHolder")[0].scrollHeight)
      }
    }
  })

  function addRow (name, timestamp, comment){

    var convertedStart = moment(new Date(timestamp));
  
    $('#chatTable').append(  
      '<tr>' + 
        '<td>' + timestamp + " <span class='boldStuff'>" + name + ": </span>" + comment + '</td>' + 
      '</tr>'
    );
  }

