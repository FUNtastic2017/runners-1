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
			id = socket.id;
			io.sockets.to(id).emit('test_back', { value: data.value });
			//console.log("a");
		});

		//Send rank page data
		socket.on('rank', function (data) {
			id = socket.id;
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
										ranking[i].Dist = dist_sum.toFixed(1) + "m";//4.sum of distance

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
							io.sockets.to(id).emit('rank_back', ranking);
						});
					});
				});
			});
		});


		socket.on('map', function (data) {
			var id = socket.id;
			
			//送られた情報を取得
			var userid = data.userid;
			var lat = data.lat;
			var lon = data.lon;
			var isrunning = false;

			var get_runlog_isrun = "select id, user_id from runlogs;"
			client.query(get_runlog_isrun, function(err, runlogs){
				var runlogid = 0;
				for (var i = 0; i < runlogs.rows.length; i++){
					if (runlogs.rows[i].is_run && runlogs.rows[i].user_id == userid) {
						runlogid = runlogs.rows[i].id;
						isrunning = true;
					}
				}

				if (!isrunning){
					runlogid = runlogs.rows.length + 1;
					var insert_runlog = "insert into runlogs (id, user_id, is_run) values ("+runlogid+", "+userid+", 'true');"
					client.query(insert_runlog);
					var insert_lines = "insert into runlines (current_times, current_lat, current_lon, runlog_id) values ("+new Date()+", "+lat+", "+lon+", "+runlogid+");"
					client.query(insert_lines);
				} else {
					var insert_lines = "insert inot runlines (current_times, current_lat, current_lon, runlog_id) values ("+new Date()+", "+lat+", "+lon+", "+runlogid+");"
					client.query(insert_lines);	
				}
			});
			

			var get_runlog = "select id, user_id from runlogs where is_run = 'true';"
			var get_runlog = "select id, user_id from runlogs;"
			var get_userid = "select id, user_name from users;"
			var get_runlines = "select * from runlines;"
			var mapback = new Array();

			var runlog_id = 0;
			client.query(get_userid, function(err, user) {
				client.query(get_runlog, function(err, runlog) {
					client.query(get_runlines, function(err, runline) {
						//全てを配列に詰めて返却する処理
						for(var i = 0; i < user.rows.length; i++){
							var l = 0;
							mapback[i] = new Array();
							for(var n = 0; n < runlog_isrun.length; n++){
								if (i == runlog_isrun[n].user_id) {
									runlog_id = runlog_isrun[n].id;
									for(var m = 0; m < runline.rows.length; m++) {
										if(runline.rows[m].runlog_id == runlog_id) {
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
						console.log(mapback.length);
						console.log(mapback[0].length);	
						console.log(mapback[0][1].Lat);
						console.log(mapback[0][2].Lat);
						console.log(mapback[0][3].Lat);
						io.sockets.to(id).emit('map_back', mapback);
					});
				});
			});
		});

		//終了処理
		socket.on('map_stop', function (data){
			var userid = data.userid;
			var update_runlog = "update runlogs set is_run = 'false' where user_id = "+userid+" and is_run = 'true';"
			client.query(update_runlog);
		});

		socket.on('home', function (data) {
					var id = socket.id;//送信者のidを取得
					var userid = data.userid;//送られてきたuseridを取得

					var get_users = "select id, user_name from users where id = "+userid+";"//ここにiconpathの実装
					var get_runlogs = "select * from runlogs;"
					var get_lines = "select * from runlines;"
					var get_cheers = "select * from cheers;"

					client.query(get_users, function(err, users){
						client.query(get_runlogs, function(err, logs){
							client.query(get_lines, function(err, lines){
								client.query(get_cheers, function(err, cheers){
									//console.log("users length is " + users.rows.length);
									//名前取得
									var user_name = users.rows[0].user_name;
									//ファイルパス取得
									//var pic_path = users.rows[0].pic_path;
									var pic_path = "path/to/file";

									//このユーザのrunlogのidを全て取得
									var runlog_ids = [];
									for (var i = 0; i < logs.rows.length; i++){
										if(logs.rows[i].user_id == userid){
											runlog_ids.push(logs.rows[i].id);
										}
									}

									//Logsの作成
									var runlogs = [];
									for (var i = 0; i < runlog_ids.length; i++){
										var runlines = [];
										var runlogid = runlog_ids[i];
										for (var j = 0; j < lines.rows.length; j++){
											if (runlogid == lines.rows[j].runlog_id){
												runlines.push(lines.rows[j]);
											}
										}
										//何分何秒走ったかを算出
										var oldest_time = runlines[0].current_times;
										var newest_time = runlines[runlines.length-1].current_times;
										var total_time = GetTotalTime(oldest_time, newest_time);
										//何年何月何日に走ったかを算出
										var date_string = GetDateString(oldest_time);
										//走行距離を算出
										var total_distance = GetTotalDistance(runlines);

										var cheer_count = 0;
										//頑張れの数を算出
										for (var k = 0; k < cheers.rows[k].length; k++){
											if (cheer.rows[k].runlog_id == runlogid){
												count++;
											}
										}

										//Logにpush
										runlogs.push({
											"Date": date_string,
											"Dist": total_distance,
											"Time": total_time,
											"Cheer": cheer_count
										});
									}

									var home = {
										"Name": user_name,
										"PicPath": pic_path,
										"Logs": runlogs
									};
									io.sockets.to(id).emit('home_back', home);
								});
							});
						});
					});
				});

		socket.on('title', function (data) {
			id = socket.id;
			io.sockets.to(id).emit('title_back', 4);
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

function GetTotalTime(oldest_time, newest_time){
	var total_seconds = (newest_time - oldest_time) / 1000;
	var total_minutes = parseInt(total_seconds/60);
	var total_seconds = parseInt(total_seconds%60);
	var time_string = total_minutes + "分" + total_seconds + "秒";
	return time_string;
}

function GetDateString(timestamp) {
	var year = timestamp.getFullYear();
	var month = timestamp.getMonth() + 1;
	var day = timestamp.getDate();
	return year + "年" + month + "月" + day + "日";
}

function GetTotalDistance(array){
	var dist_sum = 0.000000;
	for (var i = 0; i < array.length - 1; i++) {
		var lat1 = array[i].current_lat;
		var lon1 = array[i].current_lon;
		var lat2 = array[i + 1].current_lat;
		var lon2 = array[i + 1].current_lon;
		var dist = getdist(lat1, lon1, lat2, lon2);
		dist_sum = dist_sum + dist;
	}
	return dist_sum.toFixed(1)+"m";
}
