Ti.include('livestyle.js');
K.style('/tools/livestyle/test.jss');

var win = Ti.UI.currentWindow;
K.createButton({ title: 'Nice button!', className: 'button1' }).appendTo(win);
K.createLabel({ text: 'A label' }).appendTo(win);
K.createTableView({ 
    className: 'tableView1', 
    data: [K.createTableViewRow({
        title: 'row1',
        className: 'row1'
    }),
    K.createTableViewRow({
        title: 'row2'
    })]
}).appendTo(win);

var img = K.createImageView({ className: 'image1', image: "http://www.krawaller.se/logo_mini.png"}).appendTo(win);