var isHost = false
var socket = io('http://localhost');
socket.on('lobbyInfo', function(data){
  isHost = data.isHost;
  if (isHost){
    
  }
});
