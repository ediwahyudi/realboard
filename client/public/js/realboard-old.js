Ext.syncRequire(['Ext.util.Cookies', 'Ext.window.MessageBox','Ext.data.JsonP','Ext.ux.window.Notification']);
var myCookie = Ext.util.Cookies;
var RealBoard = {
	on:function(){return false},
	emit:function(){return false}
};
var IDE = IDE || {};
var APP_HOST_URL = window.location.href;
var CLIENT_URL = APP_HOST_URL.substring(0,APP_HOST_URL.lastIndexOf("/"));
var ROOT_URL = CLIENT_URL.substring(0,CLIENT_URL.lastIndexOf("/"));
var API_URL = CLIENT_URL+"/api/index.php/manager";
var ICON_PATH = CLIENT_URL+"/public/img";
var RealBoardSocket = "http://"+window.location.hostname+":3000";
var RealBoardIDE = {
	IDE:[],
	resize:function(){
		if(this.IDE.length){
			for(var i in this.IDE){
				if(this.IDE[i]){
					this.IDE[i].resize();
				}
			}
		}
	},
	engine:"ace"
};
var socketParams = [];

RealBoard.openSocket = function(){
	var onLoadSocket = function(){
		if(typeof io != "undefined"){
			var applyChat = function(data){
				var bd = Ext.getCmp("chat-body");
				var dt = new Date(data.date);
				bd.add({
					title: '<span class="fa fa-comment"></span> '+
					data.user.user_name + " | "+
					Ext.Date.format(dt,'Y-m-d H:i:s'),
					html:linkify(data.data),
					bodyPadding:5,
					border:0
				});
				Ext.getCmp("chat-body").body.scroll('bottom',1000);
			};
			RealBoard = io.connect(RealBoardSocket+"/RealBoard",{query:socketParams.join("&")});
			RealBoard.on("signed",function(data){});
			RealBoard.isConnected = true;
			RealBoard.on("joinedChat",function(chatData){
				var discussion = Ext.getCmp("discussion");
				if(chatData.length && discussion){
					for( var a in chatData ){
						if(chatData[a].server == "local"){
							applyChat(chatData[a]);
						}
					}
					var openDiscussion = setTimeout(function(){
						discussion.expand();
						Ext.getCmp("chat-body").body.scroll('bottom',1000);
						clearTimeout(openDiscussion);
					},4000);
				}
			});
			RealBoard.on("responseChat",function(data){
				var discussion = Ext.getCmp("discussion");
				if(discussion && data.server == "local"){
					discussion.expand();
					applyChat(data);
				}
			});
			RealBoard.on("responseChatFirebase",function(data){
				var discussion = Ext.getCmp("discussion");
				if(discussion && data.server == "firebase"){
					discussion.expand();
					applyChat(data);
				}
			});
			RealBoard.on("responseChatFirebase",function(data){
				var discussion = Ext.getCmp("discussion");
				if(discussion){
					discussion.expand();
					applyChat(data);
				}
			});
			RealBoard.on("responseUpdateProfile"+Sess.getId(),function(){
				Sess.refresh();
			});
			if(Sess.get("user_share") == "yes"){
				RealBoard.on("requestInviteCollab"+Sess.getId(),function(data){
					requestCollab(data);
				});
				RealBoard.on("requestInviteCollabAll",function(data){
					requestCollab(data);
				});
				RealBoard.on("responseReceiveCollab"+Sess.getId(),function(data){
					serverInfo(data,"User.joined");
				});
				RealBoard.on("responseRejectCollab"+Sess.getId(),function(data){
					serverInfo(data,"User.rejected");
				});
			}
			if(Sess.hasAccess("manager")){
				RealBoard.on("responseApplyTask",function(data){
					serverInfo(data,"Task.applied",'tc');
					Ext.getCmp("main-data").setActiveTab(1);
				});
			}
			RealBoard.on("responseTask",function(){
				Ext.getCmp("main-task-grid").getStore().load({params:{user:Sess.getId()}});
			});
			RealBoard.on("responseNewTask"+Sess.getId(),function(data){
				serverInfo(data,"Task.added",'tc');
				Ext.getCmp("main-data").setActiveTab(1);
			});
			RealBoard.on("responseUpdateTask"+Sess.getId(),function(data){
				serverInfo(data,"Task.updated",'tc');
				Ext.getCmp("main-data").setActiveTab(1);
			});
			RealBoard.on("responseRemoveTask"+Sess.getId(),function(data){
				serverInfo(data,"Task.removed",'tc');
				Ext.getCmp("main-data").setActiveTab(1);
			});
			RealBoard.on("responseSave",function(data){
				serverInfo(data,"File.saved");
			});
			RealBoard.on("responseNewfile",function(data){
				serverInfo(data,"File.created");
			});
			RealBoard.on("responseNewfolder",function(data){
				serverInfo(data,"Folder.created");
			});
			RealBoard.on("responseRemovefile",function(data){
				serverInfo(data,"File.removed");
			});
			RealBoard.on("responseRemovefolder",function(data){
				serverInfo(data,"Folder.removed");
			});
			RealBoard.on("responseUpload",function(data){
				serverInfo(data,"File.uploaded");
			});
			RealBoard.on("responseRenamefile",function(data){
				serverInfo(data,"File.renamed");
			});
			RealBoard.on("responseRenamefolder",function(data){
				serverInfo(data,"Folder.renamed");
			});
			RealBoard.on("responseConnected",function(data){
				serverInfo(data,"User.connected");
				refreshUserGrid();
			});
			RealBoard.on("responseLeave",function(data){
				serverInfo(data,"User.disconnected");
				refreshUserGrid();
			});
		}
	};
	var failLoadSocket = function(){
		console.log("Failed connect to socket");
	};
	Ext.Loader.injectScriptElement(RealBoardSocket+"/socket.io/socket.io.js",
	onLoadSocket,
	failLoadSocket,
	this);
};
var testSocket = function(){
	RealBoard.on("responseTest",function(message){console.log(message)});
	RealBoard.emit("test","Hey socket, am i connected to socket protocol?");
};

var mySession = function(){
	this.User = {user_id:0,user_access:[]};
};
mySession.prototype.getSession = function(){
	var sess = myCookie.get("IDE");
	if(sess){
		this.User = Ext.decode(sess);
		var protocol = (window.location.protocol || "http:") + "//";
		this.User.api = API_URL;
	}
	return this;
};
mySession.prototype.getAccess = function(callback){
	var _self = this;
	Ext.data.JsonP.request({
		url:API_URL+"/getUsers",
		params:{id:_self.User.user_id},
		success:function(access){
			if(access.user_access){
				_self.User.user_access = access.user_access;
			}
			if(callback){
				callback();
			}
		}
	});
	return this;
};
mySession.prototype.get = function(key){
	if(this.User[key]){
		return this.User[key];
	}
	return null;
};
mySession.prototype.getId = function(){
	return this.get("user_id");
};
mySession.prototype.hasAccess = function(access){
	if(this.get("user_access").indexOf(access) != -1){
		return true;
	}
	return false;
};
mySession.prototype.refresh = function(){
	var _this = this;
	Ext.data.JsonP.request({
		url:API_URL+"/getUsers",
		params:{user:_this.getId(),id:_this.getId()},
		success:function(data){
			myCookie.set("IDE",Ext.encode(data));
			_this.User = data;
			_this.getSession().getAccess();
			if(typeof changeTheme == "function"){
				changeTheme(_this.get("user_theme"));
			}
			if(typeof changeIDETheme == "function"){
				changeIDETheme(_this.get("user_theme_ide"));
			}
			if(typeof changeIDEEngine == "function"){
				if(_this.get("user_ide_engine") != RealBoardIDE.engine){
					changeIDEEngine(_this.get("user_ide_engine"));
				}
			}
		}
	});
};
var linkify = function(inputText) {
	if(!inputText)return "";
    var replacedText, replacePattern1, replacePattern2, replacePattern3;
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
    return replacedText;
}
var Sess = new mySession();
Ext.setGlyphFontFamily('FontAwesome');
Ext.Loader.setConfig({enabled: true});
var ExtThemeStore = Ext.create('Ext.data.Store',{
	fields: ['id','ext_theme','path'],
	autoLoad:true,
	data:[
		{"id":"gray","ext_theme":"Gray","path":"public/plugins/ext42/resources/css/ext-all-gray.css"},
		{"id":"classic","ext_theme":"Classic","path":"public/plugins/ext42/resources/css/ext-all.css"},
		{"id":"access","ext_theme":"Accessibility","path":"public/plugins/ext42/resources/css/ext-all-access.css"},
		{"id":"neptune","ext_theme":"Neptune","path":"public/plugins/ext42/resources/css/ext-all-neptune.css"}
	]
});
var TaskLevelStore = Ext.create('Ext.data.Store',{
	fields:['point','label'],
	data:[
		{"point":25,"label":"easy 25%"},
		{"point":50,"label":"medium 50%"},
		{"point":75,"label":"difficult 75%"},
		{"point":100,"label":"advanced 100%"}
	]
});
var changeTheme = function(theme){
	var tm = ExtThemeStore.getById(theme);
	if(tm){
		var link = document.getElementById("ext-theme-classes");
		link.href = CLIENT_URL+'/'+tm.get("path");
	}
};
var changeIDETheme = function(theme){
	var tm = theme || Sess.get("user_theme_ide");
	if(RealBoardIDE.IDE.length > 0){
		for(var o in RealBoardIDE.IDE){
			RealBoardIDE.IDE[o].setTheme(RealBoardIDE.engine+"/theme/"+tm);
		}
	}
};
var changeIDEEngine = function(engine){
	IDE.injected = false;
	RealBoardIDE.engine = engine;
	var _this = this,
		mainTab = Ext.getCmp("main-tab"),
		openedIDE = myCookie.get("openIDE"),
		open;

	if(tabHistory){
		tabHistory.close();
	}
	if( _this.injected && _this.injected[RealBoardIDE.engine] ){
			if(open = Ext.decode(openedIDE)){
				for(var i in open){
					RealBoardIDE.open(open[i]);
				}
			}
	}else{
		IDE.doInject(RealBoardIDE.engine,function(){
			if(open = Ext.decode(openedIDE)){
				for(var i in open){
					RealBoardIDE.open(open[i]);
				}
			}
			_this.injected = {"ace":true,"codemirror":true};
		});
	}
	myCookie.set("openIDE",openedIDE);
};
var reusable = null;
var Notify = function(html,title,position){
	return Ext.create('widget.uxNotification', {
		title: title || 'Notification',
		position: position || 'tr',
		manager: 'instructions',
		cls: 'ux-notification-light',
		iconCls: 'ux-notification-icon-information',
		html: html || 'Sample message.',
		autoCloseDelay: 5000,
		slideBackDuration: 500,
		slideInAnimation: 'bounceOut',
		slideBackAnimation: 'easeIn'
	});
};
var fieldEdit = Ext.create("Ext.Editor", {field: {xtype: 'textfield'}});
var gridOptions = function(fields,columnOptions){
	var fieldData = {
		Sorter:[],
		Fields:[],
		Colums:[]
	};
	var colOpt = columnOptions || [];
	for(var a in fields){
		fieldData.Sorter.push({property:a,direction:"DESC"});
		fieldData.Fields.push(a);
		var col = {dataIndex:a,text:fields[a]};
		if(colOpt[a]){
			for(var x in colOpt[a]){
				col[x] = colOpt[a][x];
			}
		}
		fieldData.Colums.push(col);
	}
	return fieldData;
};
var gridID = 0;
var generateGrid = function(options){
	gridID++;
	var params = options.params || {};
	var Limit = options.limit || 20;
	var Opt = gridOptions(options.fields,options.colOptions);
	var optStore = {
		id:options.id || "grid-store-id-"+gridID,
		autoLoad:{start:0,limit:Limit},
		pageSize:Limit,
		fields:Opt.Fields,
		proxy: {
			type: 'jsonp',
			url : API_URL+options.url,
			extraParams:params,
			reader: {
		        type: 'json',
		        root: 'items',
		        totalProperty: 'total'
		    }
		},
		sorters: Opt.Sorter
	};
	if(options.storeOptions){
		for(var o in options.storeOptions){
			optStore[o] = options.storeOptions[o];
		}
	}
	var store = Ext.create('Ext.data.Store',optStore);
	if(options.extendColumns){
		for(var c in options.extendColumns){
			Opt.Colums.push(options.extendColumns[c]);
		}
	}
	var optGrid = {
		layout:"fit",
		store: store,
		id:options.gridId || "grid-id-"+gridID,
		columns: Opt.Colums,
		dockedItems: [{
			xtype: 'pagingtoolbar',
			store: store,
			dock: 'bottom',
			displayInfo: true
		}],
		forceFit:true
	};
	if(options.title){
		optGrid.title = options.title;
	}
	if(options.width){
		optGrid.width = options.width;
	}
	if(options.layout){
		optGrid.layout = options.layout;
	}
	if(options.gridOptions){
		for(var g in options.gridOptions){
			optGrid[g] = options.gridOptions[g];
		}
	}
	if(options.action && typeof options.action == "function"){
		optGrid.listeners = {
			itemdblclick:function(_this, record, item, index, e, eOpts){
				options.action(_this, record, item, index, e, eOpts);
			}
		};
	}
	var theGrid = Ext.create('Ext.grid.Panel', optGrid);
	var theFilter = Ext.create('Ext.form.Panel', {
						layout:'fit',
						bodyPadding:0,
						border:0,
						items: [{
							xtype: 'textfield',
							id:"filter-grid-"+gridID,
							name: 'search',
							emptyText:"Search",
							allowBlank: true,
							minWidth:300,
							listeners:{
								specialkey:function(me,e){
									if (e.getKey() == e.ENTER) {
										params["search"] = me.value;
										store.load({params:params});
									}
								}
							}
						}]
					});
	var optContainer = {
		items:[theFilter,theGrid],
		width:Ext.getBody().getWidth()-20,
		bodyPadding:0,
		border:0
		};
	if( options.container ){
		for(var g in options.container){
			if(g == "items"){
				for(var r in options.container[g]){
					optContainer.items.push(options.container[g][r]);
				}
				continue;
			}
			optContainer[g] = options.container[g];
		}
	}
	return Ext.create("Ext.panel.Panel",optContainer);
};
//MENU
var Menu = Ext.create('Ext.panel.Panel', {
			layout: 'fit',
			border: false,
			bodyPadding: 0,
			id:"main-menu-container",
			border: 0,
			items: [{
					xtype: 'buttongroup',
					columns: 3,
					id:"main-menu",
					items: [{
						text: 'User',
						arrowAlign: 'right',
						menu: [{
							text: 'Profile Settings',
							listeners:{
								click:function(){
									manageProfile(Sess.User,function(userData){
										Sess.refresh();
										RealBoard.emit("sendUpdateProfile",userData);
									});
								}
							}
						}, {
							text: 'Sign out',
							listeners:{
								click:function(){
									Ext.Ajax.request({
										url:API_URL+"/sendSignout",
										method:"POST",
										params:{uid:Sess.getId()},
										success:function(){
											myCookie.clear("IDE");
											window.location = "";
										}
									});
								}
							}
						}]
					}]
			}]
		});
var createTipFor = function(id,text){
	var tip = Ext.create('Ext.tip.ToolTip', {
			target:id,
			html:text || 'Blank tooltip'
		});
};
var manageProfile = function(newData,callback){
	var defaultData = {
		user_id:0,
		user_name:"",
		user_email:"",
		user_active:"offline",
		user_theme:"gray",
		user_theme_ide:"cobalt",
		user_ide_engine:"ace",
		user_share:"no",
		user_active:"offline"
	};
	if(Ext.getCmp("profile-window")){
		Ext.getCmp("profile-window").close();
	}
	var data = newData || defaultData;
	var windowButton = [{
							text: 'Save',
							handler: function() {
								var form = this.up('form').getForm();
								if(form.isValid()){
									form.submit({
										url: API_URL+"/saveProfile",
										waitMsg: 'Saving profile ...',
										success: function(fp, o) {
											if(o.result.success){
												if(o.result.data){
													if(callback && typeof callback == "function"){
														Ext.getCmp("profile-window").close();
														return callback(o.result.data,"saving");
													}
												}
												else{
													Ext.Msg.alert('Failed', o.result.message);
												}	
											}
											else{
												Ext.Msg.alert('Failed', 'Undefined email or password.');
											}
										}
									});
								}
							}
						}];
	if(Sess.hasAccess("superuser") && Sess.getId() != data.user_id && data.user_id != 0){
		windowButton.unshift({
			text:"Remove",
			handler:function(){
				Ext.Msg.show({
					title:'Remove User?',
					msg: "Remove user permanently!",
					buttons: Ext.Msg.OKCANCEL,
					icon: Ext.Msg.QUESTION,
					fn:function(choose){
						if(choose == "ok"){
							Ext.data.JsonP.request({
								url:API_URL+"/sendRemoveUser",
								params:{user:Sess.getId(),id:data.user_id},
								success:function(o){
									if(o.success){
										Ext.getCmp("profile-window").close();
										RealBoard.emit("sendRemoveProfile",data);
										return callback(o,"removing");
									}
									else{
										Ext.Msg.alert('Failed', 'Cannot remove user "'+data.user_name+'". Please check your permission.');
									}
								}
							});
						}
					}
				});
			}
		});
	}
	var passField = {
					xtype: 'textfield',
					name: 'passwd',
					id:'new-passwd',
					fieldLabel: 'Password',
					inputType:'password'
				};
	if(data.user_id == 0){
		passField.allowBlank = false;
	}
	var profile = Ext.create('Ext.form.Panel', {
						width: 250,
						bodyPadding: 10,
						items: [{
							xtype: 'hiddenfield',
							name: 'uid',
							value:data.user_id
						},{
							xtype: 'textfield',
							name: 'name',
							fieldLabel: 'Name',
							value:data.user_name,
							allowBlank: false
						},{
							xtype: 'textfield',
							name: 'email',
							fieldLabel: 'Email',
							vtype: 'email',
							value:data.user_email,
							allowBlank: false
						},
						passField
						,{
							xtype: 'textfield',
							name: 'ip',
							id:'new-ip',
							fieldLabel: 'IP Address',
							value:data.user_ip,
							allowBlank: false
						},{
							xtype: 'combobox',
							name: 'theme',
							valueField:'id',
							displayField:'ext_theme',
							store:ExtThemeStore,
							fieldLabel: 'Ext Theme',
							allowBlank: false,
							editable:false,
							value:data.user_theme
						},{
							xtype: 'combobox',
							name: 'ide_engine',
							id:'ide_engine',
							store:["ace","codemirror"],
							fieldLabel: 'IDE Engine',
							allowBlank: false,
							editable:false,
							value:data.user_ide_engine,
							listeners:{
								change:function(_this, newValue, oldValue){
									var theme = Ext.getCmp("theme_ide");
									theme.getStore().load({params:{file:newValue}});
									theme.setValue("cobalt");
								}
							}
						},{
							xtype: 'combobox',
							name: 'theme_ide',
							id: 'theme_ide',
							valueField:'theme',
							displayField:'theme',
							store: Ext.create('Ext.data.Store', {
									fields: ['theme'],
									autoLoad:true,
									proxy: {
										type: 'jsonp',
										url : API_URL+"/getThemes",
										extraParams:{file:data.user_ide_engine}
									}
								}),
							fieldLabel: 'IDE Theme',
							allowBlank: false,
							editable:false,
							value:data.user_theme_ide
						},{
							xtype: 'fieldcontainer',
							fieldLabel: 'Enable share',
							defaultType:'radiofield',
							items:[{
									boxLabel:'Yes',
									name:'share',
									inputValue:'yes',
									id:"share-yes"
								},{
									boxLabel:'No',
									name:'share',
									inputValue:'no',
									id:"share-no"
								}]
						},{
							xtype: 'fieldcontainer',
							fieldLabel: 'Status',
							defaultType:'radiofield',
							items:[{
									boxLabel:'Online',
									name:'status',
									inputValue:'online',
									id:"status-online"
								},{
									boxLabel:'Offline',
									name:'status',
									inputValue:'offline',
									id:"status-offline"
								}]
						}],
						buttons: windowButton
					});
		var profileWindow = Ext.create('Ext.window.Window', {
			title: 'Profile Settings',
			id:"profile-window",
			closable:true,
			draggable:true,
			resizable:false,
			width: 300,
			layout: 'fit',
			items: profile,
			closeAction:"destroy",
			y:100
		}).show();
		if(data.user_id != 0){
			createTipFor('new-passwd',"Leave blank if no change");
		}
		createTipFor('new-ip',"Allow user to signin without email with this IP Address");
		var isShare = Ext.getCmp("share-"+data.user_share);
		var stat = Ext.getCmp("status-"+data.user_active);
		if(isShare){
			isShare.setValue(true);
		}
		if(stat){
			stat.setValue(true);
		}
};
var RootNode = ".";
var treeStore = Ext.create('Ext.data.TreeStore', {
    model: 'Summary',
    storeId: 'myStore',
    proxy: {
        type: 'jsonp',
        url: API_URL+"/getList",
        reader: {
            type: 'json'
        }
    },
    autoLoad: true,
    root: {
        pid: 'www',
        text: 'www',
        expanded: true,
        id: RootNode
    }
});
var Tree = Ext.create('Ext.tree.Panel', {
    store: treeStore,
    rootVisible: false,
    layout: 'fit',
    fixed: false,
    autoScroll: true,
    height: 500,
    border: 0,
    rootVisible: true,
    id: "main-tree"
});
var allowedMode = {php:"php",sql:"mysql",html:"html",py:"python",xhtml:"xml",rb:"ruby",pl:"perl",java:"java",cpp:"c_cpp",jade:"jade",ini:"ini",css:"css",js:"javascript",svg:"svg",sh:"sh",cgi:"sh",scss:"scss",sass:"sass",xml:"xml",json:"json",md:"md",txt:"text",vala:"vala",yml:"yaml"};
var openHistory = [];
var tabHistory = {
	clear:function(id,clearForSet){
		if(openHistory.indexOf(id) != -1) {
		    openHistory.splice(openHistory.indexOf(id), 1);
		}
		if(!clearForSet){
			myCookie.set("openIDE",Ext.encode(openHistory));
		}
	},
	set:function(id){
		this.clear(id,true);
		if(openHistory.indexOf(id) == -1){
			openHistory.push(id);
			myCookie.set("openIDE",Ext.encode(openHistory));
		}
	},
	restore:function(){
		var openedIDE = myCookie.get("openIDE");
		if(openedIDE) {
			openHistory = Ext.decode(openedIDE);
			if( openHistory.length ){
				for(var a in openHistory){
					RealBoardIDE.open(openHistory[a]);
				}
			}
		}
	},
	close:function(id){
		var mainTab = Ext.getCmp("main-tab"),theId = Ext.getCmp(id);
		if(id && theId){
			theId.close();
		}else{
			mainTab.items.each(function(item){
				if(item.closable){
					item.close();
				}
			});
			if(tabSeq)tabSeq = -1;
			RealBoardIDE.IDE = [];
		}
	},
	hasItem:function(id){
		if(openHistory.length && openHistory.indexOf(id) != -1){
			return true;
		}
		return false;
	}
};
var tabSeq = -1;
RealBoardIDE.open = function(node,nodeValue){
	var isNode = ( typeof node == "string" ) ? false : true;
	var iId = isNode ? node.getId() : node;
	var tId = 'tab-' + iId;
	var tabs = Ext.getCmp('main-tab');
	tabSeq++;
	var lockIDE = false;
	var seq = tabSeq;
    if (document.getElementById(tId)) {
		if(Ext.getCmp(tId)){
			tabs.setActiveTab(tId);
		}
        return false;
    }
    Ext.data.JsonP.request({
		url : API_URL+"/getContentData",
		params:{file:iId,user:Sess.getId()},
		success:function(data){
			if(!data.success) {
				Ext.Msg.alert("Error","Sorry. file "+iId+" cannot to open!");
				return false;
			}
			var ex = iId.split(".");
			ex = ex[ex.length-1] || "txt";
			var mod = typeof allowedMode[ex] != "undefined" ? allowedMode[ex] : undefined;
			if(!mod){
				Ext.Msg.alert('Error', 'Sorry file does not support for IDE.');
				return false;
			}
			var t;
			if(isNode){
				t = node.get("text");
			}
			else{
				var m = (typeof node == "string") ? node.split("/") : false;
				t = m[m.length-1] || new Date().getTime();
			}
			var nodeTitle = t.length <= 10 ? t : t.substring(0, 10) + "...";
			tabs.add({
				id: tId,
				title: nodeTitle,
				bodyPadding: 0,
				closable: true,
				html: node.id,
				tooltip: iId,
				listeners:{
					beforeclose:function(tab){
						if(tab.title.substring(0,2) == "* "){
							Ext.Msg.show({
								title: 'Close IDE?',
								msg: 'Close file without saving?',
								buttons: Ext.Msg.YESNO,
								icon: Ext.Msg.QUESTION,
								fn: function(choose) {
									if(choose == "yes"){
										tabHistory.clear(iId);
										var curTab = Ext.getCmp(tId);
										curTab.setTitle(nodeTitle);
										curTab.close();
										if(RealBoardIDE.IDE[seq]){
											RealBoardIDE.IDE.splice(seq,1);
										}
									}
								}
							});
							return false;
						}
						else{
							if(RealBoardIDE.IDE[seq]){
								RealBoardIDE.IDE.splice(seq,1);
							}
							tabHistory.clear(iId);
						}
					},
					activate:function(){
						if(RealBoardIDE.IDE[seq]){
							RealBoardIDE.IDE[seq].focus();
							RealBoardIDE.IDE[seq].resize();
						}
					},
					afterrender:function(){
						var newTab = Ext.getCmp(tId);
						tabHistory.set(iId);
						var ideValue = nodeValue || data.data;
						if( !ideValue || ideValue === null ){
							ideValue = "";
						}
						RealBoardIDE.IDE[seq] = IDE.Create(tId+"-innerCt",{
							mode:ex,
							engine:RealBoardIDE.engine,
							theme:Sess.get("user_theme_ide") || "cobalt",
							value: ideValue,
							renderTo:document.getElementById(tId+"-outerCt"),
							onChange:function(change,ide){
								newTab.setTitle("* "+nodeTitle);
							},
							onSend:function(change,ed){
								if(!lockIDE && Sess.get("user_share") == "yes"){
									RealBoard.emit("sendIDE",{IDE:change,file:iId});
								}
							},
							onResponse:function(response){
								if(Sess.get("user_share") == "yes"){
									lockIDE = true;
									RealBoard.on("responseIDE"+iId,function(res){
										newTab.setTitle("* "+nodeTitle);
										response(res.IDE);
									});
									lockIDE = false;
								}
							},
							onSave:function(ide){
								if(newTab.title != nodeTitle){
									Ext.Ajax.request({
										url:API_URL+"/sendContentData?user="+Sess.getId(),
										method:"POST",
										params:{data:ide.getValue(),file:iId},
										success:function(){
											newTab.setTitle(nodeTitle);
											RealBoard.emit("saveIDE",iId);
										}
									});
								}
							},
							onRender:function(e){
								e.focus();
							}
						});
						if(Sess.get("user_share") == "yes"){
							RealBoard.on("responseSaveIDE"+iId,function(){
								newTab.setTitle(nodeTitle);
							});
							
							RealBoard.emit("requestIDEValue",{user:Sess.getId(),file:iId});
							RealBoard.on("responseIDEValue"+Sess.getId()+iId,function(deltas){
								lockIDE = true;
								if(deltas.length && RealBoardIDE.IDE[seq]){
									RealBoardIDE.IDE[seq].applyChanges(deltas);	
								}
								lockIDE = false;
							});
						}
					}
				}
			});
			tabs.setActiveTab(tId);
			if(RealBoardIDE.IDE[seq]){
				RealBoardIDE.IDE[seq].resize();
			}
		}
	});
};
var formTask = function(newData,callback){
	var defaultData = {
		job_id:0,
		task_id:0,
		task_title:"",
		task_desc:"",
		task_deadlinedate:Ext.Date.format(new Date(),'Y-m-d'),
		task_deadlinetime:"08:00:00",
		task_status:"waiting",
		task_level:25,
		user_id:[]
	};
	var win = Ext.getCmp("task-window-add");
	if(win){
		win.close();
	}
	var data = defaultData;
	if(newData){
		for(var i in newData){
			data[i] = newData[i];
		}
	}
	var taskButton = [{
				text: 'Save',
				handler: function() {
					var form = this.up('form').getForm();
					if(form.isValid()){
						var values = form.getValues();
						form.submit({
							url: API_URL+"/saveTask",
							waitMsg: 'Saving ...',
							success: function(fp, o) {
								var win = Ext.getCmp("task-window-add");
								if(win){
									win.close();
								}
								if(callback){
									if(!o.result)return;
									var type = data.task_id != 0 ? "Update":"New";
									var val = {};
									for(var i in values){
										if(i == 'user_id[]'){
											val['user_id'] = values[i];
										}
										else{
											val[i] = values[i];
										}
									}
									return callback({data:val,type:type});
								}
							}
						});						
					}
				}
			}];
	if(data.task_id != 0){
		taskButton.unshift({
			text:"Remove",
			handler:function(){
				Ext.Msg.show({
					title:'Remove Task?',
					msg: "Remove Task permanently!",
					buttons: Ext.Msg.OKCANCEL,
					icon: Ext.Msg.QUESTION,
					fn:function(b,t){
						if(b == "ok"){
							Ext.data.JsonP.request({
								url:API_URL+"/removeTask",
								params:{id:data.task_id},
								success:function(o){
									if(o.success){
										var win = Ext.getCmp("task-window-add");
										if(win){
											win.close();
										}
										if(callback){
											return callback({data:data,type:"Remove"});
										}
									}
								}
							});	
						}
					}
				});
			}
		});
	}
	var taskForm = Ext.create('Ext.form.Panel', {
		width: 250,
		bodyPadding: 10,
		items: [{
			xtype: 'hiddenfield',
			name: 'job_id',
			value:data.job_id
		},{
			xtype: 'hiddenfield',
			name: 'task_id',
			value:data.task_id
		},{
			xtype: 'textfield',
			fieldLabel: 'Title',
			name: 'task_title',
			value:data.task_title,
			width:300,
			anchor:'100%'
		},{
			xtype:"combobox",
			fieldLabel: 'Level',
			name:"task_level",
			store: TaskLevelStore,
			displayField: 'label',
			valueField: 'point',
			allowBlank: false,
			//editable:false,
			value:data.task_level,
			width:250
		},{
			xtype: 'htmleditor',
			name: 'task_desc',
			fieldLabel: 'Description',
			value:data.task_desc,
			allowBlank: false,
			width:700,
			height:200,
			grow:true,
			anchor : '100%'
		},{
			xtype:"combobox",
			fieldLabel: 'Status',
			name:"task_status",
			store: ["waiting","progress","revision","done"],
			allowBlank: false,
			editable:false,
			value:data.task_status,
			width:250
		},{
			xtype: 'datefield',
			name: 'task_deadlinedate',
			fieldLabel: 'Deadline Date',
			value:data.task_deadlinedate,
			allowBlank: false,
			editable:false,
			format:'Y-m-d',
			width:200
		},{
		    xtype: 'timefield',
		    name: 'task_deadlinetime',
		    fieldLabel: 'Dedline time',
		    minValue: '8:00 AM',
		    maxValue: '11:00 PM',
		    increment: 30,
		    value:data.task_deadlinetime,
		    width:200,
		    format:"H:i:s"
		},{
	        xtype: 'checkboxgroup',
	        fieldLabel: 'Team',
	        columns: 4,
	        vertical: true,
	        allowBlank:false,
	        id:"check-user-task-"+data.task_id
	    }],
		buttons: taskButton
	});
	Ext.data.JsonP.request({
		url:API_URL+"/getUserTaskList",
		params:{id:data.task_id},
		success:function(o){
			if(o)Ext.getCmp("check-user-task-"+data.task_id).add(o);
		}
	});
	Ext.create('Ext.window.Window', {
		title: '<i class="fa fa-pencil"></i> Task Settings',
		id:"task-window-add",
		minWidth:900,
		minHeight:250,
		border:0,
		layout: 'fit',
		items: taskForm,
		maximizable:true,
		y:70
	}).show();
};
var formJob = function(newData,callback){
	var defaultData = {
		project_id:0,
		project_title:"",
		job_id:0,
		job_title:"",
		job_desc:"",
		job_datestart:Ext.Date.format(new Date(),'Y-m-d'),
		job_datefinish:"",
		job_status:"start"
	};
	var win = Ext.getCmp("job-window-add");
	if(win){
		win.close();
	}
	var data = defaultData;
	if(newData){
		for(var i in newData){
			data[i] = newData[i];
		}
	}
	var jobButton = [{
				text: 'Save',
				handler: function() {
					var form = this.up('form').getForm();
					if(form.isValid()){
						form.submit({
							url: API_URL+"/saveJob",
							waitMsg: 'Saving ...',
							success: function(fp, o) {
								var win = Ext.getCmp("job-window-add");
								if(win){
									win.close();
								}
								if(callback){
									var type = data.job_id != 0 ? "Update" : "New";
									return callback({data:o.result.data,type:type});
								}
							}
						});						
					}
				}
			}];
	if(data.job_id != 0){
		jobButton.unshift({
					text:'<i class="fa fa-plus"></i> Add Task',
					tooltip:'Add task for this job',
					handler:function(){
						formTask(data,function(values){
							var e = Ext.getCmp("task-grid-"+data.job_id);
							if(e){
								e.getStore().load({params:{id:data.job_id}});
								RealBoard.emit("sendTask",values);
							}
						});
					}
				});
		jobButton.unshift({
			text:"Remove",
			handler:function(){
				Ext.Msg.show({
					title:'Remove Job?',
					msg: "Remove Job permanently!",
					buttons: Ext.Msg.OKCANCEL,
					icon: Ext.Msg.QUESTION,
					fn:function(b,t){
						if(b == "ok"){
							Ext.data.JsonP.request({
								url:API_URL+"/removeJob",
								params:{id:data.job_id},
								success:function(o){
									if(o.success){
										var win = Ext.getCmp("job-window-add");
										if(win){
											win.close();
										}
										if(callback){
											return callback({data:data,type:"Remove"});
										}
									}
								}
							});	
						}
					}
				});
			}
		});
	}
	var jobForm = Ext.create('Ext.form.Panel', {
		width: 250,
		bodyPadding: 10,
		items: [{
			xtype: 'hiddenfield',
			name: 'project_id',
			value:data.project_id
		},{
			xtype: 'hiddenfield',
			name: 'job_id',
			value:data.job_id,
			allowBlank: false
		},{
			xtype: 'textfield',
			fieldLabel: 'Title',
			name: 'job_title',
			value:data.job_title,
			width:300,
			anchor:'100%'
		},{
			xtype:'hiddenfield',
			name: 'job_desc',
			value:data.job_desc
		},{
			xtype: 'datefield',
			name: 'job_datestart',
			fieldLabel: 'Start Date',
			value:data.job_datestart,
			allowBlank: false,
			editable:false,
			format:'Y-m-d',
			width:250
		},{
			xtype:"combobox",
			fieldLabel: 'Status',
			name:"job_status",
			store: ["prepared","released","completed"],
			allowBlank: false,
			editable:false,
			value:data.job_status,
			width:200
		}],
		buttons: jobButton
	});
	Ext.create('Ext.window.Window', {
		title: '<i class="fa fa-pencil"></i> '+data.project_title+' Job Settings',
		id:"job-window-add",
		minWidth:850,
		minHeight:300,
		border:0,
		layout: 'fit',
		items: jobForm,
		maximized:true,
		maximizable:true,
		y:70
	}).show();
	if(data.job_id != 0){
		var taskGrid = generateGrid({
			fields:{
				"task_id":"#Task ID",
				"user_name":"For",
				"task_deadlinedate":"Deadline Date",
				"task_deadlinetime":"Deadline Time",
				"task_title":"Title",
				"task_desc":"Description",
				"task_comment":"Comment",
				"task_level":"Level",
				"task_status":"Status",
				"user_id":"#User ID",
				"job_id":"#Job ID"
			},
			url:"/getTask",
			colOptions:{
				"task_id":{hidden:true},
				"job_id":{hidden:true},
				"user_id":{hidden:true},
				"task_desc":{hidden:true},
				"user_name":{hidden:true}
			},
			gridId:"task-grid-"+data.job_id,
			params:{id:data.job_id},
			container:{
				title:"Task list of "+data.job_title,
				width:Ext.getCmp("job-window-add").getWidth()-30
			},
			extendColumns:[{
					xtype:'actioncolumn',
					width:50,
					items: [{
						icon:ICON_PATH+"/man/edit.png",
						tooltip: 'Edit',
						handler: function(grid, rowIndex, colIndex) {
							var record = grid.getStore().getAt(rowIndex);
							formTask(record.data,function(values){
								grid.getStore().load();
								RealBoard.emit("sendTask",values);
							});
						}
					}]
			}]
		});
		jobForm.add(taskGrid);
	}
};
var applyTask = function(data,callback){
	var win = Ext.getCmp("task-window-apply");
	if(win){
		win.close();
	}
	var taskForm = Ext.create('Ext.form.Panel', {
		width: 250,
		bodyPadding: 10,
		items: [{
			xtype: 'hiddenfield',
			name: 'task_id',
			value:data.task_id
		},{
			xtype: 'textfield',
			fieldLabel: 'Job',
			value:data.task_summary,
			anchor:'100%',
			readOnly:true
		},{
			xtype: 'textfield',
			fieldLabel: 'Task',
			name: 'task_title',
			value:data.task_title,
			anchor:'100%',
			readOnly:true
		},{
			xtype: 'textfield',
			fieldLabel: 'Deadline',
			value:data.task_deadline,
			readOnly:true
		},{
			xtype: 'hiddenfield',
			fieldLabel: 'Job Description',
			value:data.job_desc
		},{
			xtype: 'htmleditor',
			fieldLabel: 'Task Description',
			value:data.task_desc,
			enableAlignments:false,
			enableColors:false,
			enableFont:false,
			enableFontSize:false,
			enableFormat:false,
			enableLinks:false,
			enableLists:false,
			enableSourceEdit:false,
			anchor : '100%',
			readOnly:true
		},{
			xtype:"combobox",
			fieldLabel: 'Status',
			name:"task_status",
			store: ["waiting","progress","done"],
			allowBlank: false,
			editable:false,
			value:data.task_status,
			width:250
		},{
			xtype: 'textareafield',
			fieldLabel: 'Comment',
			grow      : true,
			value:data.task_comment,
			anchor:'100%'
		},{
	        xtype: 'checkboxgroup',
	        fieldLabel: 'Team',
	        columns: 4,
	        vertical: true,
	        id:"check-user-task"
	    }],
		buttons: [{
				text: 'Apply',
				handler: function() {
					var form = this.up('form').getForm();
					if(form.isValid()){
						var values = form.getValues();
						form.submit({
							url: API_URL+"/applyTask",
							waitMsg: 'Applying ...',
							success: function(fp, o) {
								var win = Ext.getCmp("task-window-apply");
								if(win){
									win.close();
								}
								if(callback){
									return callback(values);
								}
							}
						});						
					}
				}
			}]
	});
	Ext.data.JsonP.request({
		url:API_URL+"/getUserTaskList",
		params:{id:data.task_id},
		success:function(o){
			if(o)Ext.getCmp("check-user-task").add(o);
		}
	});
	Ext.create('Ext.window.Window', {
		title: '<i class="fa fa-pencil"></i> Task Settings',
		id:"task-window-apply",
		minWidth:900,
		minHeight:250,
		border:0,
		layout: 'fit',
		items: taskForm,
		maximizable:true,
		maximized:true,
		y:70
	}).show();
}
Tree.on('itemcontextmenu', function(view, record, item, index, event) {
    var node = record;
    var t = node.get('text');
    var nodeTitle = t.length <= 10 ? t : t.substring(0, 10) + "...";
    var openItem =
        {
            text: 'Open',
	        iconCls:"fa fa-folder-open-o",
            listeners: {
                click: function(a, b) {
                    if (node.get("cls") == "file") {
						RealBoardIDE.open(node);
                    } else {
                        node.expand();
                    }
                }
            }
        };
    var menuItems = [{
        text: 'Copy',
        iconCls:"fa fa-copy",
        listeners: {
            click: function(a, b) {
                var file = {
                    name: node.get("text"),
                    id: node.getId(),
                    fullPath: node.internalId,
                    parentId: node.get("parentId"),
                    method: "copy"
                };
                myCookie.set("pasteData", Ext.encode(file));
            }
        }
    }, {
        text: 'Cut',
        iconCls:'fa fa-scissors',
        listeners: {
            click: function(a, b) {
                var file = {
                    name: node.get("text"),
                    id: node.getId(),
                    fullPath: node.internalId,
                    parentId: node.get("parentId"),
                    method: "cut"
                };
                item.style.opacity = 0.5;
                myCookie.set("pasteData", Ext.encode(file));
            }
        }
    }, {
        text: 'Rename',
        iconCls:"fa fa-edit",
        listeners: {
            click: function(menu, i, e) {
                if (!item) return;
                fieldEdit.startEdit(Ext.get(item), node.get('text'));
                fieldEdit.on('complete', function(me, value) {
                    node.set('text', value);
                    var parameters = {node:node.getId(),file:node.get("parentId")+"/"+value,user:Sess.getId()};
                    Ext.data.JsonP.request({
                    	url:API_URL+"/sendRename",
                    	params:parameters,
                    	success:function(o){
                    		if(!o.success){
                    			Ext.Msg.alert('Error', 'Failed to rename "' + node.getId() + '".');
                    			return false;
                    		}
                    		var tId = 'tab-' + node.id;
				            var tab = Ext.getCmp(tId);
				            if (tab) {
				                var tabs = Ext.getCmp('main-tab');
				                tabs.remove(tab);
				            }
                    		Tree.store.load({node:node.parentNode});
                    		RealBoard.emit("sendRename"+node.get("cls"),{user:Sess.User,file:node.getId()});
                    	},
                    	failure:function(){
                    		Ext.Msg.alert('Error', 'Failed to rename "' + node.getId() + '".');
                    	}
                    });
                }, menu, {
                    single: true
                });
            }
        }
    }, {
        text: 'Delete',
		iconCls:"fa fa-trash-o",
        listeners: {
            click: function(a, b) {
                Ext.Msg.show({
                    title: 'Confirm deletion?',
                    msg: 'Remove ' + node.get("cls") + ' "' + t + '"?',
                    buttons: Ext.Msg.YESNO,
                    icon: Ext.Msg.QUESTION,
                    fn: function(choose) {
                        if (choose == "yes") {
                            var tId = 'tab-' + node.id;
                            var tab = Ext.getCmp(tId);
                            if (tab) {
	                            var tabs = Ext.getCmp('main-tab');
                                tabs.remove(tab);
                            }
                            Ext.data.JsonP.request({
                            	url:API_URL+"/sendDelete",
                            	params:{file:node.getId(),user:Sess.getId()},
                            	success:function(res){
                            		if(res.success) {
		                        		node.parentNode.expand();
						                Tree.store.load({
						                    node: node.parentNode
						                });
						                RealBoard.emit("sendRemove"+node.get("cls"),{user:Sess.User,file:node.getId()});
                            		}
                            	}
                            });
                        }
                    },
                    internalId: node.internalId
                });
            }
        }
    }];
    menuItems.unshift(openItem);
    if (node.getId() == RootNode) {
        menuItems = [openItem];
    }
    if (node.get("cls") != "file") {
    	var newFile = {
                text: 'New File',
                iconCls:"fa fa-file-o",
                listeners: {
                    click: function(a, b) {
                    	Ext.Msg.prompt('New file', 'Enter file name:', function(btn, text){
							if (btn == 'ok'){
		                        Ext.data.JsonP.request({
		                        	url:API_URL+"/sendNewFile",
		                        	params:{file:text,node:node.getId(),user:Sess.getId()},
		                        	success:function(res){
		                        		if(res.success) {
				                    		Tree.store.load({node:node});
				                    		node.expand();
				                    		RealBoard.emit("sendNewfile",{user:Sess.User,file:node.getId()});
		                        		}
		                        		else
		                        		{
		                        			Ext.Msg.alert('Error', 'Failed to create file "' + node.getId()+"/"+text + '".');
		                        		}
		                        	}
		                        });
							}
						});
                    }
                }
            };
        var newDir = {
                text: 'New Folder',
                iconCls:"fa fa-folder-open-o",
                listeners: {
                    click: function(a, b) {
                    	Ext.Msg.prompt('New folder', 'Enter folder name:', function(btn, text){
							if (btn == 'ok'){
		                        Ext.data.JsonP.request({
		                        	url:API_URL+"/sendNewDir",
		                        	params:{file:text,node:node.getId(),user:Sess.getId()},
		                        	success:function(res){
		                        		if(res.success) {
								            Tree.store.load({node:node});
								            node.expand();
								            RealBoard.emit("sendNewfolder",{user:Sess.User,file:node.getId()});
		                        		}
		                        		else
		                        		{
		                        			Ext.Msg.alert('Error', 'Failed to create file "' + node.getId()+"/"+text + '".');
		                        		}
		                        	}
		                        });
							}
						});
                    }
                }
            };
        var newUpload = {
                text: 'Upload',
				iconCls:"fa fa-cloud-upload",
                listeners: {
                    click: function(a, b) {
                        var FormUpload = Ext.create('Ext.form.Panel', {
							width: 500,
							bodyPadding: 10,
							frame: true,
							items: [{
								html:"Upload file to : "+node.getId()+"/"
							},{
								xtype:"hiddenfield",
								name:"path",
								value:node.getId()+"/"
							}, {
								xtype: 'filefield',
								name: 'fileupload',
								fieldLabel: 'file',
								labelWidth: 50,
								msgTarget: 'side',
								allowBlank: false,
								anchor: '100%',
								buttonText: 'Select file...'
							}],
							buttons: [{
								text: 'Upload',
								handler: function() {
									var form = this.up('form').getForm();
									if(form.isValid()){
										form.submit({
											url: API_URL+"/sendUpload?user="+Sess.getId(),
											waitMsg: 'Uploading your file...',
											success: function(fp, o) {
												if(o.result.file){
													Ext.Msg.alert('Success', 'Your file "' + o.result.file + '" has been uploaded.');
													node.expand();
													Tree.store.load({node:node});
													RealBoard.emit("sendUpload",{
														user:Sess.User,
														file:node.getId()+'/'+o.result.file});
												}
												else{
													Ext.Msg.alert('Failed', 'Upload failed.');
												}
												Ext.getCmp("file-upload-window").close();
											}
										});
									}
								}
							}]
						});
						Ext.create('Ext.window.Window', {
							title: 'Upload file',
							id:"file-upload-window",
							height: 200,
							width: 400,
							layout: 'fit',
							items: FormUpload
						}).show();
                    }
                }
            };
        var reload = {
				text: 'Refresh',
				iconCls:"fa fa-rotate-left",
				listeners: {
				    click: function(a, b) {
				        Tree.store.load({node:node});
				    }
				}
			};
        menuItems.push(newFile);
        menuItems.push(newDir);
        menuItems.push(newUpload);
        menuItems.push(reload);
        var pasteData = myCookie.get("pasteData");
        if(pasteData) {
        	var paste = Ext.decode(pasteData);
		    if (paste.id != node.getId()) {
		        node.expand();
		        var parentNodes = Tree.getStore().getNodeById(paste.parentId);
		        var isCopyOrCut = {
		            text: 'Paste',
		            iconCls:"fa fa-paste",
		            listeners: {
		                click: function(a, b) {
		                    var parameters = {
		                    	file:paste.id,
		                    	node:node.getId()+"/"+paste.name,
		                    	type:paste.method,
		                    	user:Sess.getId()
		                    };
							Ext.data.JsonP.request({
	                        	url:API_URL+"/sendPaste",
	                        	params:parameters,
	                        	success:function(o){
	                        		if(o.success) {
			                    		Tree.store.load({node:node});
								        Tree.store.load({node:parentNodes});
								        myCookie.clear("pasteData");
								        RealBoard.emit("sendNew"+node.get("cls"),{user:Sess.User,file:parameters.node});
	                        		}
	                        		else
	                        		{
	                        			Ext.Msg.alert('Error', 'Failed to move file "' + paste.id + '".');
	                        		}
	                        	}
	                        });
		                }
		            }
		        };
		        menuItems.push(isCopyOrCut);
		    }
        }
    }
    var menu1 = new Ext.menu.Menu({items: menuItems});
    menu1.showAt(event.getXY());
    event.stopEvent();
}, this);
var serverInfo = function(data,resType,pos){
	if(typeof resType == "string"){
		resType = resType.split(".");
	}
	var f = data.file.split("/");
	var ff = f.length ? f[f.length-1] : f;
	Notify("One "+resType[0]+" has been "+resType[1]+
	'<br>'+resType[0]+' : '+ff+
	'<br>On : '+data.date+
	'<br>By : '+data.user.user_name+
	'<br>Ip : '+data.ip,
	resType.join(" "),
	pos).show();
}
var requestCollab = function(data){
	if(Sess.get("user_share") == "no"){
		return;
	}
	Ext.Msg.show({
		title: 'New request collaboration from '+data.user.user_name,
		msg: 'Message : '+data.message+'<br>File : '+data.file,
		buttons: Ext.Msg.YESNO,
		icon: Ext.Msg.INFO,
		fn: function(choose) {
			if(choose == "yes"){
				RealBoardIDE.open(data.file);
				RealBoard.emit("sendReceiveCollab",data);
			}else{
				RealBoard.emit("sendRejectCollab",data);
			}
		}
	});
}
Tree.on('itemdblclick', function(target, record, item, index, e, eOpts) {
    if (record.get("cls") == "file") {
        RealBoardIDE.open(record);
    }
});
var refreshUserGrid = function(){	
	var grid = Ext.getCmp("main-user-grid");
	if(grid){
		grid.getStore().load({params:{user:Sess.getId()}});
	}
};
var Container = function(){
	Sess.getSession().getAccess(createContainer);
};
var createContainer = function() {

	for(var u in Sess.User){
		socketParams.push(u+'='+Sess.get(u).toString());
	}
	
	var activityGrid = generateGrid({
		fields:{
			"user_name":"Name",
			"user_email":"Email",
			"sign_ip":"IP Address",
			"sign_type":"Sign",
			"sign_date":"Date",
			"sign_time":"Time",
			"sign_agent":"Browser"
		},
		url:"/getSign",
		params:{user:Sess.getId()},
		colOptions:{
			"user_email":{hidden:true}
		}
	});
	
	var filesGrid = generateGrid({
		fields:{
			"file_path":"Full Path",
			"file_dir":"Folder",
			"file_name":"File Name",
			"file_extension":"Type",
			"file_date":"Modification Date",
			"file_time":"Modification Time",
			"file_lock":"Locked"
		},
		colOptions:{
			"file_lock":{hidden:true}
		},
		url:"/getFiles",
		container:{
			title:"Double Click an item to edit file"
		},
		action:function(grid, record, item, rowIndex, e, eOpts){
			var rec = grid.getStore().getAt(rowIndex);
			RealBoardIDE.open(rec.get("file_path"));
		}
	});
	var userGridOptions = {
		fields:{
			"user_id":"#User ID",
			"user_name":"Full Name",
			"user_email":"Email",
			"user_ip":"Registered IP",
			"user_active":"Status",
			"user_theme":"Ext Theme",
			"user_theme_ide":"IDE Theme",
			"user_ide_engine":"IDE Engine",
			"user_share":"Shared IDE"
		},
		colOptions:{
			"user_id":{hidden:true},
			"user_theme":{hidden:true},
			"user_theme_ide":{hidden:true},
			"user_ide_engine":{hidden:true}
		},
		extendColumns:[{
				xtype:'actioncolumn',
				width:50,
				items: [{
					icon:ICON_PATH+"/man/user_comment.png",
					tooltip: 'Invite collaboration',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						if(rec.get("user_active") == "offline"){
							Ext.Msg.alert("Failed","User is offline");
							return;
						}
						if(openHistory.length){
							var activeTab = Ext.getCmp("main-tab").getActiveTab();
							if( activeTab.hasCls("no-ide") ){
								Ext.Msg.alert("Failed",
								"Please select and open a file before invite collaboration");
							}else if(rec.get('user_share') == "no"){
								Ext.Msg.alert("Failed",
								rec.get('user_name')+
								" say : Hi "+
								Sess.get("user_name")+
								", sorry i dont enable share for IDE");
							}else if( Sess.get("user_share") == "no" ){
								Ext.Msg.alert("Failed",
								"Please set IDE to enable share from your profile settings");
							}else{
								Ext.Msg.prompt(
								"Invite Collaboration for "+activeTab.title,
								"Invitation message for "+rec.get("user_name")+" : ",
								function(b,t){
									if(b == "ok"){
										if( activeTab.hasCls("no-ide") ){
											Ext.Msg.alert("Failed",
											"Please select and open a file before invite collaboration");
										}else{
											var collabRequest = {
												from:Sess.getId(),
												to:rec.get('user_id'),
												file:activeTab.tooltip,
												message:t.toString()
											};
											RealBoard.emit("sendInviteCollab",collabRequest);
										}
									}
								});
							}
						}
						else{
							Ext.Msg.alert("Failed","Please select and open a file before invite collaboration");
						}
					}
				}]
		}],
		url:"/getUsers",
		gridId:"main-user-grid",
		params:{user:Sess.getId()},
		action:function(grid, record, item, rowIndex, e, eOpts){
			if(Sess.hasAccess("manager") || Sess.hasAccess("superuser")){
				manageProfile(record.data,function(userData){
					grid.getStore().load({params:{user:Sess.getId()}});
					RealBoard.emit("sendUpdateProfile",userData);
				});
			}
		}
	};
	userGridOptions.container = {items : [
		Ext.create('Ext.Button', {
			text: '<i class="fa fa-plus"></i> <b>ADD NEW USER</b>',
			width:200,
			height:20,
			handler: function() {
				if(Sess.hasAccess("superuser")){
					manageProfile(false,function(userData,response){
						if(response == "saving"){
							refreshUserGrid();
							RealBoard.emit("sendNewProfile",userData);
						}
					});
				}
				else{
					Ext.Msg.alert("Permission denied!","You dont have permission to add new user");
				}
			}
		}),
		Ext.create('Ext.Button', {
			text: '<i class="fa fa-group"></i> <b>INVITE COLLAB FOR ALL USER</b>',
			width:200,
			height:20,
			handler: function() {
				if(openHistory.length){
					var activeTab = Ext.getCmp("main-tab").getActiveTab();
					if( activeTab.tooltip == "RealBoard-Client" ){
						Ext.Msg.alert("Failed",
						"Please select and open a file before invite collaboration");
					}else if( Sess.get("user_share") == "no" ){
						Ext.Msg.alert("Failed",
						"Please set IDE to enable share from your profile settings");
					}else{
						Ext.Msg.prompt(
						"Invite Collaboration for "+activeTab.title,
						"Invitation message for All user : ",
						function(b,t){
							if(b == "ok"){
								if( activeTab.tooltip == "RealBoard-Client" ){
									Ext.Msg.alert("Failed",
									"Please select and open a file before invite collaboration");
								}else{
									var collabRequest = {
										from:Sess.getId(),
										to:"All",
										file:activeTab.tooltip,
										message:t.toString()
									};
									RealBoard.emit("sendInviteCollab",collabRequest);
								}
							}
						});
					}
				}
				else{
					Ext.Msg.alert("Failed","Please select and open a file before invite collaboration");
				}
			}
		})
	]};
	var usersGrid = generateGrid(userGridOptions);
	var cloudGrid = generateGrid({
		fields:{
			"version_id":"#Version ID",
			"version_type":"Action",
			"version_message":"Description",
			"version_date":"Version Date",
			"version_time":"Version Time",
			"file_name":"File Name",
			"file_extension":"Type",
			"file_dir":"Folder",
			"file_path":"File Path",
			"user_name":"Action By",
			"user_email":"Email",
			"user_ip":"IP Address"
		},
		container:{
			title:"Double Click an item to restore file from cloud history."
		},
		colOptions:{
			"version_id":{hidden:true},
			"file_path":{hidden:true},
			"user_email":{hidden:true}
		},
		url:"/getVersion",
		action:function(grid, record, item, rowIndex, e, eOpts){
			var rec = grid.getStore().getAt(rowIndex);
			var file = rec.get("file_path");
			Ext.data.JsonP.request({
				url:API_URL+"/getRaw",
				params:{id:rec.get("version_id")},
				success:function(o){
					if(o.success){
						RealBoardIDE.open(file,o.data);
					}
					else{
						Ext.Msg.alert("Error!","Sorry. Cannot open history from "+file);
					}
				}
			});
		}
	});
	if(Sess.hasAccess("manager")){
		var formClient = function(newData,callback){
			var defaultData = {
				client_id:0,
				client_name:""
			};
			var win = Ext.getCmp("client-window-add");
			if(win){
				win.close();
			}
			var data = newData || defaultData;
			var clientButton = [{
						text: 'Save',
						handler: function() {
							var form = this.up('form').getForm();
							if(form.isValid()){
								form.submit({
									url: API_URL+"/saveClient",
									waitMsg: 'Saving ...',
									success: function(fp, o) {
										var win = Ext.getCmp("client-window-add");
										if(win){
											win.close();
										}
										if(callback){
											var type = data.client_id != 0 ? "Update":"New";
											return callback({data:o.result.data,type:type});
										}
									}
								});						
							}
						}
					}];
			if(data.client_id != 0){
				clientButton.unshift({
					text:"Remove",
					handler:function(){
						Ext.Msg.show({
							title:'Remove Client?',
							msg: "Remove Client permanently!",
							buttons: Ext.Msg.OKCANCEL,
							icon: Ext.Msg.QUESTION,
							fn:function(b,t){
								if(b == "ok"){
									Ext.data.JsonP.request({
										url:API_URL+"/removeClient",
										params:{id:data.client_id},
										success:function(o){
											if(o.success){
												var win = Ext.getCmp("client-window-add");
												if(win){
													win.close();
												}
												if(callback){
													return callback({data:data,type:"Remove"});
												}
											}
										}
									});
								}
							}
						});
					}
				});
			}
			var clientForm = Ext.create('Ext.form.Panel', {
				width: 250,
				bodyPadding: 10,
				items: [{
					xtype: 'hiddenfield',
					name: 'client_id',
					value:data.client_id
				},{
					xtype: 'textfield',
					name: 'client_name',
					fieldLabel: 'Name',
					value:data.client_name,
					allowBlank: false
				}],
				buttons: clientButton
			});
			Ext.create('Ext.window.Window', {
				title: '<i class="fa fa-user"></i> Client Settings',
				id:"client-window-add",
				resizable:false,
				border:0,
				layout: 'fit',
				items: clientForm,
				y:100
			}).show();
		};
		var clientGrid = generateGrid({
			fields:{
			"client_id":"#Client ID",
			"client_name":"Name"
			},
			gridId:"client-grid",
			url:"/getClient",
			colOptions:{
				"client_id":{hidden:true}
			},
			container:{
				items:[
					Ext.create('Ext.Button', {
						text: '<i class="fa fa-plus"></i> Add client',
						handler: function() {
							formClient(false,function(values){
								Ext.getCmp("client-grid").getStore().load();
								RealBoard.emit("sendClient",values);
							});
						}
					})
				]
			},
			extendColumns:[{
					xtype:'actioncolumn',
					width:50,
					items: [{
						icon:ICON_PATH+"/man/edit.png",
						tooltip: 'Edit',
						handler: function(grid, rowIndex, colIndex) {
							var record = grid.getStore().getAt(rowIndex);
							formClient(record.data,function(values){
								grid.getStore().load();
								RealBoard.emit("sendClient",values);
							});
						}
					}]
			}]
		});
		var formProject = function(newData,callback){
			var defaultData = {
				project_id:0,
				client_id:null,
				project_title:"",
				project_date:Ext.Date.format(new Date(),'Y-m-d'),
				project_env:"plan"
			};
			var win = Ext.getCmp("project-window-add");
			if(win){
				win.close();
			}
			var data = newData || defaultData;
			var projectButton = [{
						text: '<i class="fa fa-save"></i> Save',
						handler: function() {
							var form = this.up('form').getForm();
							if(form.isValid()){
								form.submit({
									url: API_URL+"/saveProject",
									waitMsg: 'Saving ...',
									success: function(fp, o) {
										var win = Ext.getCmp("project-window-add");
										if(win){
											win.close();
										}
										if(callback){
											var type = data.project_id != 0 ? "Update":"New";
											return callback({data:o.result.data,type:type});
										}
									}
								});						
							}
						}
					}];
			if(data.project_id != 0){
				projectButton.unshift({
					text:'<i class="fa fa-plus"></i> Add Job',
					tooltip:'Add job for this project',
					handler:function(){
						formJob(data,function(values){
							var e = Ext.getCmp("job-grid-"+data.project_id);
							if(e){
								e.getStore().load({params:{id:data.project_id}});
								RealBoard.emit("sendJob",values);
							}
						});
					}
				});
				projectButton.unshift({
					text:'<i class="fa fa-trash"></i> Remove',
					handler:function(){
						Ext.Msg.show({
							title:'Remove Project?',
							msg: "Remove Project permanently!",
							buttons: Ext.Msg.OKCANCEL,
							icon: Ext.Msg.QUESTION,
							fn:function(b,t){
								if(b == "ok"){
									Ext.data.JsonP.request({
										url:API_URL+"/removeProject",
										params:{id:data.project_id},
										success:function(o){
											if(o.success){
												var win = Ext.getCmp("project-window-add");
												if(win){
													win.close();
												}
												if(callback){
													return callback({data:data,type:"Remove"});
												}
											}
										}
									});
								}
							}
						});
					}
				});
			}
			var projectForm = Ext.create('Ext.form.Panel', {
						bodyPadding: 10,
						items: [{
							xtype: 'hiddenfield',
							name: 'project_id',
							value:data.project_id
						},{
							xtype: 'textfield',
							name: 'project_title',
							fieldLabel: 'Title',
							value:data.project_title,
							allowBlank: false,
							width:400
						},{
							xtype:"combobox",
							fieldLabel: 'Client',
							name:"client_id",
							store: Ext.getCmp("client-grid").getStore(),
							allowBlank: false,
							editable:false,
							displayField: 'client_name',
							valueField: 'client_id',
							value:data.client_id,
							width:400
						},{
							xtype:"combobox",
							fieldLabel: 'Environment',
							name:"project_env",
							store: ["plan","development","testing","production","closed"],
							allowBlank: false,
							editable:false,
							value:data.project_env,
							width:200
						},{
							xtype: 'datefield',
							//anchor: '100%',
							name: 'project_date',
							fieldLabel: 'Date asignment',
							value:data.project_date,
							format:'Y-m-d',
							allowBlank: false,
							editable:false,
							width:250
						}],
						buttons: projectButton
					});
			Ext.create('Ext.window.Window', {
				title: '<i class="fa fa-pencil"></i> Project Settings',
				id:"project-window-add",
				border:0,
				bodyPadding:0,
				width:800,
				layout: 'fit',
				items: projectForm,
				resizable:false,
				y:100,
				closeAction:"destroy"
			}).show();
			if(data.project_id != 0){
				var jobGrid = generateGrid({
					fields:{
						"job_id":"#Job ID",
						"job_title":"Title",
						"job_desc":"Description",
						"job_datestart":"Start Date",
						"job_datefinish":"Finish Date",
						"job_status":"Status",
						"project_id":"#Project ID"
					},
					gridId:"job-grid-"+data.project_id,
					url:"/getJob",
					colOptions:{
						"project_id":{hidden:true},
						"job_id":{hidden:true},
						"job_desc":{hidden:true}
					},
					params:{id:data.project_id,user:Sess.getId()},
					extendColumns:[{
							xtype:'actioncolumn',
							width:50,
							items: [{
								icon:ICON_PATH+"/man/edit.png",
								tooltip: 'Edit',
								handler: function(grid, rowIndex, colIndex) {
									var record = grid.getStore().getAt(rowIndex);
									var newData = record.data;
									newData.project_title = data.project_title;
									formJob(newData,function(values){
										grid.getStore().load();
										RealBoard.emit("sendJob",values);
									});
								}
							}]
					}],
					container:{
						width:Ext.getCmp("project-window-add").getWidth()-30,
						border:0
					}
				});
				projectForm.add({
					title:"Job list of "+data.project_title,
					items:jobGrid
				});
			}	
		};
		var projectGrid = generateGrid({
			fields:{
			"project_id":"#Project ID",
			"client_name":"Client",
			"project_title":"Project Title",
			"project_date":"Date Asign",
			"project_env":"Environment",
			"client_id":"#Client ID"
			},
			gridId:"project-grid",
			url:"/getProject",
			colOptions:{
				"project_id":{hidden:true},
				"client_id":{hidden:true}
			},
			container:{
				items:[
					Ext.create('Ext.Button', {
						text: '<i class="fa fa-pencil"></i> Add Project',
						handler: function() {
							formProject(false,function(values){
								Ext.getCmp("project-grid").getStore().load();
								RealBoard.emit("sendProject",values);
							});
						}
					})
				]
			},
			extendColumns:[{
					xtype:'actioncolumn',
					width:50,
					items: [{
						icon:ICON_PATH+"/man/edit.png",
						tooltip: 'Edit',
						handler: function(grid, rowIndex, colIndex) {
							var record = grid.getStore().getAt(rowIndex);
							formProject(record.data,function(values){
								grid.getStore().load();
								RealBoard.emit("sendProject",values);
							});
						}
					}]
			}]
		});
		
		var formProjectReport = Ext.create("Ext.form.Panel",{
									bodyPadding: 10,
									listeners:{
										afterrender:function(){
											var stored = Ext.getCmp("project-grid").getStore();
											stored.each(function(row,index){
												Ext.getCmp("project-report-list").add({
													boxLabel:row.get("client_name") +" "+ row.get("project_title"),
													name:"project_id[]",
													inputValue:row.get("project_id"),
													checked:true});
											});
										}
									},
									items: [{
										fieldLabel:"From",
										name:"from",
										xtype:'datefield',
										allowBlank:false,
										editable:false,
										format:"Y-m-d",
										width:230,
										value:''
									},{
										fieldLabel:"To",
										name:"to",
										xtype:'datefield',
										allowBlank:false,
										editable:false,
										format:"Y-m-d",
										width:230,
										value:''
									},{
										xtype: 'checkboxgroup',
								        fieldLabel: 'Projects',
								        id:"project-report-list",
								        columns: 3,
								        vertical: true,
								        allowBlank:true
									},{
										type:"panel",
										id:"project-report-result",
										height:360,
										minWidth:600,
										border:0,
										bodyPadding:0,
										layout:"fit",
										html:'<div id="project-report-frame"></div>'
									}],
									buttons:[{
										text:'<i class="fa fa-search"></i> Preview',
										handler:function(){
											var form = this.up("form").getForm();
											var v = form.getValues();
											if(form.isValid()){
												Ext.Ajax.request({
													url:API_URL+"/getTaskReport",
													method:'GET',
													params:{from:v.from,to:v.to,projects:v["project_id[]"].join(",")},
													success:function(o){
														var p = document.getElementById("project-report-frame");
														p.innerHTML = '';
														var f = document.createElement("iframe");
														f.style.width = '100%';
														f.style.height = '360px';
														f.style.border = 0;
														f.style.display = 'block';
														f.id = 'project-report-frame-id';
														var b = document.createElement("button");
														b.type = 'button';
														b.id = 'button-report-frame';
														b.innerHTML = '<i class="fa fa-print"></i> Print';
														b.addEventListener("click",function(){
															f.contentWindow.print();
														});
														p.appendChild(b);
														p.appendChild(f);
														f.contentWindow.document.write(o.responseText);
													}
												});
											}
										}
									}]
								});

		Ext.getCmp("main-menu").add({
			text: 'Project',
			arrowAlign: 'right',
			menu: [{
				text: 'Clients',
				listeners:{
					click:function(){
						if(!Ext.getCmp("client-window")){
							Ext.create('Ext.window.Window', {
								title: '<i class="fa fa-user"></i> Client Management',
								id:"client-window",
								border:0,
								width: 600,
								layout: 'fit',
								items: clientGrid,
								resizable:false,
								y:100,
								closeAction:'hide'
							}).show();
							return;
						}
						Ext.getCmp("client-window").show();
					}
				}
			}, {
				text: 'Projects',
				listeners:{
					click:function(){
						if(!Ext.getCmp("project-window")){
							Ext.create('Ext.window.Window', {
								title: '<i class="fa fa-pencil"></i> Project Management',
								id:"project-window",
								border:0,
								width: 600,
								layout: 'fit',
								items: projectGrid,
								resizable:false,
								y:100,
								closeAction:'hide'
							}).show();
							return;
						}
						Ext.getCmp("project-window").show();
					}
				}
			}, {
				text:"Report",
				arrowAlign:"right",
				menu:[{
					text:"Project Report",
					listeners:{
						click:function(){
							if(!Ext.getCmp("project-report-window")){
								Ext.create("Ext.window.Window",{
									title:'<i class="fa fa-tasks"></i> Project Report',
									id:"project-report-window",
									border:0,
									width: 600,
									layout: 'fit',
									resizable:true,
									items:[formProjectReport],
									maximized:true,
									maximizable:true,
									closeAction:"hide",
									y:100
								});
							}
							Ext.getCmp("project-report-window").show();
						}
					}
				}, {
					text:"Team perform report"
				}]
			}]
		});
	}
	var userTaskGrid = generateGrid({
		gridId:'main-task-grid',
		fields:{
			"user_name":"User",
			"task_summary":"Job Desc",
			"job_title":"Job Title",
			"task_title":"Task",
			"task_desc":"Description",
			"task_comment":"Comment",
			"task_status":"Status",
			"task_deadline":"Deadline",
			"task_deadlinedate":"Deadline Date",
			"task_deadlinetime":"Deadline Time",
			"job_desc":"Job Description",
			"task_id":"#Task ID",
			"task_level":"Level"
		},
		// gridOptions:{features:[{ftype:'grouping',startCollapsed:true,enableGroupingMenu:false}]},
		// storeOptions:{groupField:'task_summary'},
		colOptions:{
			"task_level":{hidden:true},
			"task_id":{hidden:true},
			"job_title":{hidden:true},
			"task_desc":{hidden:true},
			"task_comment":{hidden:true},
			"job_desc":{hidden:true},
			"task_deadlinedate":{hidden:true},
			"task_deadlinetime":{hidden:true},
			//"project_title":{hidden:true},
			//"task_summary":{hidden:true},
			"user_name":{hidden:true}
		},
		limit:20,
		url:"/getUserTask",
		params:{user:Sess.getId(),access:Sess.hasAccess("manager")},
		extendColumns:[{
				xtype:'actioncolumn',
				width:50,
				items: [{
					icon:ICON_PATH+"/man/new.png",
					tooltip: 'Apply task',
					handler: function(grid, rowIndex, colIndex) {
						var record = grid.getStore().getAt(rowIndex);
						if(!record)return false;
						applyTask(record.data,function(values){
							grid.getStore().load();
							var d = record.data;
							d.task_status = values.task_status;
							d.task_comment = values.task_comment;
							RealBoard.emit("sendTaskApply",d);
						});
					}
				}]
		}]
	});
	Ext.create('Ext.container.Viewport', {
		    layout: 'border',
		    id:"main-viewport",
		    title: 'main title',
		    listeners:{
		    	afterrender:function(_container,eOpts){
		    		RealBoardIDE.engine = Sess.get("user_ide_engine") || RealBoardIDE.engine;
		    		IDE.doInject(RealBoardIDE.engine,function(){
		    			RealBoard.openSocket();
			    		Notify("Hey guys, welcome to realboard!","Welcome!").show();
						var openFileManager = setTimeout(function(){
							var m = Ext.getCmp("main-panel");
							if(m){
								m.expand();
								tabHistory.restore();
								Sess.refresh();
							}
							clearTimeout(openFileManager);
						},4000);
		    		});
		    	}
		    },
		    items: [{
		        region: 'north',
		        border: 0,
		        items: Menu,
		        margins: '0 0 5 0'
		    }, {
		        region: 'west',
		        collapsible: true,
		        collapsed:true,
		        title:'<i class="fa fa-cog"></i> Manager',
		        xtype: 'tabpanel',
		        activeTab: 0,
		        id: 'main-panel',
		        autoScroll:true,
		        split: true,
		        maxWidth: 700,
		        minWidth: 250,
		        manageHeight: true,
		        width: 250,
		        items: [{
		        	title:'<i class="fa fa-hdd-o"></i>',
		            tooltip: "File Manager",
		            closable: false,
		            layout:'fit',
		            items: Tree
		        }]
		    }, {
		        region: 'south',
		        title:'<i class="fa fa-database"></i> Data',
		        id: "main-data",
		        collapsible: true,
		        collapsed:true,
		        xtype: 'tabpanel',
		        activeTab: 0,
		        split: true,
		        //plain: true,
		        height: 500,
		        minHeight: 180,
		        maxHeight: 600,
		        listeners:{
		        	collapse:function(){
		        		RealBoardIDE.resize();
		        	},
		        	expand:function(){
		        		RealBoardIDE.resize();
		        	}
		        },
		        items:[{
		            iconCls: 'fa fa-user',
		            title: "User Activity",
		            tooltip: "Click to view User Activity",
		            closable: false,
			        autoScroll:true,
			        overflowX:"scroll",
		            items: activityGrid
		        }, {
		            iconCls: 'fa fa-history',
		            title:'Files activity',
		            tooltip: "Click to view files history",
		            closable: false,
			        autoScroll:true,
			        overflowX:"scroll",
		            items: filesGrid
		        }, {
		            iconCls: 'fa fa-cloud',
		            title:'Cloud data',
		            tooltip: "Click to view version or restore file from cloud version",
		            closable: false,
			        autoScroll:true,
			        overflowX:"scroll",
		            items: cloudGrid
		        }, {
		            iconCls: 'fa fa-group',
		            title:'Team',
		            closable: false,
			        autoScroll:true,
			        overflowX:"scroll",
		            items: usersGrid
		        },{
		        	//title:'<i class="fa fa-tasks"></i>',
		        	iconCls:'fa fa-tasks',
		        	title:'Task Manager',
		        	tooltip:"Task Manager",
		        	closable: false,
		            layout:'fit',
			        autoScroll:true,
			        overflowY:"scroll",
		        	items:userTaskGrid
		        }]
		    }, {
		        region: 'east',
		        title: '<i class="fa fa-coffee"></i> Discussion',
		        layout: "vbox",
		        collapsible: true,
		        id:"discussion",
		        collapsed:true,
		        split: true,
		        width: 200,
		        minWidth: 150,
		        maxWidth: 300,
		        items: [{
		            xtype: "panel",
		            width: "100%",
		            id:"chat-body",
		            flex: 20,
		            bodyPadding: 2,
		            overflowY: "auto",
		            border: 0
		        }, {
		            xtype: "panel",
		            width: "100%",
		            flex: 1,
		            border: 0,
		            items: [{
		                xtype: "textfield",
		                id:"chat-input",
		                emptyText: "Type here . . .",
		                width: "100%",
		                listeners:{
		                	specialkey:function(_this,e){
		                		if (e.getKey() == e.ENTER && _this.value.replace(/[^a-zA-Z0-9]/,"") != "") {
		                			RealBoard.emit("sendChat",_this.value);
		                			_this.setValue("");
		                		}
		                	}
		                }
		            }]
		        }]
		    }, {
		        region: 'center',
		        xtype: 'tabpanel',
		        activeTab: 0,
		        id: 'main-tab',
		        plain: true,
		        items: [{
				    iconCls:"fa fa-fire",
				    cls:"no-ide",
				    id:"RealBoard-Dashboard",
		            title: 'RealBoard',
		            tooltip: "RealBoard-Client",
		            bodyPadding: 0,
		            closable: false,
		            id:"active-tab-1",
		            html: '\
		            <div id="welcome-container">\
						<span class="fa fa-desktop fa-5x"></span>\
						 &nbsp; \
						<span class="fa fa-laptop fa-5x"></span>\
						 &nbsp; \
						<span class="fa fa-mobile fa-5x"></span>\
						<h1>Welcome to <em><span class="R">Real</span><span class="B">Board</span></em>\
							<small>Realtime collaborative IDE and simple project management</small>\
						</h1>\
					</div>'
		        }]

		    }]
		});		
};
var signinForm = function(){
	Ext.data.JsonP.request({
		url:API_URL+"/getMail",
		success:function(o){
			var mailField = {
				type:"textfield",
				value:""
			};
			if(o.success && o.data){
				mailField.type = "hiddenfield",
				mailField.value = o.data;
			}
			
			var Signin = Ext.create('Ext.form.Panel', {
								width: 290,
								bodyPadding: 10,
								items: [{
									xtype: mailField.type,
									name: 'uid',
									fieldLabel: 'Email',
									vtype: 'email',
									id:"uid",
									value: mailField.value,
									allowBlank: false,
									listeners:{
										specialkey:function(_this,e){
											if(e.getKey() == e.ENTER){
												if(Ext.getCmp("btn-signin")){
													Ext.getCmp("btn-signin").handler();
												}
											}
										}
									}
								},{
									xtype: 'textfield',
									name: 'passwd',
									id:"passwd",
									fieldLabel: 'Password',
									allowBlank: false,
									inputType:'password',
									listeners:{
										specialkey:function(_this,e){
											if(e.getKey() == e.ENTER){
												if(Ext.getCmp("btn-signin")){
													Ext.getCmp("btn-signin").handler();
												}
											}
										}
									}
								}],
								buttons: [{
									text: 'Signin',
									id:'btn-signin',
									handler: function() {
										var form = this.up('form').getForm();
										if(form.isValid()){
											form.submit({
												url: API_URL+"/sendSignin",
												waitMsg: 'Signin ...',
												success: function(fp, o) {
													var res = o.result;
													if(res.success){
														var data = res.data.data;
														if(data){
															myCookie.set("IDE",Ext.encode(data));
															//window.location = "";
															Ext.getCmp("signin-window").close();
															return Container();
														}
														else{
															Ext.Msg.alert('Failed', res.data.message,function(){
																if(Ext.getCmp("passwd")){
																	Ext.getCmp("passwd").focus();
																}
															});
														}	
													}
													else{
														Ext.Msg.alert('Failed', "Undefined user or password",function(){
															if(Ext.getCmp("passwd")){
																Ext.getCmp("passwd").focus();
															}
														});
													}
												}
											});
										}
									}
								}]
							});
	
			var singinWindow = Ext.create('Ext.window.Window', {
				title: '<span class="fa fa-lock"></span> Signin to RealBoard',
				id:"signin-window",
				closable:false,
				draggable:false,
				resizable:false,
				width: 300,
				layout: 'fit',
				items: Signin,
				closeAction:"destroy",
				y:100
			}).show();
			if(Ext.getCmp("uid")){
				Ext.getCmp("uid").focus();
			}
			document.body.className+=" user-signin";
		}
	});
};
var launcher = Container;
Ext.onReady(function(){
	var isSignin = function(){
	var sessSignin = myCookie.get("IDE");
		if(!sessSignin){
			launcher = signinForm;
		}
	};
	isSignin();
	Ext.application({
	    name: 'RealBoardApp',
	    launch: launcher
	});
},this);
