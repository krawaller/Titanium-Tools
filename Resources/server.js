var sys = require('util');
var fs = require('fs');                                                                        

/*var rtrim = /^[\s\0]+|[\s\0]+$/g;  
String.prototype.trim = function(){
    return this.replace(rtrim, "");
}

var str = [123, 34, 97, 34, 58, 49, 44, 34, 98, 34, 58, 91, 34, 104, 101, 106, 34, 44, 51, 93, 125, 13, 10, 0].map(function(c){ return String.fromCharCode(c); }).join("").trim();

sys.puts("c: " + str.substring(str.length - 1).charCodeAt(0));
var o = JSON.parse(str);
  sys.puts(o);
  */

var Framer = function(delimiter) { 
  this.delimiter = delimiter ? delimiter : "\0"; 
  this.buffer = []; 
} 

Framer.prototype.next = function(data) { 
  var frames = data.split(this.delimiter, -1); 
  this.buffer.push(frames.shift()); 
  if(frames.length > 0) { 
      frames.unshift(this.buffer.join('')); 
      this.buffer.length = 0; 
      this.buffer.push(frames.pop()); 
  } 
  return frames; 
}

var framer = new Framer();
var watchingFiles = {};
var _stream;

function parseFrame(frame){
    var o = JSON.parse(frame);
    switch(o.action){
        case 'watch':
            var file = '.' + o.file;
            if(!watchingFiles[file]){
                watchingFiles[file] = true;
                fs.watchFile(file, { interval: 100, persistent: true }, function(curr, prev) {
                    if(curr.mtime.getTime() != prev.mtime.getTime()){
                        fs.readFile(file, function(err, data){
                            _stream.write(JSON.stringify({
                                action: 'filechange',
                                file: o.file,
                                content: data.toString()
                            }));
                        });
                        sys.puts('updated: ' + file);
                        //stream.write('\r\n');
                    }
                });
            }
            break;
    }
}

function getAllFiles(){
    var rfiles = /\.(js|jss)$/;
    readdir = function(path, arr){
        arr = arr || [];
        fs.readdirSync(path).forEach(function(file){
            var f = path + '/' + file;
            fs.statSync(f).isDirectory() ? readdir(f, arr) : rfiles.test(f) && arr.push(f);
        });
        return arr;
    }

    return readdir('.').map(function(file){
        return { name: file, content: fs.readFileSync(file).toString() } ;
    });
}

var net = require('net');
var server = net.createServer(function (stream) {
  stream.setEncoding('utf8');
  stream.on('connect', function () {
      _stream = stream;
    sys.puts('connected - sending files');
    stream.write(JSON.stringify({
        action: 'files',
        files: getAllFiles()
    }));
    
    /*fs.watchFile('livestyle.js', { interval: 100, persistent: true }, function(curr, prev) {
        if(curr.mtime.getTime() != prev.mtime.getTime()){
            sys.puts('updated!');
            stream.write('\r\n');
        }
    });*/
    //stream.write('connect\r\n');
  });
  
  
  stream.on('data', function(data){
      framer.next(data).forEach(parseFrame);
  });
  
  stream.on('end', function () {
    sys.puts('disconnected');
    //stream.write('disconnect\r\n');
    stream.end();
    fs.unwatchFile('livestyle.js');
  });
});
server.listen(8128);