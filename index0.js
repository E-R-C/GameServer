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
io.set('transports', ['websocket']);

var gameSettings = {
  tictactoe: {
    numTeams: 2,
    teamOrder: [0, 1],
    firstTurnTeam: 0,
    initGameState: [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
      [' ', ' ', ' ']
    ],
  },
  connect4: {
    numTeams: 2,
  }
};


// Index routing and room creation
app.post('/', function(req, res){
  var cont = req.body;
  var host = cont.isHost; // boolean
  var roomCode;
  if (host) {
    console.log("Hosting a game");
    roomCode = createRoom(roomList, cont.game, cont.name, cont.maxPlayers, gameSettings[cont.game].numTeams)
  } else { // Joining a game
    console.log("Joining a game");
    roomCode = cont.roomCode;
  }
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
  if (roomObj){
    if (roomObj.gameType === "tictactoe"){
      res.render('tictactoe.ejs', {
        title: "Tic Tac Toe!",
        roomCode: roomObj.roomCode,
        gameType: "Tic-Tac-Toe",
        name: name,
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
function createRoom(roomList, gameType, hostname, maxPlayers, numTeams){
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

  /* ROOM DECLARATION IS HERE */
  var room = {
    unassignedNames: [],
    roomCode:roomCode,
    gameType:gameType,
    host:hostname,
    maxPlayers:parseInt(maxPlayers),
    socketNamespace: nsp,
    gameState: shalClone(gameSettings[gameType].initGameState),
    turnOrder: shalClone(gameSettings[gameType].turnOrder),
    currentTurn: 0,
    socketList: genEmptyArray(gameSettings[gameType].numTeams),
    memberTeamList: genEmptyArray(gameSettings[gameType].numTeams),
  };


  nsp.on('connection', function(socket){
    console.log('SOCKET: someone connected to room ' + roomCode);
    // Prompt
    var namespace = "/" + roomCode;
    io.of(namespace).emit("gameState", {
      gameState: room.gameState,
      memberTeamList: room.memberTeamList,
    });
    // socket.emit("gameState", {
    //   gameState: room.gameState,
    //   nameList: room.memberTeamList,
    // });
    socket.on("init", function(data){
      room.unassignedNames.push(data.name);
      console.log(room.unassignedNames);
    });
    socket.on("teamSelect", function(data){
      var teamIndex = data.teamIndex;
      var name = data.name;
      // Keeps the room socket teams and the names up to date.
      // if the player is not found in a room,
      if (findPlayersTeam(room, name) === -1){
        room.socketList[teamIndex].push(socket);
        room.memberTeamList[teamIndex].push(name);
        console.log(room.memberTeamList);
      }

      sendGameState(room, namespace);
    })
    // Assuming we can reuse the socket without forcing refreshes, we will have
    // multiple gamemoves here
    // I am preceding all tic tac toe moves with "ttt"
    socket.on("tttgameMove", function(data){
      console.log(data);
      console.log("On team " + room.currentTurn + "'s turn, move came from " + JSON.stringify(data.name));
      if( room.memberTeamList[room.currentTurn].indexOf(data.name) != -1 && room.gameState[data["row"]][data["col"]] === ' '){

        if (room.currentTurn % 2 === 0){
          room.gameState[data["row"]][data["col"]] = "X";
        } else {
          room.gameState[data["row"]][data["col"]] = "O";
        }
        room.currentTurn += 1;
        room.currentTurn %= room.memberTeamList.length;
      }
      console.log("recieved game move");
      sendGameState(room, namespace);

    })

    // Removes disconnected people from teams, should we think about rejoining?
    // What about disconnects, if we allow rejoins, we need to keep a db of rooms and teams
    socket.on('disconnect', function(){
      var found = false;
      for(i = 0; i < room.socketList; i++){
        var index = room.socketList[i].indexOf(socket);
        if(index != -1){
          room.socketList[i].splice(index,1);
          console.log(room.memberTeamList[i][index] + " Disconnected");
          room.memberTeamList[i].splice(index,1);
          break;
        }
      }
      sendGameState(room, namespace);
      if (! found){
        console.log("a user who could not be found on any team just disconnected");
      }
    });
  });
  roomList.push(room);
  return roomCode;
}
function sendGameState(room, namespace){
  io.of(namespace).emit("gameState",{
    gameState: room.gameState,
    memberTeamList: room.memberTeamList,
  });
}
function shalClone(obj){
  return Object.assign({}, obj);
}
function genEmptyArray(size){
  arr = []
  for(i = 0; i < size; i++){
    arr.push([]);
  }
  return arr;
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
// I should be able to return more info here as to why they can't join
function canJoin(roomList, roomCode, name){
  room = getRoom(roomList, roomCode);
  if (room){
    // if they're found in a room, don't let them in
    return findPlayersTeam(room, name) === -1 && room.unassignedNames.indexOf(name) === -1;
  } else {
    return false;
  }
}
function findPlayersTeam(room, name){
  for(i = 0; i < room.memberTeamList.length; i++){
    var list = room.memberTeamList[i];
    if (list.indexOf(name) === 1){
      return i;
    }
  }
  return -1;
}
