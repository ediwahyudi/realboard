var IDE = function(){
	var self = this;
	this.scope = document.body;
	this.codeIDE = "ace";
	this.fromServer = this.ID = null;
	this.IDE = this.method = this.editor = {};
	this.generalMethod = function(){};
	
	this.IDEStyle = function(style){
		for(var _style in style) {
			self.editor.style[_style] = style[_style];
		};
	};
	this.loadCss = function(url,attr) {
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = url;
		link.id = url.replace(/[^a-z0-9]/gi,'-').toLowerCase();
		document.getElementsByTagName("head")[0].appendChild(link);
	};
	this.IDEDefinitionLanguage = function(change) {
		var data = change;
		return data;
	};
	this.engine = {
		//ace engine start
		ace : {
			options:{
				value		: "function hello() {\n\talert(\"Hello\");\n}",
				enableEmmet	: true,
				mode		: "javascript",
				theme		: "cobalt",
				extraKeys	: []
			},
			setup:function(){
				var _self = this;
				var options = self.engine.ace.options;
				self.editor.innerHTML = "";
				this.IDE = ace.edit(self.editor);
				self.IDEStyle({width:"100%",minHeight:"100%"});
				if( options.enableEmmet === true ) {
					this.IDE.setOption("enableEmmet",true);
				}
				this.IDE.setTheme("ace/theme/"+options.theme);
				this.IDE.setFontSize(14);
				this.IDE.getSession().setMode("ace/mode/"+options.mode);
				this.IDE.$blockScrolling = Infinity;
				this.IDE.setValue(options.value);
				for(var stringKey in options.extraKeys) {
					this.IDE.commands.addCommand({
						name: "command"+new Date().getTime(),
						bindKey: {win: stringKey,  mac: stringKey.replace('Ctrl','Command')},
						exec: function(a,b,c) {
							return options.extraKeys[stringKey](a,b,c);
						}
					});
				}
				self.method.send = function(change, ed, callback){
					if(callback)
						return callback(self.IDEDefinitionLanguage(change.data), ed);
				};
				self.method.response = function(data){
					_self.IDE.getSession().getDocument().applyDeltas([data]);
				};
				return this.IDE;
			}
		},
		//codemirror engine start
		codemirror:{
			options:{
				value				: "function hello() {\n\talert(\"Hello\");\n}",
				mode				: "javascript",
				autofocus			: true,
				lineNumbers			: true,
				theme				: "cobalt",
				viewportMargin		: 0,
				indentWithTabs		: true,
				indentUnit			: 4,
				extraKeys			: {}
			},
			setup: function(){
				var _self = this;
				var options = self.engine.codemirror.options;
				self.editor.innerHTML = "";
				if(options.theme != "default")
					self.loadCss("public/plugins/CodeMirror/theme/"+options.theme+".css");
				
				this.IDE = CodeMirror(self.editor,options);
				self.IDEStyle({position:"relative",minHeight:"100%"});
				self.method.send = function(ed, change, callback){
					if(callback && (change.hasOwnProperty("origin") && change.origin != "setValue") ) {
						return callback(self.IDEDefinitionLanguage(change), ed);
					}
				}
				self.method.response = function(data){
					if( typeof data.origin != "undefined" && data.origin == "setValue" ){
						return;
					}
					var _cursor = _self.IDE.getCursor();
					_self.IDE.replaceRange(data.text.join("\n"),data.from,data.to,data.origin);
					if(_cursor.ch != _self.IDE.getCursor().ch) {
						_self.IDE.setCursor(_cursor);
					}
				};
				return this.IDE;
			}
		}
	};
};
IDE.prototype._createContainer = function(obj) {
	var e = document.getElementById(obj);
	if( !e ){
		var o = document.createElement("div");
		o.id = obj;
		this.scope.appendChild(o);
		e = document.getElementById(obj);
	}
	e.className = "IDE";
	this.editor = e;
};
IDE.prototype.resetProperties = function(){
	this.scope = document.body;
	this.codeIDE = "ace";
	this.generalMethod = function(){};
	return this;
};
IDE.prototype.setEngine = function(engine) {
	if( this.engine.hasOwnProperty(engine.toString().toLowerCase()) )
		this.codeIDE = engine;
	return this;
};
IDE.prototype.registerOptions = function(options) {
	for(var op in options) {
		this.engine[this.codeIDE].options[op] = options[op];
	}
	return this;
};
IDE.prototype.registerEvent = function(method){
	var self = this;
	this.generalMethod = function(){
		if( method && method.hasOwnProperty("send") ) {
			self.IDE.on("change",function(arg1,arg2){
				if(!self.fromServer) {
					self.method.send(arg1,arg2,function(change, ed){
						method.send(change,ed);
					});	
				}
			});	
		}
		if( method && method.hasOwnProperty("response") ) {
			method.response(function(data) {
				self.fromServer = true;
				self.method.response(data);
				self.fromServer = false;
			});
		}	
	}
	return this;
};
IDE.prototype.registerKey = function(stringKey, callback){
	var i = this.engine[this.codeIDE].options;
	if( i.hasOwnProperty("extraKeys") ) {
		if(typeof stringKey == "object"){
			for(var a in stringKey) {
				i.extraKeys[a] = function(b,c,d) {
					if(stringKey[a])return stringKey[a](b,c,d);
				};
			}
		}
		else {
			i.extraKeys[stringKey] = function(a,b,c) {
				if(callback)return callback(a,b,c);
			};	
		}
	}
	return this;
};

IDE.prototype.on = function(stringKey,Command){
	var key = stringKey;
	switch(stringKey){
		case "save":
			key = {"Ctrl-S":Command};
		break;
		case "save.as":
			key = {"Ctrl-Shift-S":Command};
		break;
		case "refresh":
			key = {"Ctrl-R":Command};
		break;
		case "refresh.full":
			key = {"Ctrl-Shift-R":Command};
		break;
		case "autocomplete":
			key = {"Ctrl-Space":Command};
		break;
	}
	return this.registerKey(key,Command);
}

IDE.prototype.Create = function(target,scope){
	var self = this;
	if(typeof scope == "object") {
		this.scope = scope;
	}
	this._createContainer(target);
	
	this.IDE = new this.engine[this.codeIDE].setup();
	this.generalMethod();
	return this.resetProperties();
};

var IDE = new IDE();

var SocketIDE = function(){
	this.Container = null;
	this.globalEvent = {};
};
SocketIDE.prototype.isConnect = function(){
	if( typeof io == "undefined" )
		return false;
	return true
};
SocketIDE.prototype.register = function(obj){
	this.Container = obj;
	return this;
};

SocketIDE.prototype.on = function(method,callback){
	if(callback){
		this.globalEvent[method] = callback;
	}
};

SocketIDE.prototype.connectTo = function(url,params){
	if(!this.Container && !this.isConnect())return;
	var self = this;
	if(params){
		this.io = io.connect(url,params);
	}
	else {
		this.io = io.connect(url);
	}
	this.io.on("registered",function(id,content){
		var o = document.getElementsByClassName("IDE")[0];
		if(o)self.Container.removeChild(o);
		
		if(!self.globalEvent.hasOwnProperty("send")) {
			self.globalEvent.send = function(data,e){
				console.log("Send to server");
				self.io.emit("send",data,e.getValue());
			};
		}
		if(!self.globalEvent.hasOwnProperty("response")) {
			self.globalEvent.response = function(response){
				self.io.on("response",function(data){
					console.log("Receive from server");
					response(data);
				});
			};
		}
		for( var i in self.globalEvent){
			if( i != "send" && i != "response" ) {
				self.io.on(i,self.globalEvent[i]);
			}
		}
		var op = {value:content||""};
		var ide = IDE.setEngine("ace");
		ide.registerEvent(self.globalEvent);
		ide.registerOptions(op);
		ide.Create("SocketIDE-"+id,self.Container);
		
	});
	return this;
}

// var SocketIDE = new SocketIDE();
// var container = document.getElementById("editor");
// document.body.style.margin = 0;
// var url = "http://localhost:3000/SocketIDE";
// var params = {query:"fileName=/var/www/hello.js"};
// SocketIDE.register(container).connectTo(url,params);

