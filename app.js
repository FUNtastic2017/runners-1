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
});
