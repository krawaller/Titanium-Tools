(function(){
    var webview, win;
    exports.encodeImage = function(blob, win, callback){
        var name = 'encodeImage-' + new Date().getTime(),
            filename = Ti.Filesystem.tempDirectory + "/"+name+".jpg",
            tmp = Ti.Filesystem.getFile(filename);
    
        if(!webview){
            webview = Ti.UI.createWebView({
                width: 1,
                height: 1,
                top: -10, 
                left: -10,
                html: '<html><head><meta charset="utf-8"><title></title></head><body><canvas id="canvas"></canvas><script>var datauri, event; function encodeImage(src){ var canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d"), img = new Image(); img.src = src;	img.onload = function(){ canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); datauri = canvas.toDataURL("image/jpeg").substring(23); Ti.App.fireEvent(event); } }</script></body></html>'
            });
            win.add(webview);
            webview.addEventListener('load', function(){ webview.loaded = true; });
        }

        function processReturn(){
            Ti.App.removeEventListener(name, processReturn);
            tmp.deleteFile();
            callback(webview.evalJS('datauri'));
        }

        function process(){    
            Ti.App.addEventListener(name, processReturn);
            tmp.write(blob);
            webview.evalJS('event = "'+name+'"; encodeImage("'+tmp.nativePath+'")');
        }

        if(webview.loaded){ process(); } else { webview.addEventListener('load', process); }
    }
})();