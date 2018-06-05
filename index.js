var express = require('express');
var socket = require('socket.io');
var path = require('path');
var bodyParser = require('body-parser');

// App setup
var app = express();
var server = app.listen(8001, function(){
  console.log('listening to requests on 8001');
});

// Static Files
app.use(express.static('public'));

// Needed to get body data from req coming in
app.use(bodyParser.json());

// Socket setup
var io = socket(server);

app.get('/tictactoe/:room', function(req, res){
  res.sendFile(path.join(__dirname+'/public/tictactoe.html'));
});

// the room creator will make a post request to this url
app.post('/tictactoe', function(req, res){
  var room = req.body.room;
  var url = '/tictactoe/' + room;
  // this namespaces the socket connection allowing us to connect to a more specific url
  var tictactoeServer = io.of(url);

  var host = null;
  var playersSockets = [];

  var gameState = [
    'X', 'X', 'X',
    'O', null, null,
    null, null, null];

  // console.log("There is a winner right now " + calculateWinner(gameState));

  tictactoeServer.on('connection', function(sock){
    if (playersSockets.length < 2){
      console.log(sock.connected);
      playersSockets.push(sock);
      if (host == null){
        host = sock;
      }
    } else {
      console.log('someone just got kicked');
      sock.disconnect();
    }
  });

  res.send(JSON.stringify(url));
});

// calculate tic-tac-toe winner
// squares will be an array of 'X' and 'O' and null
function calculateWinner(squares) {

  var lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (var i = 0; i < lines.length; i++) {
    var a = lines[i][0];
    var b = lines[i][1];
    var c = lines[i][2];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
