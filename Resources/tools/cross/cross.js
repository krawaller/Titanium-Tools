(function(global){
	var K,
		callbacks = {},
		cid = 0,
		me = this,
		toString = Object.prototype.toString;

K = global.K = global.K || {};
K.isFunc = function(o){ return toString.call(o) === "[object Function]"; };
K.reg = function(obj, label) {
	var lb = '_' + label;
	
	obj.call = function(label, method, data, callback) {
		if(K.isFunc(data) && typeof callback === 'undefined'){
			callback = data;
			data = null;
		}
		cid++;
		callbacks[cid] = callback;
		Ti.App.fireEvent('_' + label, {
			method: method,
			cid: callback ? cid : false,
			source: lb,
			data: data
		});
	};
	
	Ti.App.addEventListener(lb, function(e){
		if(!e.method){
			if(callbacks[e.cid]){
				callbacks[e.cid](e.data);
				delete callbacks[e.cid];
			}
		} else {
		    var i = 0, m = e.method.split("."), tmp, val, o = obj, os = [], fn = function(val){
				if(e.cid){
					Ti.App.fireEvent(e.source, { cid: e.cid, data: val, source: lb });
				}
			};
			
		    while((tmp = o[m[i++]]) && (o = tmp) && os.push(o));
			(o && (K.isFunc(o))) ? 
			((typeof (val = 
				o.apply ? o.apply(
					(os[os.length - 2] || obj), 
					((tmp = (e.data ? (e.data instanceof Array ? e.data : [e.data]) : [])) && tmp.push(fn) && tmp)
				) : o(e.data[0], e.data[1], e.data[2])
			) !== 'undefined') && fn(val))   : fn(o);
		}	
	});
};

})(this);