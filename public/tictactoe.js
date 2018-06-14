// we have the io variable after loading it from cdn
window.onload = function(){
  // var arr = window.location.pathname.toString().split("/");
  // room = arr[arr.length-1];



};
var url = "http://localhost:8001/" + $(".roomCode").text();
console.log(url);
var socket = io(url);

// Did this because socket is always false because socket.connected is checked before socket is connected
setTimeout(function(){
  if (!socket.connected){
    window.location.href = "/";
  }
}, 1000);



$('td').click(function() {
    var myCol = $(this).index();
    var $tr = $(this).closest('tr');
    var myRow = $tr.index();

});
