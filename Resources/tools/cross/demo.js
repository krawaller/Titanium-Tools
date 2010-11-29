//Ti.UI.createAlertDialog({ title: 'hej', message: 'ho' }).show();
Ti.include('cross.js');

// Register this context under the name "demo"
// The following function augments the passed object with a "call" function
K.reg(this, 'demo');
// Now this context can call other contexts, as well as being called.

// Let's try calling "app", since we registered that context in app.js
call('app', 'val',      null, function(val){ Ti.API.log('val', val);      }); // Should log [VAL] 7
call('app', 'fn',       [1],  function(val){ Ti.API.log('fn', val);       }); // Should log [FN] 3
call('app', 'deferred', [2],  function(val){ Ti.API.log('deferred', val); }); // Should log [DEFERRED] 5	
// See that we can fetch plain variables, functions and deferred functions

// Set some properties to fetch from inside the webview below
Ti.App.Properties.setInt('int', 1);
Ti.App.Properties.setString('string', "howdy");
Ti.App.Properties.setBool('bool', false);
Ti.App.Properties.setList('list', [1, 2, 'unicorn']);

// Create a webview to call into as well as from
var webview = Ti.UI.createWebView({ url: "cross.html" });
Ti.UI.currentWindow.add(webview);

webview.addEventListener('load', function(){ 
	call('web', 'w', null, function(val){ Ti.API.log('webview variable w', val); }); // Should log [WEBVIEW VARIABLE W] 72
});

// Let's try calling the myclass instance in app.js
call('myclass', 'val', null, function(p){ Ti.API.log('myclass val', p); }); // Should log [MYCLASS VAL] 3
call('myclass', 'plus', [1], function(p){ Ti.API.log('myclass plus',  p); }); // Should log [MYCLASS PLUS] 4