var IDE = {};
IDE.injected = false;
IDE.pluginPath = window.location.href.substring(0,window.location.href.lastIndexOf("/")) + "/public/plugins/";
IDE.createLink = function(linkURL,id){
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = linkURL;
		if(id)link.id = id;
		document.getElementsByTagName("head")[0].appendChild(link);
	};
IDE.doInject = function(engine,callback){
	if(IDE.injected)return false;
	var _this = this;
	var loaded = function(cb){ if(cb)return cb(_this); };
	var failure = function(){};
	var path = _this.pluginPath;
	this.ace = function(){
		if(typeof ace != "undefined"){
			return false;
		}
		var scriptPath = path + "ace/";
		var onLoaded = function(){
			Ext.Loader.injectScriptElement(path+"emmet-ace/emmet.js",loaded,failure,this);
			Ext.Loader.injectScriptElement(scriptPath+"src-noconflict/ext-emmet.js",loaded,failure,this);
			Ext.Loader.injectScriptElement(scriptPath+"src-noconflict/ext-language_tools.js",function(){loaded(callback)},failure,this);
			IDE.injected = true;
		};
		Ext.Loader.injectScriptElement(scriptPath+"src-noconflict/ace.js",onLoaded,failure,this);
	};
	this.codemirror = function(){
		if(typeof CodeMirror != "undefined"){
			return false;
		}
		var scriptPath = path + "codemirror/";
		var onLoaded = function(){
			Ext.Loader.injectScriptElement(path+"emmet-codemirror/dist/emmet.js",loaded,failure,this);
			Ext.Loader.injectScriptElement(scriptPath+"mode/javascript/javascript.js",loaded,failure,this);
			Ext.Loader.injectScriptElement(scriptPath+"keymap/sublime.js",loaded,failure,this);
			Ext.Loader.injectScriptElement(scriptPath+"mode/meta.js",loaded,failure,this);
			Ext.Loader.injectScriptElement(scriptPath+"addon/edit/closebrackets.js",loaded,failure,this);
			Ext.Loader.injectScriptElement(scriptPath+"addon/mode/loadmode.js",function(){loaded(callback)},failure,this);
			IDE.injected = true;
		};
		_this.createLink(scriptPath + "lib/codemirror.css");
		_this.createLink(scriptPath + "theme/cobalt.css",'codemirror-theme');
		Ext.Loader.injectScriptElement(scriptPath+"lib/codemirror.js",onLoaded,failure,this);
	};
	if(this[engine]){
		return this[engine]() || false;
	}
};

IDE.mode = {
	ace : function(mode){
		var modeList = {php:"php",sql:"mysql",html:"html",py:"python",xhtml:"xml",rb:"ruby",pl:"perl",java:"java",cpp:"c_cpp",jade:"jade",ini:"ini",css:"css",js:"javascript",svg:"svg",sh:"sh",cgi:"sh",scss:"scss",sass:"sass",xml:"xml",json:"json",md:"md",txt:"text",vala:"vala",yml:"yaml"};
		return "ace/mode/" + ( modeList[mode] || "text");
	},
	codemirror : function(mode){
		if(CodeMirror && typeof CodeMirror.findModeByExtension == "function"){
			return CodeMirror.findModeByExtension(mode);
		}
		else{
			var modeList = {"groovy": "groovy","ini": "properties","properties": "properties","css": "css","scss": "css","html": "htmlmixed","htm": "htmlmixed","shtm": "htmlmixed","shtml": "htmlmixed","xhtml": "htmlmixed","cfm": "htmlmixed","cfml": "htmlmixed","cfc": "htmlmixed","dhtml": "htmlmixed","xht": "htmlmixed","tpl": "htmlmixed","twig": "htmlmixed","hbs": "htmlmixed","handlebars": "htmlmixed","kit": "htmlmixed","jsp": "htmlmixed","aspx": "htmlmixed","ascx": "htmlmixed","asp": "htmlmixed","master": "htmlmixed","cshtml": "htmlmixed","vbhtml": "htmlmixed","ejs": "htmlembedded","dust": "htmlembedded","erb": "htmlembedded","js": "javascript","jsx": "javascript","jsm": "javascript","_js": "javascript","vbs": "vbscript","vb": "vb","json": "javascript","xml": "xml","svg": "xml","wxs": "xml","wxl": "xml","wsdl": "xml","rss": "xml","atom": "xml","rdf": "xml","xslt": "xml","xsl": "xml","xul": "xml","xbl": "xml","mathml": "xml","config": "xml","plist": "xml","xaml": "xml","php": "php","php3": "php","php4": "php","php5": "php","phtm": "php","phtml": "php","ctp": "php","c": "clike","h": "clike","i": "clike","cc": "clike","cp": "clike","cpp": "clike","c++": "clike","cxx": "clike","hh": "clike","hpp": "clike","hxx": "clike","h++": "clike","ii": "clike","ino": "clike","cs": "clike","asax": "clike","ashx": "clike","java": "clike","scala": "clike","sbt": "clike","coffee": "coffeescript","cf": "coffeescript","cson": "coffeescript","_coffee": "coffeescript","clj": "clojure","cljs": "clojure","cljx": "clojure","pl": "perl","pm": "perl","rb": "ruby","ru": "ruby","gemspec": "ruby","rake": "ruby","py": "python","pyw": "python","wsgi": "python","sass": "sass","lua": "lua","sql": "sql","diff": "diff","patch": "diff","md": "markdown","markdown": "markdown","mdown": "markdown","mkdn": "markdown","yaml": "yaml","yml": "yaml","hx": "haxe","sh": "shell","command": "shell","bash": "shell"};
			if(modeList[mode]){
				return {mode:modeList[mode],mime:"text/"+modeList[mode]};
			}
			return {mode:"text",mime:"text/plain"};
		}
	}
};
IDE.definitionLanguage = {
	ace: function(data){
		if(data.action)return data;
		if(data.length && data.length > 0){
			var changeData = [];
			for(var i in data){
				if(data[i].action){
					changeData.push(data[i]);
					continue;
				}
				if(data[i].origin == "+input" && (data[i].removed && data[i].removed.join("\n") != "") ){
					changeData.push(IDE.definitionLanguage.ace({
						origin: "+delete",
						from:data[i].from,
						to:data[i].to,
						text:[""]
					}));
				}
				changeData.push(IDE.definitionLanguage.ace(data[i]));
				if(data[i].origin == "emmet"){
					var abbr = data[i];
					abbr.origin = "+input";
					abbr.end = abbr.start;
					changeData.push(IDE.definitionLanguage.ace(abbr));
				}
			}
			return changeData;
		}
		var change = {
			action:"insertText",
			range:{
				start:{
					row:data.from.line,
					column:data.from.ch
				},
				end:{
					row:data.to.line,
					column:data.to.ch
				}
			},
			text:data.text.join("\n")
		};
		//dont remove case for dev guide
		switch(data.origin){
			case "+input":
				change.action = "insertText";
			break;
			case "+delete":
				change.action = "removeText";
			break;
			case "emmet":
				change.action = "removeText";
			break;
			case "cut":
				change.action = "removeText";
			break;
			case "drag":
				change.action = "removeText";
			break;
			case "paste":
				change.action = "insertText";
			break;
			case "undo":
				if(data.removed.length > 0 && data.removed.join("\n") != "")
				{
					change.action = "removeText";
				}
			break;
			case "redo":
				if(data.removed.length > 0 && data.removed.join("\n") != "")
				{
					change.action = "removeText";
				}
			break;
		}
		return change;
	},
	codemirror: function(data){
		if(!data.action)return data;
		var change = {
			origin:"",
			from:{
				line:data.range.start.row,
				ch:data.range.start.column
			},
			to:{
				line:data.range.end.row,
				ch:data.range.end.column
			},
			text:""
		};

		switch(data.action){
			case "insertText":
				change.origin = "+input";
				change.text = [data.text];
				change.to = change.from;
			break;
			case "removeText":
				change.origin = "+delete";
				change.text = [""];
			break;
			case "insertLines":
				change.origin = "+input";
				data.lines.push("");
				change.to = change.from;
				change.text = data.lines;
			break;
			case "removeLines":
				change.origin = "+delete";
				change.text = [""];
			break;
		}
		return change;
	}
};

IDE.Create = function(target,options){
	if(!target)return false;
	var editor = {};
	var $this = this;
	var fromServer = false;
	var opt = {
			engine			: "ace",
			value			: "",
			mode			: "html",
			theme			: "cobalt",
			onSave			: function(){},
			onSaveAs		: function(){},
			onRefresh		: function(){},
			onRefreshFull	: function(){},
			onChange		: function(){},
			onSend			: function(){},
			onResponse		: function(){},
			onRender		: function(ed){},
			renderTo		: document.body
	};
	if(typeof options == "object"){
		for(var o in options){
			opt[o] = options[o];
		}
	}
	if(typeof target == "string"){
		if(!document.getElementById(target)){
			var d = document.createElement("div");
			d.id = target;
			opt.renderTo.appendChild(d);	
		}
		editor = document.getElementById(target);
	}
	editor.innerHTML = "";
	var setStyle = function(style){
		for(var _style in style) {
			editor.style[_style] = style[_style];
		}
	};
	var Create = {
		ace:function(){
			if(typeof ace == "undefined"){
				if(!IDE.injected){
					IDE.doInject(opt.engine,function(){
						IDE.Create(target,options).resize();
					});
				}else{
					console.log("ace is not defined");
				}
				return false;
			}
			ace.require("ace/ext/language_tools");
			var ed = ace.edit(editor);
			var mode = $this.mode.ace(opt.mode);
			ed.engine = opt.engine;
			ed.setOptions({
				enableBasicAutocompletion: true,
				enableLiveAutocompletion:true,
				enableSnippets: true,
				enableEmmet:true,
				fontSize:14
			});
			setStyle({width:"100%",minHeight:"100%"});
			ed.setTheme("ace/theme/"+opt.theme);
			ed.getSession().setMode(mode);
			ed.$blockScrolling = Infinity;
			ed.session.setValue(opt.value || "",-1);
			ed.focus();
			ed.session.setUndoSelect(false);
			ed.commands.addCommand({
				name: "cmdsave"+new Date().getTime(),
				bindKey: {win: "Ctrl-S",mac:"Command-S"},
				exec: function(edit) {
					return opt.onSave(edit);
				}
			});
			ed.commands.addCommand({
				name: "cmdsaveas"+new Date().getTime(),
				bindKey: {win:"Ctrl-Shift-S",mac:"Command-Shift-S"},
				exec: function(edit) {
					return opt.onSaveAs(edit);
				}
			});
			ed.commands.addCommand({
				name: "cmdrefresh"+new Date().getTime(),
				bindKey: {win: "Ctrl-R",mac:"Command-R"},
				exec: function(edit) {
					return opt.onSaveAs(edit);
				}
			});
			ed.commands.addCommand({
				name: "cmdrefreshfull"+new Date().getTime(),
				bindKey: {win: "Ctrl-Shift-R",mac:"Command-Shift-R"},
				exec: function(edit) {
					return opt.onSaveAs(edit);
				}
			});
			ed.applyChanges = function(data){
				if(!data)return false;
				var change = IDE.definitionLanguage[ed.engine](data);
				this.session.getDocument().applyDeltas(change);
			};
			ed.on("change",function(change,edit){
				if(!fromServer){
					opt.onChange(change,edit);
					opt.onSend(change,edit);
				}
			});
			opt.onResponse(function(data){
				if(typeof data != "undefined"){
					fromServer = true;
					ed.applyChanges([data]);
					fromServer = false;	
				}
			});
			opt.onRender(ed);
			return ed;
		},
		codemirror:function(){
			if(typeof CodeMirror == "undefined"){
				if(!IDE.injected){
					IDE.doInject(opt.engine,function(){
						IDE.Create(target,options).resize();
					});
				}else{
					console.log("CodeMirror is not defined");
				}
				return false;
			}
			var mod = $this.mode.codemirror(opt.mode);
			var ed = CodeMirror(editor,{
				value				: opt.value || "",
				mode 				: mod.mime,
				autofocus			: true,
				lineNumbers			: true,
				lineWrapping		: true,
				theme				: opt.theme,
				viewportMargin		: 0,
				indentWithTabs		: true,
				indentUnit			: 4,
				keyMap				: "sublime",
				autoCloseBrackets	: true,
				extraKeys			: {
						"Ctrl-S"		: opt.onSave,
						"Ctrl-Shift-S"	: opt.onSaveAs,
						"Ctrl-R"		: opt.onRefresh,
						"Ctrl-Shift-R"	: opt.onRefreshFull
				}
			});
			CodeMirror.modeURL = "public/plugins/codemirror/mode/%N/%N.js";
			CodeMirror.autoLoadMode(ed,mod.mode);
			ed.engine = opt.engine;
			ed.setTheme = function(path){
				var href = $this.pluginPath+path+".css";
				var themeID = document.getElementById("codemirror-theme");
				if(!themeID){
					$this.createLink(href,'codemirror-theme');
				}else{
					themeID.href = href;
				}
				var theme = path.substring(path.lastIndexOf("/")+1);
				this.setOption("theme",theme);
			};
			ed.applyChanges = function(data){
				if(!data)return false;
				if(data.length){
					for(var i in data){
						var change = IDE.definitionLanguage[ed.engine](data[i]);
						this.replaceRange(
							change.text.join("\n"),
							change.from,
							change.to,
							change.origin
						);
					}
				}
			};
			ed.applyCursor = function(cursor){
				if(cursor && cursor.ch != ed.getCursor().ch)
					ed.setCursor(cursor);
			};
			ed.isValidData = function(data){
				if(typeof data != "undefined"){
					if( typeof data.origin != "undefined" && data.origin == "setValue" )
						return false;
					return true;
				}
				return false;
			};
			ed.on("change",function(edit,change){
				if(!fromServer && (change.hasOwnProperty("origin") && change.origin != "setValue")){
					opt.onChange(change,edit);
					opt.onSend(change,edit);
				}
			});
			ed.resize = function(){
				opt.renderTo.style.display = "block";
				opt.renderTo.style.height = "100%";
				ed.setSize("100%","100%");
				setStyle({position:"relative",tableLayout:"fixed",display:"block",minHeight:"100%"});
			};
			opt.onResponse(function(data){
				if(ed.isValidData(data)){
					fromServer = true;
					ed.applyChanges([data]);
					fromServer = false;	
				}
			});
			opt.onRender(ed);
			return ed;
		}
	}
	var mainEngine = opt.engine.toString().toLowerCase();
	return Create[mainEngine]();
}