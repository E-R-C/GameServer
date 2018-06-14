var express = require('express');
var socket = require('socket.io');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var ejs = require('ejs');
// App setup
var app = express();
var server = app.listen(8001, function(){
  console.log('listening to requests on 8001');
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
var roomList = []

// Static Files
app.use(express.static('public'));

// Needed to get body data from req coming in
app.use(bodyParser.json());

// cookie setup
app.use(session({
  secret: "TEMPORARY SECRET STRING",
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: false },
  resave: false,
  saveUninitialized: false,
}));

// Socket setup
var io = socket(server);

// Index routing and room creation
app.post('/', function(req, res){
  var cont = req.body;
  var host = cont.isHost; // boolean
  var roomCode;
  if (host) {
    console.log("Hosting a game");
    roomCode = createRoom(roomList, cont.game, cont.name, cont.maxPlayers)
  } else { // Joining a game
    console.log("Joining a game");
    roomCode = cont.roomCode;
  }
  console.log(getRoom(roomList, roomCode));
  if (canJoin(roomList, roomCode, cont.name)){
    console.log("Joining " + roomCode);
    req.session.roomCode = roomCode;
    req.session.userName = cont.name;
    res.send(req.protocol + "://" + req.headers.host + req.originalUrl + roomCode);
    // joinRoom(roomCode, cont.name, res);
  } else {
    // Tell the user wrong userid or room code
    console.log("unable to join " + roomCode);
  }
});

app.get('/:roomCode', function(req, res) {
  var roomCode = req.params.roomCode;
  var name = req.session.userName;
  var roomObj = getRoom(roomList, roomCode);
  // TODO: serve back the html document here for a game
  if (roomObj){
    if (roomObj.gameType === "tictactoe"){
      // TODO: serve back tictactoe
      res.render('tictactoe.ejs', {
        title: "Tic Tac Toe!",
        roomCode: roomObj.roomCode,
        gameType: "Tic-Tac-Toe",
      });

    } else if (roomObj.gameType === "connect4"){
      // TODO: serve connect4
    }
    res.write(name + " " + roomCode);
  }
  else {
    res.write("Room Doesn't exist!");
  }
  res.end();
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
    if (validNewRoomCode(roomList, roomCode)){
      safeRoomCode = true;
    }
  }
  var nsp = io.of('/' + roomCode);
  console.log('/' + roomCode);
  var room = {
    roomCode:roomCode,
    players:[],
    gameType:gameType,
    host:hostname,
    maxPlayers:parseInt(maxPlayers),
    socketNamespace: nsp,
  };
  nsp.on('connection', function(socket){
    console.log('SOCKET: someone connected to room ' + roomCode);
    
    socket.on('disconnect', function(){});
  });
  roomList.push(room);
  return roomCode;
}

function validNewRoomCode(roomList, newCode){
  return !existingRoomCode(roomList, newCode);
}

function getRoom(roomList, code){
  for(r in roomList){
    room = roomList[r];
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
  if (room.players.length < room.maxPlayers){
    return true;
  }
  return false;
}
function joinRoom(roomCode, name, res){
  // we'll need to set a cookie here.
  // cookie should contain: name
  // res.send(path.join(__dirname, roomCode));
  res.send("WOOOOOOOO");
  console.log("trying to join");
}
