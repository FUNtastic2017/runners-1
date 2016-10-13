var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
}).listen(process.env.PORT || 3000);  // ポート競合の場合は値を変更
 
var io = socketio.listen(server);
 
io.sockets.on('connection', function(socket) {
   
    socket.on('client_to_server', function(data) {
        io.sockets.emit('server_to_client', {value : data.value});
        console.log("a");
    });
    socket.on('client_to_server2', function(data){
        io.sockets.emit('server_to_client2', {value2 : data.value});
        console.log("b");
    });



});
e
