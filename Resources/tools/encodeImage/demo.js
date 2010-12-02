var encodeImage = require('tools/encodeImage/encodeImage').encodeImage,
    win = Ti.UI.currentWindow,
    button = Ti.UI.createButton({
        title: 'Test encoding',
        width: 200,
        height: 40
    });
    
win.add(button);
button.addEventListener('click', function(){
    Titanium.Media.openPhotoGallery({	
    	success:function(event)	{
    		encodeImage(event.media, win, function(data){
    		    Ti.API.log('imageData', data.substring(0, 1000));
    		});
    	}
    });
});