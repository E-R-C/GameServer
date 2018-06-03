var express = require('express');
var socket = require('socket.io');
// App setup
var app = express();
var server = app.listen(8001, function(){
  console.log('listening to requests on 8001');
});

// Static Files
app.use(express.static('public'));

// Socket setup
var io = socket(server);

io.on('connection', function(sock){
  console.log("connected to " + sock)
});
