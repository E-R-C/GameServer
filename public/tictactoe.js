// we have the io variable after loading it from cdn
window.onload = function(){
  // var arr = window.location.pathname.toString().split("/");
  // room = arr[arr.length-1];



};
var url = "http://localhost:8001/" + $(".roomCode").text();
console.log(url);
var socket = io(url);

function updateBoard(twoDArr){
  var table = document.getElementById("tttBoard").rows;
  for (var r = 0; r < 3; r++) {
   for (var c = 0; c < 3; c++) {
     var row = table[r];
     console.log(row);
     row.cells[c].firstChild.innerHTML = twoDArr[r][c];
     }
  }
}

socket.on("gameState", function(room){
  updateBoard(room.gameState);
  console.log(room);
});



// Did this because socket is always false because socket.connected is checked before socket is connected
setTimeout(function(){
  if (!socket.connected){
    window.location.href = "/";
  }
}, 1000);

$("#Team0").click(function(){
  socket.emit('TeamSelect', {
    name: $("#name").text(),
    teamIndex: 0,
  })
});

$("#Team1").click(function(){
  socket.emit('TeamSelect', {
    name: $("#name").text(),
    teamIndex: 1,
  })
});


$('td').click(function() {
    var myCol = $(this).index();
    var $tr = $(this).closest('tr');
    var myRow = $tr.index();
    console.log("Column: " + myCol + " Row " + myRow);
    socket.emit("tttgameMove", {
      row: myRow,
      col: myCol,
      name: $("#name"),
    })
});
