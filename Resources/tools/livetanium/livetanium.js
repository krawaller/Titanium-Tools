// Inlining cross.js since it's a dependency of livetanium
(function(global){
var K = (global.K = global.K || {}), callbacks = {}, cid = 0, me = this, toString = Object.prototype.toString;

K.isFunc = function(o){ return toString.call(o) === "[object Function]"; };
K.reg = function(obj, reglabel) {
	var lb = '_' + reglabel;
	obj.call = function(label, method, data, callback) {
		if(K.isFunc(data) && typeof callback === 'undefined'){
			callback = data;
			data = null;
		}
		cid++;
		callbacks[cid] = callback;
		Ti.App.fireEvent('_' + label, { method: method, cid: callback ? cid : false, source: reglabel, data: JSON.stringify(data) });
	};
	
	Ti.App.addEventListener(lb, function(e){
	    var data = eval('(' + e.data + ')'); // JSON.parse seem to be broken on Android
		if(!e.method){
			if(callbacks[e.cid]){
				callbacks[e.cid](data);
				delete callbacks[e.cid];
			}
		} else {
		    var i = 0, m = e.method.split("."), tmp, val, ctx, o = obj, os = [], fn = function(val){
				if(e.cid){ 
				    Ti.App.fireEvent('_' + e.source, { cid: e.cid, data: val, source: lb }); 
				}
			};
			
		    while((tmp = o[m[i++]]) && (o = tmp) && os.push(o));
		    
		    if(o && (K.isFunc(o))){
		        ctx = os[os.length - 2] || obj;
		        tmp = data ? ((data instanceof Array) ? data : [data]) : [];
		        tmp.push(fn);
		        tmp.push(e);
		        val = o.apply ? o.apply(ctx, tmp) : o(data[0], data[1], data[2]);
		        if(typeof (val) !== 'undefined'){
		            fn(val);
		        }
		    } else {
		        fn(o);
		    }
		}	
	});
};
})(this);

(function(global){
if(global.K && global.K.hasLivetanium){ global.K.reset(); Ti.API.log('early opt-out'); return; }    

var K = (global.K = global.K || {}), slice = Array.prototype.slice, toString = Object.prototype.toString;
K.hasLivetanium = true;

/**
 * Bind a function to a context
 * @param ctx Context to run the function in
 * @return Function applying new scope to original function
 */
Function.prototype.bind = function(ctx){ 
	var fn = this;
	return function(){ 
		fn.apply(ctx || fn, slice.call(arguments)); 
	}; 
};

/**
 * Trim a string of leading and trailing whitespace
 * @return String trimmed of whitespace
 */
var rtrim = /^\s+|\s+$/g;
String.prototype.trim = function(){
    return this.replace(rtrim, "");  
};

K.isFunc = function(obj){ return toString.call(obj) === "[object Function]"; };


function singleExtend(destination, source){
    for (var property in source) { destination[property] = source[property]; }
    return destination;
};
/**
 * Merge any number of objects where the rightmost has precedence
 * @param obj... Object to be merged
 * @return Object with all arguments merged
 */
var extend = K.extend = function(obj1, obj2, obj3){
	if(!obj3){
		return singleExtend(obj1, obj2);
	} else {
		var args = Array.prototype.slice.call(arguments),
			obj = args.shift();
		while(args.length){ obj = singleExtend.apply(null, [obj, args.shift()]); }
		return obj;
	}
};


var styles = K.styles = {};
K.extendStyle = K.addStyle = function(opts){
	K.extend(styles, opts || {});
};


/**
 * Adding event listeners to TiUIObjects
 * @param name Event name
 * @param fn Function callback
 * @param ctx Context to bind callback to. Optional.
 */
function on(name, fn, ctx){
	this.addEventListener(name, fn.bind(ctx || this));
	return this;
}

/**
 * Let TiUIObjects be appended to other object. Chainable
 * @return Object function called on 
 */
function appendTo(el){
	el.add(this);
	return this;
}

// The current window - added to K._els to achieve immediate styling
var thisWindow = (Ti.UI.currentWindow || win) || {};
thisWindow._type = 'window';

var els = K._els = K._els || [thisWindow];
var styleCache = {};

/**
 * Calculating style for object
 * @param opts Object containing options OR String containing selector
 * @param type String type of object
 * @return Object of calculated style 
 */
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


// Function returning constructor string from type string
var rrep = /^(\w)(\w+)/,
	rfunc = function($0, $1, $2){
	    return $1.toUpperCase() + $2;
	};

// Create object factories
['window', 'view', 'tableView', 'imageView', 'label', 'tableViewSection', 'tableViewRow', 'buttonBar', 'button', 'tabbedBar', 'webView', 'scrollView', 'activityIndicator', 'textField', 'toolbar', 'searchBar', 'tab', 'picker']
.forEach(function(type){
    var constructorString = type.replace(rrep, rfunc),
        factoryString = 'create' + constructorString;
    K[factoryString] = function(opts){
        var o = extend(getStyle(opts, type), opts);
	    var el = Ti.UI[factoryString](o);
	    el.on = on;
	    el.appendTo = appendTo;
	    el._type = type;
	    els.push(el);
        return el;
    };
});

/**
 * Refresh all styles with optional style injection
 * @param styleString String containing JSS to be parsed and injected into style. Optional.
 */
K.refreshStyles = function(styleString){
    if(styleString){
        styleCache = {};
        K.style(null, styleString);
    } 
    els.forEach(function(el){
        var s = K.getStyle(el, el._type);
        for(var p in s){
            el[p] = s[p];
        }
    });    
};

/**
 * Start watching for file changes to be piped from nodejs server
 * @param host Host for server
 * @param port Port for server. Default is 8128
 * @param win Window to add 'close' listener to for cleaning up socket
 */
K.watch = function(host, port, win){
    // Only open one connection, preferrably from app.js
    if(Ti.App.Properties.getBool('_watching')){ return false; }
    Ti.App.Properties.setBool('_watching', true);
    
    var watchers = {},
        Watcher = {
            watch: function(file, callback, e){
                if(!watchers[file]){
                    socket.write(JSON.stringify({ action: 'watch', file: file }));
                    watchers[file] = e.source;
                }
            }
        };
    
    // Use Krawaller's cross context library    
    K.reg(Watcher, '_watcher');
    
    var socket = Titanium.Network.createTCPSocket({
    	hostName: host, 
    	port: port, 
    	mode: Titanium.Network.READ_WRITE_MODE
    });
    
    socket.addEventListener('read', function(e) {
        try {
            var o = JSON.parse(e.data.text);
            switch(o.action){
                case 'filechange': // Upon filechange, call all applicable listening contexts
                    Watcher.call(watchers[o.file], 'update', [o.content, o.file]);
                    break;
                
                case 'files': // Write all files to app tmp directory on startup
                    Ti.API.info('Socket connected - receiving files');
                    o.files.forEach(function(f, i){
                        var name = f.name.replace(/\.\//, function($0){ return '';  }).replace(/\//g, '-'),
                            path = Ti.Filesystem.tempDirectory.replace(/\/$/, ''),
                            h = Ti.Filesystem.getFile(path, name);
                        
                        h.write(f.content);
                    });
                    break;
                    
                case 'message':
                    Ti.API.info('Socket message', o.message);
                    break;
            }
        } catch(e){ Ti.API.error('error', e); }
    });

    // Cleanup
    win = win || Ti.UI.currentWindow;
    if(win){ 
        win.addEventListener('close', function(e) {
        	if (socket.isValid) {
        	    Ti.API.log('close socket');
        		socket.close();
        	}
        });
    }

    socket.connect();
    socket.write(JSON.stringify({ action: 'echo', message: 'Socket connected' }));
};

var watching = {}, // Map of filenames currently being watched 
    StyleWatcher = {  // Stylewatcher being called upon filechange
        update: function(content, file){
            var m = file.match(/[^.]+$/); // Get file extension
            switch(m && m[0]){
                case 'jss':
                    Ti.API.log('Applying styles', file);
                    K.refreshStyles(content);
                    break;
            
                case 'js':
                    Ti.API.log('Reloading', file);
                    eval('try {' + content + '} catch(e){ Ti.API.error(e); }');
                    break;
            }
        }
    };

/**
 * Cleanup function run on dynamic reloading
 */
K.reset = function(){
    els = K._els = [thisWindow]; // Clear element cache
    styleCache = {}; // Clear style cache
    
    // Remove window elements
    (thisWindow.children || []).forEach(function(el){
        Ti.API.log('removing', el);
        thisWindow.remove(el);
    });
};

/**
 * Register for changes of a certain file
 * @param file Filename for which to listen for changes
 */
K.regWatch = function(file){
    if(file && !watching[file] && (file = file.substring(0, 1) == '/' ? file : '/' + file)){
        K.reg(StyleWatcher, '_watching_' + file);
        StyleWatcher.call('_watcher', 'watch', [file]);
        watching[file] = true;
    }
};


/**
 * Parse and apply styles found in specified file or in call
 * @param file Filename containing styles. Optional
 * @param str String containing styles. Optional
 */
K.style = function(file, str){
    K.regWatch(file); // Listen for changes of file
    try {
        var h = file && Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, file.substring(1).replace(/\//g, '-')),
            tmp = h && h.exists && (h.read() || {}).text;
        
        // Get style string, either direct string, tempfile or original resource   
        str = str || tmp || Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, file).read().text;
        var selectors = buildSelectorTree(str);
        (selectors || []).forEach(function(sel){
            var obj = styles[sel.selector] = styles[sel.selector] || {};
            sel.properties.forEach(function(prop){
                obj[prop.property] = prop.value;
            });
        });
        
        K.refreshStyles(); // Refresh styles
    } catch(e){ Ti.API.log('error', e); }
};

// Listen for changes to current window
K.regWatch(thisWindow.url);


// Below follows the CSS parser from selectivizr which we're very thankful for

/*
	selectivizr v1.0.0 - (c) Keith Clark, freely distributable under the terms 
	of the MIT license.

	selectivizr.com
*/

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
						properties.push({ property : prop, value : val });
					}
				});

				if (selector && properties.length) {
				    rules.push({ selector : selector, properties : properties });
				}
			}
		}
	});

	return rules;
}
})(this);