var http = require('http'),
request = require('request'),
Firebase = require("firebase"),
fs = require("fs");

var configFile = fs.readFileSync(__dirname + "/../config/config.json",{encoding:"UTF-8"});
var configData = JSON.parse(configFile);
var RealBoardFirebase = new Firebase(configData.firebase_url);
RealBoardFirebase.child("chat").remove();

var apiUrl = null;
var app = http.createServer(function(req,res){
    res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
    res.end("RealBoard socket active");
});
var io = require('socket.io').listen(app,{log:false});
app.listen(3000);
var roomData = [];
var chatData = [];
var setSign = function(type,user){
	var act = type == "in" ? "online" : "offline";
	request(user.api+"/sendSign?sign="+type+"&user="+user.user_id);
	RealBoardFirebase.child("user/"+user.user_id).update({user_active:act});
	request(user.api+"/getSignToday?sort=[{\"property\":\"sign_time\",\"direction\":\"DESC\"}]", function (err, res, data) {
		if (!err && res.statusCode == 200) {
			var obj = {};
			if(obj = JSON.parse(data)){
				RealBoardFirebase.child("sign").set(obj.items);
			}
		}
	});
};

var sendTask = function(user){
	request(user.api+"/getUserTask?access=true", function (err, res, data) {
		if (!err && res.statusCode == 200) {
			var obj = {};
			if(obj = JSON.parse(data)){
				RealBoardFirebase.child("user_task").set(obj.items);
			}
		}
	});
};

RealBoardFirebase.child("api").once("value",function(buffer){
	var data = buffer.val();
	if(data){
		apiUrl = data;
		request(apiUrl+"/getUsers?user=0&id=0",function(err,res,data){
			if(!err && res.statusCode == 200){
				if(obj = JSON.parse(data)){
					var o = [];
					for(var i in obj.items){
						o[obj.items[i].user_id] = obj.items[i];
					}
					RealBoardFirebase.child("user").set(o);
				}
			}
		});
		request(apiUrl+"/getClient",function(err,res,data){
			if(!err && res.statusCode == 200){
				if(obj = JSON.parse(data)){
					var o = [];
					for(var i in obj.items){
						o[obj.items[i].client_id] = obj.items[i];
					}
					RealBoardFirebase.child("client").set(o);
				}
			}
		});
		request(apiUrl+"/getProject",function(err,res,data){
			if(!err && res.statusCode == 200){
				if(obj = JSON.parse(data)){
					var o = [];
					for(var i in obj.items){
						o[obj.items[i].project_id] = obj.items[i];
					}
					RealBoardFirebase.child("project").set(o);
				}
			}
		});
		request(apiUrl+"/getJob",function(err,res,data){
			if(!err && res.statusCode == 200){
				if(obj = JSON.parse(data)){
					var o = [];
					for(var i in obj.items){
						o[obj.items[i].job_id] = obj.items[i];
					}
					RealBoardFirebase.child("job").set(o);
				}
			}
		});
		request(apiUrl+"/getTask",function(err,res,data){
			if(!err && res.statusCode == 200){
				if(obj = JSON.parse(data)){
					var o = {};
					for(var i in obj.items){
						o[obj.items[i].task_id] = obj.items[i];
					}
					RealBoardFirebase.child("task").set(o);
				}
			}
		});
		sendTask({api:apiUrl});
	}
});

RealBoardFirebase.child("user").on("child_changed",function(buffer){
	var data = buffer.val();
	if(data){
		data.api = apiUrl;
		if(data.user_active == "online"){
			setSign("in",data);
		}else{
			setSign("out",data);
		}
	}
});

var RealBoard = io.of("/RealBoard");
RealBoard.on("connection",function(socket){
	var userID = socket.id,
	user = socket.handshake.query,
	ip = socket.handshake.address;
	socket.broadcast.emit("signedIn",user);
	socket.emit("joinedChat",chatData);
	socket.on("test",function(data){
		var message = "Me: "+data.toString()+"\n"+"Socket: Yes you are!";
		socket.emit("responseTest",message);
	});
	RealBoardFirebase.child("api").set(user.api);
	setSign("in",user);
	socket.on("sendChat",function(data){
		var chat = {
			ip:ip,
			user:user,
			data:data,
			date:new Date().toLocaleString(),
			server:"local"
		};
		chatData.push(chat);
		socket.emit("responseChat",chat);
		socket.broadcast.emit("responseChat",chat)
		RealBoardFirebase.child("chat").push(chat);
		setSign("in",user);
	});
	
	socket.broadcast.emit("responseConnected",{
		user:user,
		ip:ip,
		file:user.user_name,
		date:new Date().toLocaleString()
	});
	
	RealBoardFirebase.child("chat").on("child_added",function(snapshot){
		var data = snapshot.val();
		if(data.user.user_id == user.user_id || data.server == "local"){
			return false;
		}
		var chat = {
			ip:data.ip,
			user:data.user,
			data:data.data,
			date:data.date,
			server:"firebase"
		};
		chatData.push(chat);
		socket.emit("responseChatFirebase",chat);
	});
	
	socket.on("sendIDE",function(data){
		var delta = data.IDE.origin ? data.IDE : data.IDE.data;
		socket.broadcast.emit("responseIDE"+data.file,{
			IDE:delta,
			user:user,
			file:data.file
		});
		if(!roomData[data.file]){
			roomData[data.file] = {deltas:[]};
		}
		else{
			roomData[data.file].deltas.push(delta);
		}
	});
	
	socket.on("saveIDE",function(file){
		socket.broadcast.emit("responseSave",{
			user:user,
			file:file,
			ip:ip,
			date:new Date().toLocaleString()
		});
		if(roomData[file]){
			roomData[file].deltas = [];
		}
		socket.broadcast.emit("responseSaveIDE"+file);
		setSign("in",user);
	});
	socket.on("requestIDEValue",function(data){
		if(typeof roomData[data.file] != "undefined"){
			if(roomData[data.file].deltas){
				socket.emit("responseIDEValue"+data.user+data.file,
				roomData[data.file].deltas);
			}
		}
	});
	socket.on("sendUpdateProfile",function(data){
		if(!data.user_id)return;
		RealBoardFirebase.child("user/"+data.user_id).update(data);
		socket.broadcast.emit("responseUpdateProfile"+data.user_id);
	});
	
	socket.on("sendNewProfile",function(data){
		if(!data)return;
		RealBoardFirebase.child("user/"+data.user_id).set(data);
	});
	
	socket.on("sendRemoveProfile",function(data){
		if(!data.user_id)return;
		RealBoardFirebase.child("user/"+data.user_id).remove();
	});
	
	socket.on("sendClient",function(data){
		var val = data.data;
		switch(data.type){
			case "New":
				RealBoardFirebase.child("client/"+val.client_id).set(val);
			break;
			case "Update":
				RealBoardFirebase.child("client/"+val.client_id).update(val);
			break;
			case "Remove":
				RealBoardFirebase.child("client/"+val.client_id).remove();
			break;
		}
	});
	socket.on("sendProject",function(data){
		var val = data.data;
		switch(data.type){
			case "New":
				RealBoardFirebase.child("project/"+val.project_id).set(val);
			break;
			case "Update":
				RealBoardFirebase.child("project/"+val.project_id).update(val);
			break;
			case "Remove":
				RealBoardFirebase.child("project/"+val.project_id).remove();
			break;
		}
	});
	socket.on("sendJob",function(data){
		var val = data.data;
		switch(data.type){
			case "New":
				RealBoardFirebase.child("job/"+val.job_id).set(val);
			break;
			case "Update":
				RealBoardFirebase.child("job/"+val.job_id).update(val);
			break;
			case "Remove":
				RealBoardFirebase.child("job/"+val.job_id).remove();
			break;
		}
	});
	socket.on("sendTask",function(data){
		var val = data.data;
		var res = {
			file:val.task_title,
			user:user,
			ip:ip,
			date:new Date().toLocaleString()
		};
		switch(data.type){
			case "New":
				RealBoardFirebase.child("task/"+val.task_id).set(val);
			break;
			case "Update":
				RealBoardFirebase.child("task/"+val.task_id).update(val);
			break;
			case "Remove":
				RealBoardFirebase.child("task/"+val.task_id).remove();
			break;
		}
		sendTask(user);
		if(val.user_id){
			for(var i in val.user_id){
				socket.emit("responseUpdateTask"+i,res);
			}
		}
		socket.broadcast.emit("responseTask");
	});
	socket.on("sendTaskApply",function(data){
		var res = {
			file:data.task_title,
			user:user,
			ip:ip,
			date:new Date().toLocaleString()
		};
		socket.broadcast.emit("responseApplyTask",res);
		socket.broadcast.emit("responseTask");
		sendTask(user);
	});
	socket.on("sendInviteCollab",function(data){
		data.user = user;
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("requestInviteCollab"+data.to,data);
	});
	socket.on("sendReceiveCollab",function(data){
		data.user = user;
		data.file = user.user_name;
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseReceiveCollab"+data.from,data);
	});
	socket.on("sendRejectCollab",function(data){
		data.user = user;
		data.file = user.user_name;
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseRejectCollab"+data.from,data);
	});
	socket.on("sendNewfile",function(data){
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseNewfile",data);
	});
	socket.on("sendNewfolder",function(data){
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseNewfolder",data);
	});
	socket.on("sendRemovefile",function(data){
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseRemovefile",data);
	});
	socket.on("sendRemovefolder",function(data){
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseRemovefolder",data);
	});
	socket.on("sendUpload",function(data){
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseUpload",data);
	});
	socket.on("sendRenamefile",function(data){
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseRenamefile",data);
	});
	socket.on("sendRenamefolder",function(data){
		data.ip = ip;
		data.date = new Date().toLocaleString();
		socket.broadcast.emit("responseRenamefolder",data);
	});
	socket.on("disconnect",function(){
		var data = {
			file:user.user_name,
			user:user,
			ip:ip,
			date:new Date().toLocaleString()
		};
		setSign("out",user);
		socket.broadcast.emit("responseLeave",data);
		socket.leave();
	});
});
