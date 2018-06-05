// we have the io variable after loading it from cdn
// var socket = io("http://localhost:8001/" + "b");

// we will get the currently selected options and then visit the url for that specific game
$(document).ready(function(){
  var $button = $("#submitGame").click(function(){
    var name = $("#nameInput").val();
    var room = $("#roomCodeInput").val();
    var game = $("select#gameSelector option:selected").val();
    var maxPeople = 4; // Todo: create an input for this
    var isHost = true;
    // visit one of the game routes in express
    var data = {isHost:isHost, name: name, room: room, game: game};
    $.ajax({
      type: 'POST',
      url: "/",
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function(data){
          window.location.href = data;
      }
    });
  });
});
