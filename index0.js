var express = require('express');
var socket = require('socket.io');
var path = require('path');
var bodyParser = require('body-parser');

// App setup
var app = express();
var server = app.listen(8001, function(){
  console.log('listening to requests on 8001');
});
var roomList = []

// Static Files
app.use(express.static('public'));

// Needed to get body data from req coming in
app.use(bodyParser.json());

// Socket setup
var io = socket(server);

// Index routing and room creation
app.post('/', function(req, res){
  var cont = req.body;
  var host = cont.isHost; // boolean
  var roomCode;
  if (host) {
    console.log("Hosting a game");
    roomCode = createRoom(roomList, cont.gameType, cont.name, cont.maxPlayers)
  } else { // Joining a game
    console.log("Joining a game");
    roomCode = cont.roomCode;
  }
  if (canJoin(roomList, roomCode, cont.name)){
    joinRoom(roomCode, cont.name);
  } else {
    // Tell the user wrong userid or room code

  }
});
app.get('/:roomCode', function(err, res) {
  roomCode = res.params.roomCode;

});

function existingRoomCode(roomList, newCode){
  return getRoom(roomList, newCode);
}
// returns a random sequence of letters
// code ripped off of
// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateRandomCode(len){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
// must check for unique name and existing roomcode;
// Creates a room then returns the unique Code for it
function createRoom(roomList, gameType, hostname, maxPlayers){
  var safeRoomCode = false;
  var roomCode;
  // Keeps creating new room codes until we find one that works
  while(!safeRoomCode) {
    roomCode = generateRandomCode(5);
    var query = {roomCode :roomCode};
    if (validNewRoomCode(roomList, newCode)){
      safeRoomCode = true;
    }
  }
  var room = {
    roomCode:roomCode,
    players:[],
    gameType:gameType,
    host:hostname,
    maxPlayers:maxPlayers,
  };
  roomList.push(room);
  return roomCode;
}

function validNewRoomCode(roomList, newCode){
  return !existingRoomCode(roomList, newCode);
}

function getRoom(roomList, code){
  for(room in roomList){
    if (room.roomCode === code){
      return room;
    }
  }
  return null;
}

// Someone can only join if they have a unique name and an existing room.
function canJoin(roomList, roomCode, name){
  room = getRoom(roomList, roomCode);
  if (room){
    for(p in room.players){
      if (p === name){
        return false;
      }
    }
  } else {
    return false;
  }
  return true;
}
function joinRoom(roomCode, name){
  // we'll need to set a cookie here.
  // cookie should contain: name

}
