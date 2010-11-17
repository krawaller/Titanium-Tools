Ti.API.log('including livestyle');

Function.prototype.bind = function(ctx){ 
	var fn = this;
	return function(){ 
		fn.apply(ctx || fn, slice.call(arguments)); 
	}; 
};

var rtrim = /^\s+|\s+$/g;
String.prototype.trim = function(){
    return this.replace(rtrim, "");  
};

(function(global){var K,callbacks={},cid=0,me=this,toString=Object.prototype.toString;K=global.K=global.K||{};K.isFunc=function(o){return toString.call(o)==="[object Function]";};K.reg=function(obj,reglabel){var lb='_'+reglabel;obj.call=function(label,method,data,callback){if(K.isFunc(data)&&typeof callback==='undefined'){callback=data;data=null;} cid++;callbacks[cid]=callback;Ti.App.fireEvent('_'+label,{method:method,cid:callback?cid:false,source:reglabel,data:data});};Ti.App.addEventListener(lb,function(e){if(!e.method){if(callbacks[e.cid]){callbacks[e.cid](e.data);delete callbacks[e.cid];}}else{var i=0,m=e.method.split("."),tmp,val,o=obj,os=[],fn=function(val){if(e.cid){Ti.App.fireEvent(e.source,{cid:e.cid,data:val,source:lb});}};while((tmp=o[m[i++]])&&(o=tmp)&&os.push(o));(o&&(K.isFunc(o)))?((typeof(val=o.apply?o.apply((os[os.length-2]||obj),((tmp=(e.data?(e.data instanceof Array?e.data:[e.data]): []))&&tmp.push(fn)&&tmp.push(e)&&tmp)):o(e.data[0],e.data[1],e.data[2]))!=='undefined')&&fn(val)):fn(o);}});};})(this);

(function(global){
var K = global.K = global.K || {};

var slice = Array.prototype.slice;
Function.prototype.bind = function(ctx){ 
	var fn = this;
	return function(){ 
		fn.apply(ctx || fn, slice.call(arguments)); 
	}; 
};

K.isFunc = function(obj){ return toString.call(obj) === "[object Function]"; };

var extend = K.extend = function(destination, source){
    for (var property in source) {
        destination[property] = source[property];
    }
    return destination;
};

var baseColor = '#333',
    styles = K.styles = {};

K.extendStyle = K.addStyle = function(opts){
	K.extend(styles, opts || {});
};

var rrep = /^(\w)(\w+)/,
	rfunc = function($0, $1, $2){
	    return 'create' + $1.toUpperCase() + $2;
	};

function on(name, fn, ctx){
	this.addEventListener(name, fn.bind(ctx || this));
	return this;
}

function appendTo(el){
	el.add(this);
	return this;
}

var thisWindow = (Ti.UI.currentWindow || win) || {};
thisWindow._type = 'window';

var els = K._els = K._els || [thisWindow];
var styleCache = {};
var getStyle = K.getStyle = function(opts, type){
    if(typeof opts === 'string'){ opts = { className: opts }; }
	var elStyle, c, hash = type+(opts && opts.cls+opts.className);
	if (!(elStyle = styleCache[hash])) {
		elStyle = styles[type] ? extend({}, styles[type]) : {};
		if (opts && (c = (opts.className || opts.cls))) {
			var parts = c.split(" "), len = parts.length;
			for (var i = 0; i < len; i++) {
				if (s = styles['.'+parts[i]]) {
					elStyle = extend(elStyle, s);
				}
			}
		}
		styleCache[hash] = elStyle;
	}
	return extend({}, elStyle);
};

['window', 'view', 'tableView', 'imageView', 'label', 'tableViewSection', 'tableViewRow', 'buttonBar', 'button', 'tabbedBar', 'webView', 'scrollView', 'activityIndicator', 'textField', 'toolbar', 'searchBar', 'tab', 'picker']
.forEach(function(type){
    var func = type.replace(rrep, rfunc);
    K[func] = function(opts){
        var o = extend(getStyle(opts, type), opts);
	    var el = Ti.UI[func](o);
	    el.on = on;
	    el.appendTo = appendTo;
	    el._type = type;
	    els.push(el);
        return el;
    };
});

K.refreshStyles = function(styleString){
    if(styleString){
        K.style(null, styleString);
        styleCache = {};
    } 
    els.forEach(function(el){
        var s = K.getStyle(el, el._type);
        for(var p in s){
            el[p] = s[p];
        }
    });    
};

K.watch = function(win){
    if(Ti.App.Properties.getBool('_watching')){ return false; }
    Ti.App.Properties.setBool('_watching', true);
    
    var watchers = {};
    
    var Watcher = {
        watch: function(file, callback, e){
            if(!watchers[file]){
                socket.write(JSON.stringify({ action: 'watch', file: file }));
                watchers[file] = e.source;
            }
        }
    };
    K.reg(Watcher, '_watcher');
    
    Ti.API.log('init socket');
    
    var socket = Titanium.Network.createTCPSocket({
    	hostName: "192.168.10.236", 
    	port: 8128, 
    	mode: Titanium.Network.READ_WRITE_MODE
    });
    
    Ti.API.log('socket', socket.isValid);

    socket.addEventListener('read', function(e) {
        
        var t = e.data.text;
        //Ti.API.log('read', t);
        var o = JSON.parse(t);
        switch(o.action){
            case 'filechange':
                Watcher.call(watchers[o.file], 'update', [o.content]);
                break;
                
            case 'files':
                //Ti.API.log('oooh', o.files);
                o.files.forEach(function(f, i){
                    var name = f.name.replace(/\.\//, function($0){ return '';  }).replace(/\//g, '-'),
                        path = Ti.Filesystem.tempDirectory.replace(/\/$/, ''),
                        h = Ti.Filesystem.getFile(path, name);
                        
                    //Ti.API.log('writing to', h.nativePath)
                    h.write(f.content);
                });
                
                
                //Ti.API.log(['pa', path, name, h.nativePath]);
                //var w = Ti.UI.createWindow({ url: h.nativePath });
                //(Ti.UI.currentTab || tab).open(w);
                break;
        }
    });

    // Cleanup
    (win || Ti.UI.currentWindow).addEventListener('close', function(e) {
    	if (socket.isValid) {
    	    Ti.API.log('close socket');
    		socket.close();
    	}
    });

    socket.connect();
    Ti.API.log('connect', socket.isValid);
    
};

var watching = {};
var StyleWatcher = {
    update: function(content){
        K.refreshStyles(content);
    }
};

K.style = function(file, str){
    if(file && !watching[file]){
        K.reg(StyleWatcher, '_watching_' + file);
        StyleWatcher.call('_watcher', 'watch', [file]);
        watching[file] = true;
    }
    
    var selectors;
    try {
        var h = file && Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, file.substring(1).replace(/\//g, '-')),
            tmp = h && h.exists && (h.read() || {}).text;
            
        str = tmp || str || Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, file).read().text;
        selectors = buildSelectorTree(str);
        selectors.forEach(function(sel){
            var obj = styles[sel.selector] = styles[sel.selector] || {};
            sel.properties.forEach(function(prop){
                obj[prop.property] = prop.value;
            });
        });
        
        K.refreshStyles();
    } catch(e){ Ti.API.log('error', e); }
};




// Via jQuery 1.4.3
// http://github.com/jquery/jquery/blob/master/src/core.js#L593
function forEach(object, callback, reverse) {
	var name, i = 0, value,
		length = object.length,
		isObj = length === UNDEFINED;

	if (isObj) {
		for (name in object) {
			if (object.hasOwnProperty(name)) {
				if (callback.call(object[name], name, object[name]) === FALSE) {
					break;
				}
			}
		}
	} else {
		for (value = object[0]; i < length && callback.call(value, i, value) !== FALSE; value = object[++i]) {
			continue;
		}
	}
}

var WHITESPACE_CHARACTERS = /\t|\n|\r/g,
	EMPTY_STRING = "",
	PLACEHOLDER_STRING = "$1",
	END_MUSTACHE = "}",
	
	// Minification optimizations
	TRUE = true,
	FALSE = false,
	NULL = null,
	UNDEFINED = undefined;

function buildSelectorTree(text) {
	var rules = [], ruletext, rule,
	    match, selector, proptext, splitprop, properties, sidx, prop, val;

	// Tabs, Returns
	text = text.replace(WHITESPACE_CHARACTERS, EMPTY_STRING);

	// Leading / Trailing Whitespace
	text = text.replace(/\s?(\{|\:|\})\s?/g, PLACEHOLDER_STRING);

	ruletext = text.split(END_MUSTACHE);

	forEach(ruletext, function (i, text) {
		if (text) {
			rule = [text, END_MUSTACHE].join(EMPTY_STRING);

			match = (/(.*)\{(.*)\}/).exec(rule);

			if (match && match.length && match[2]) {
				selector = match[1];
				proptext = match[2].split(";");
				properties = [];

				forEach(proptext, function (i, x) {
				    sidx = x.indexOf(":");
                    prop = x.substring(0, sidx).trim();
                    val = x.substring(sidx+1).trim();
                    
					if (prop) {
						properties.push({
							property : prop,
							value : val
						});
					}
				});

				if (selector && properties.length) {
					rules.push({
						selector : selector,
						properties : properties
					});
				}
			}
		}
	});

	return rules;
}

})(this);