# Titanium Tools

  This will be a sweet collection of tools for [Appcelerator](http://www.appcelerator.com)'s [Titanium Mobile](http://github.com/appcelerator/titanium_mobile).

## Cross context calls
  Titanium apps are written using JavaScript (Yeay!). Different windows and webviews have different execution contexts, but may communicate through events. This is very powerful, but not very practical and userfriendly for most people. What if you'd like to just fetch a variable or run a function in another context and return the value? You could do that manually with a lot of sweat, or you can do it crazy simple with this library. It's your call (!).

### Examples
  First you'll have to import the library through `Ti.include('path/to/cross.js');`.
Then you get the global `K` object which has the method `reg`. When you call this reg method, you pass an object to bind to, and a label marking this object:
    
	/**
	 * Register an object to send and receive cross context calls
	 * @param {object} obj    The object to register. This is augmented with a call method, and receiving calls are bound to this
	 * @param {string} label  The label the object is called through.
	 */
    K.reg(obj, label);

Registering an object augments it with the method `call`. Call takes the following parameters:

    /**
     * Call another context
     * @param {string} label  The label the other context was registered under
     * @param {string} method The method or variable we'd like to call/fetch
     * @param {array} label   An optional array of arguments passed to the called method
     * @param {string} label  An optional callback which receives the result of the method
     */
	call(label, method, [args], [callback]);
	
However, we need at least two contexts to be able to call something, right?
In the source, we have four different contexts:
"app"     in app.js
"myclass" in app.js
"demo"    in demo.js
"web"     in cross.html

All these contexts can talk to each other - even the webview context in cross.html.
We take advantage of this and write the following shim to let a webview access Ti.App.Properties (example from source):

	<html>
		<head></head>
	<body>
		<h1>Cross contexts</h1>
		<p>Please check your logs</p>
		<script src="cross.js"></script>
		<script>
			K.reg(this, 'web');

			// A tiny shim to let us call Ti.App.Properties from this webview.
			// However, since all calls are async, we'll have to provide a callback if we'd like to do something with the return value
			var ps = Ti.App.Properties = {};
			['Int', 'String', 'List', 'Bool'].forEach(function(type){
				['get', 'set'].forEach(function(f){
					ps[f + type] = function(p, v, c){ return call('app', 'Ti.App.Properties.' + f + type, [p, v], K.isFunc(v) ? v : c); }
				});
			});
			
			// Let's try our shim - the following variables are set in demo.js
			Ti.App.Properties.getInt(    'int',    function(p){ Ti.API.log(['int',    p]); }); // Should log [INT] 1
			Ti.App.Properties.getString( 'string', function(p){ Ti.API.log(['string', p]); }); // Should log [STRING] "howdy"
			Ti.App.Properties.getBool(   'bool',   function(p){ Ti.API.log(['bool',   p]); }); // Should log [BOOL] false (or 0)
			Ti.App.Properties.getList(   'list',   function(p){ Ti.API.log(['list',   p]); }); // Should log [LIST] [1, 2, "unicorn"]
		</script>
	</body>
	</html>

Et voila. Suddenly we have access to Ti.App.Properties in a webview as easy as that! However, please note that these calls are async, so we need to provide a callback!

The library tries to be smart, so your "method" can point to a plain variable, a method that returns directly, our a method that returns later. If the method is a true function, it's passed a callback as the last parameter. This callback should be called with the result when it's available:

	/* app.js */
	// === Cross context demo
	Ti.include('tools/cross/cross.js');

	// Register this context under the name "app"
	// The following function augments the passed object with a "call" function
	K.reg(this, 'app');

	// Some different types we'll fetch from tools/cross/demo.js:
	var val = 7, // Plain variable
		fn = function(toAdd){ return 2 + toAdd; }, // Directly returning function
		deferred = function(toAdd, callback){ 
			setTimeout(function(){ callback(toAdd + 3); }, 1000);  // Deferred function returning through callback
		};
		
		
	/* demo.js */
	Ti.include('cross.js');
	K.reg(this, 'demo');
	
	// Let's try calling "app", since we registered that context in app.js
	call('app', 'val',      null, function(val){ Ti.API.log('val', val);      }); // Should log [VAL] 7
	call('app', 'fn',       [1],  function(val){ Ti.API.log('fn', val);       }); // Should log [FN] 3
	call('app', 'deferred', [2],  function(val){ Ti.API.log('deferred', val); }); // Should log [DEFERRED] 5

You can also bind to an object instead of the global context like this:

	/* app.js */
	Ti.include('tools/cross/cross.js');
	K.reg(this, 'app');
	
	// Create a class to test registering of instances
	var MyClass = (function(){
		function MyClass(val){
			this.val = val;
		};
		MyClass.prototype = {
			plus: function(a){ return this.val + a; }
		};
		return MyClass;
	})();

	// Create an instance and register it to show that we can bind to objects too
	var my = new MyClass(3);
	K.reg(my, 'myclass');
	
	
	/* demo.js */
	Ti.include('cross.js');

	// Register this context under the name "demo"
	K.reg(this, 'demo');
	
	// Let's try calling the myclass instance in app.js
	call('myclass', 'val',       function(p){ Ti.API.log('myclass val', p); }); // Should log [MYCLASS VAL] 3
	call('myclass', 'plus', [1], function(p){ Ti.API.log('myclass plus',  p); }); // Should log [MYCLASS PLUS] 4
	
Please try it out. Be warned - tt's an early release, so there might be bugs.


LICENSE
---

Copyright (c) 2010 Krawaller

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
