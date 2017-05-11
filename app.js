var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
}).listen(process.env.PORT || 3000);  // ポート競合の場合は値を変更
 
var io = socketio.listen(server);
 
io.sockets.on('connection', function(socket) {
   
    socket.on('test', function(data) {
        io.sockets.emit('test_back', {value : data.value});
        console.log("a");
    });
 

socket.on("QR",function(data){
console.log(data.user_id + data.shop_id);
  socket.emit("Share_id",{
  share_id : "share_id"
  })
});

socket.on("Share_data",function(data){
  console.log(data.share_id + data.title + data.category_id + data.explain + data.h_place + data.g_place);
});   

socket.emit("list",1
);

socket.on("join",function(data){
  console.log(data.share_id + data.user_id);
});

socket.emit("match",{
  user_id : user_id,
  user_name : user_name,
  hyoka : hyoka
});

socket.on("accept",function(data){
  console.log(data);
   socket.emit("accept_back",1)
});

socket.on("arrive",function(data){
   console.log(data);
     socket.emit("arrive_to_host",1)
});
  
socket.on("finish",function(data){
    comsole.log(data);
       socket.emit("finish",1)
});

socket.on("hyoka", function(data){
    console.log(data.use_id + data.hyoka)
});


});
