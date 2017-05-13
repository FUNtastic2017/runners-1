var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
var pg = require('pg');
var server = http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
}).listen(process.env.PORT || 3000);  // ポート競合の場合は値を変更

var io = socketio.listen(server);

var connect_db = "postgres://xrqrydturafgdu:21704202be52d8dd6877fb1b6537da1a059fbc223805f82035cc1c454f3fe335@ec2-50-17-236-15.compute-1.amazonaws.com:5432/d7utbienu4l7ha";


io.sockets.on('connection', function (socket) {

	//DBへの接続
	pg.connect(connect_db, function (err, client) {
		console.log("Connect DB");

		//test
		socket.on('test', function (data) {
			io.sockets.emit('test_back', { value: data.value });
			console.log("a");
		});

		//Send rank page data
		socket.on('rank', function (data) {
			console.log(data);
			var get_runlog = "select id, user_id from runlogs where is_run = 'true';"
			var get_userid = "select id, user_name from users;"
			var get_cheer = "select * from cheers;"
			var get_runlines = "select * from runlines;"

			client.query(get_runlog, function (err, runlog) {
				client.query(get_userid, function (err, userid) {
					client.query(get_cheer, function (err, cheer) {
						client.query(get_runlines, function (err, runlines) {
							console.log(runlog.rows.length);
							console.log(userid.rows.length);

							var ranking = new Array();
							var i = 0, n = 0, l = 0, w = 0, q = 0;
              var userid_length = userid.rows.length;
							while (i <= userid_length) {

								ranking[i] = new Object();//create object
								ranking[i].Userid = i;//1.userid
								ranking[i].Name = userid.rows[i].user_name;//2.user name
								for (n = 0; n < runlog.rows.length; n++) {
									if (runlog.rows[n].user_id == i) {
										var data_runline = new Array();
										var runlog_id = 0;

										for (var m = 0; m < runlines.rows.length; m++) {
											console.log(m);
											console.log(runlines.rows[0].runlog_id);
											console.log(runlines.rows[m].runlog_id);
											if (runlines.rows[m].runlog_id == runlog.rows[n].id) {
												data_runline[l] = runlines.rows[m];
												l++;
												runlog_id = runlog.rows[n].id;
											}
										}
										var max_data_runline = data_runline.length - 1;

										//get time.
										var dt_time_oldest = data_runline[0];
										var dt_time_newest = data_runline[max_data_runline];
										var time = (dt_time_newest - dt_time_oldest) / 3600000;
										ranking[i].Time = time;//3.time

										//get distance
										var dist_sum = 0.000000;
										for (w = 0; w < max_data_runline; w++) {
											var lat1 = data_runline[w].current_lat;
											var lon1 = data_runline[w].current_lon;
											var lat2 = data_runline[w + 1].current_lat;
											var lon2 = data_runline[w + 1].current_lon;
											var dist = getdist(lat1, lon1, lat2, lon2);
											dist_sum = dist_sum + dist;
										}
										ranking[i].Dist = dist_sum;//4.sum of distance

										//get sum of cheer
										var count_cheer = 0;
										for (q = 0; q < cheer.rows.length; q++) {
											if (cheer.rows[q].runlog_id == runlog_id) {
												count_cheer++;
											}
										}
										ranking[i].Cheer = count_cheer;//5.sum of cheer
									}
								}
								i++;
							}
							io.sockets.emit('rank_back',ranking);
						});
					});
				});
			});






		});


		socket.on('map', function (data) {
			io.sockets.emit('map_back', { value: map });
		});

		socket.on('home', function (data) {
			var home = 1;
			io.sockets.emit('home_back', { value: home });
		});

	});
});

function getdist(lat1, lon1, lat2, lon2) {
	function radians(deg) {
		return deg * Math.PI / 180;
	}

	return 6378.14 * Math.acos(Math.cos(radians(lat1)) *
		Math.cos(radians(lat2)) *
		Math.cos(radians(lng2) - radians(lng1)) +
		Math.sin(radians(lat1)) *
		Math.sin(radians(lat2)));
}
