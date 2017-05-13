var http = require( 'http' ); // HTTPモジュール読み込み
var socketio = require( 'socket.io' ); // Socket.IOモジュール読み込み
var fs = require( 'fs' ); // ファイル入出力モジュール読み込み
var pg = require( 'pg' );
var id;

//サーバー実装の前にエラーハンドリングを記述
process.on('uncaughtException', function(err) {
  console.log(err);
});

/*
//ちゃんとエラー処理を書くとこうなる
try {
  var json = JSON.parse('<tag>NOT JSON FORMART</tag>');
} catch (e) {
  res.writeHead(400, {"Content-Type":"text/html"});
  res.end('invalid format');
  return;
}
*/

// ポート固定でHTTPサーバーを立てる
var server = http.createServer( function( req, res ) {
  //もしURLにファイル名がないならばindex.htmlに飛ばすように
  if(req.url == "/")
    req.url = "/index.html";
  //URLでリクエストされたページをread
  fs.readFile(__dirname + req.url, 'utf-8', function(err, data){
    //もし見つからなかったら404を返す
    if(err){　//err=trueならNot Foundを返します。
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.write("Not Found");
      return res.end();　
    }
    //見つかったら表示
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
});
server.listen(process.env.PORT)

var io = socketio.listern(server);

io.sockets.on('connection', function(socket) {

	socket.on('test', function(data) {
	 io.sockets.emit('test_back', {value : data.value});
	 console.log("debug");
	});
});
