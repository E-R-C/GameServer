// we have the io variable after loading it from cdn
// var socket = io('http://localhost:8001/' + 'b');

// we will get the currently selected options and then visit the url for that specific game
$(document).ready(function(){
  $('#createRoomButton').click(function(){
    var name = $('#nameInput').val();
    var game = $('select#gameSelector option:selected').val();
    var maxPeople = $('#numPeople').val();
    var isHost = true;
    // visit one of the game routes in express
    var data = {isHost:isHost, name: name, game: game, maxPlayers:maxPeople};
    $.ajax({
      type: 'POST',
      url: '/',
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'text',
      success: function(data){
          console.log(data);
          window.location.href = data;
      }
    });
  });
});

$('#joinRoomButton').click(function(){
  var name = $('#joinNameInput').val();
  var room = $('#roomCodeInput').val();
  var data = {isHost:false, name:name, roomCode:room};
  $.ajax({
    type: 'POST',
    url: '/',
    contentType: 'application/json',
    data: JSON.stringify(data),
    dataType: 'text',
    success: function(data){
        console.log(data);
        window.location.href = data;
    }
  });
})


$('#hostGameButton').click(function(){
  $('#hostInfoDiv').addClass('shown').removeClass('hidden');
  $('#joinInfoDiv').addClass('hidden').removeClass('shown');

});
$('#joinButton').click(function(){
  $('#joinInfoDiv').addClass('shown').removeClass('hidden');
  $('#hostInfoDiv').addClass('hidden').removeClass('shown');
});
