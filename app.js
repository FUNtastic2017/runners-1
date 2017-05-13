var http = require( 'http' ); // HTTPモジュール読み込み
var socketio = require( 'socket.io' ); // Socket.IOモジュール読み込み
var fs = require( 'fs' ); // ファイル入出力モジュール読み込み
var pg = require( 'pg' );
var id;

//サーバー実装の前にエラーハンドリングを記述
process.on('uncaughtException', function(err) {
  console.log(err);
});

// ポート固定でHTTPサーバーを立てる
var server = http.createServer( function( req, res ) {
  //もしURLにファイル名がないならばindex.htmlに飛ばすように
  if(req.url == "/")
    req.url = "/index.html";
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
  });

server.listen(process.env.PORT)

var io = socketio.listern(server);

io.sockets.on('connection', function(socket) {

	socket.on('test', function(data) {
	 io.sockets.emit('test_back', {value : data.value});
	 console.log("debug");
	});
});
