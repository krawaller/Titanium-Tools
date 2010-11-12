Ti.include('livestyle.js');
K.style('/tools/livestyle/test.jss');


var win = Ti.UI.currentWindow;
K.createButton({ title: 'hej', className: 'button1' }).appendTo(win);
K.createButton('button2').appendTo(win);
K.createLabel('label1');



/*setTimeout(function(){
    socket.write(JSON.stringify({ action: 'watch', file: 'livestyle.js' }));
},1000);*/