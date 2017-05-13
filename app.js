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
			//console.log("a");
		});

		//Send rank page data
		socket.on('rank', function (data) {
			//console.log(data);
			var get_runlog = "select id, user_id from runlogs where is_run = 'true';"
			var get_userid = "select id, user_name from users;"
			var get_cheer = "select * from cheers;"
			var get_runlines = "select * from runlines;"

			client.query(get_runlog, function (err, runlog) {
				client.query(get_userid, function (err, userid) {
					client.query(get_cheer, function (err, cheer) {
						client.query(get_runlines, function (err, runlines) {
							//console.log(runlog.rows.length);
							//console.log(userid.rows.length);

							var ranking = new Array();
							var i = 0;
							var userid_length = userid.rows.length;
							while (i < userid_length) {
								var n = 0, l = 0, w = 0; q = 0;

								ranking[i] = new Object();//create object
								ranking[i].Userid = i;//1.userid
								ranking[i].Name = userid.rows[i].user_name;//2.user name
								for (n = 0; n < runlog.rows.length; n++) {
									//console.log("n is " + n);
									if (runlog.rows[n].user_id == i) {
										var data_runline = new Array();
										var runlog_id = 0;

										for (var m = 0; m < runlines.rows.length; m++) {
											//console.log(m);
											//console.log(runlines.rows[0].runlog_id);
											//console.log(runlines.rows[m].runlog_id);
											if (runlines.rows[m].runlog_id == runlog.rows[n].id) {
												data_runline[l] = runlines.rows[m];
												l++;
												runlog_id = runlog.rows[n].id;
												//console.log(data_runline.length);
											}
										}

										var max_data_runline = data_runline.length - 1;

										//get time.
										var dt_time_oldest = data_runline[0].current_times;
										console.log(dt_time_oldest);
										var dt_time_newest = data_runline[max_data_runline].current_times;
										console.log(dt_time_newest);
										var time = (dt_time_newest - dt_time_oldest) / 1000;

										var minutes = parseInt(time/60);
										var seconds = parseInt(time%60);

										var timeString = minutes + "分" + seconds + "秒";

										console.log(time);
										ranking[i].Time = timeString;//3.time

										//get distance
										//console.log(max_data_runline);
										var dist_sum = 0.000000;
										for (w = 0; w < max_data_runline; w++) {
											//console.log("current w is " + w);
											//console.log(data_runline[w].current_lat);
											var lat1 = data_runline[w].current_lat;
											var lon1 = data_runline[w].current_lon;
											var lat2 = data_runline[w + 1].current_lat;
											var lon2 = data_runline[w + 1].current_lon;
											var dist = getdist(lat1, lon1, lat2, lon2);
											//console.log(dist);
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
							io.sockets.emit('rank_back', ranking);
						});
					});
				});
			});
		});


		socket.on('map', function (data) {
			var get_runlog = "select id, user_id from runlogs where is_run = 'true';"
			var get_userid = "select id, user_name from users;"
			var get_runlines = "select * from runlines;"
			var mapback = new Array();

			var runlog_id = 0;
			client.query(get_userid, function(err, user) {
				client.query(get_runlog, function(err, runlog) {
					client.query(get_runlines, function(err, runline) {
						for(var i = 0; i < user.rows.length; i++){
							var l = 0;
							for(var n = 0; n < runlog.rows.length; n++){
								if (i == runlog.rows[n].user_id) {
									runlog_id = runlog.rows[n].id;
									for(var m = 0; m < runline.rows.length; m++) {
										if(runline.rows[m].runlog_id == runlog_id) {
											mapback[i] = new Array();
											mapback[i][l] = new Object();
											mapback[i][l].Lat = runline.rows[m].current_lat;
											mapback[i][l].Lon = runline.rows[m].current_lon;
											console.log(mapback[i][l].Lat);
											console.log(mapback[i][l].Lon);
											l++;
										}
									}
								}
							}
						}
						io.sockets.emit('map_back', mapback);
						console.log("mapback[0][3].Lat");
					});
				});
			});
		});

		socket.on('title', function (data) {
			io.sockets.emit('title_back', 4);
		});
	});
});

function getdist(lat1, lon1, lat2, lon2) {
	function radians(deg) {
		return deg * Math.PI / 180;
	}

	return 6378.14 * Math.acos(Math.cos(radians(lat1)) *
	Math.cos(radians(lat2)) *
	Math.cos(radians(lon2) - radians(lon1)) +
	Math.sin(radians(lat1)) *
	Math.sin(radians(lat2)));
}
