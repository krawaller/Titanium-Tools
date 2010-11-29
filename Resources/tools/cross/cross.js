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