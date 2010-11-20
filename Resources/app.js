Ti.UI.setBackgroundColor('#fff');



var tabGroup = Ti.UI.createTabGroup();
var win = Ti.UI.createWindow({  
    title: 'Titanium Tools',
    backgroundColor: '#fff',
	tabBarHidden: true
});
var tab = Ti.UI.createTab({  
    icon: null,
    title: '',
    window: win
});

var tableView = Ti.UI.createTableView({
	data: [{
		title: 'Cross contexts',
		file: 'tools/cross/demo.js'
	},
	{
	    title: 'Livetanium',
	    file: 'tools/livetanium/demo.js'
	}]
});
tableView.addEventListener('click', function(e){
	tab.open(K.createWindow({
		url: e.rowData.file,
		title: e.rowData.title
	}));
});
win.add(tableView);

tabGroup.addTab(tab);  
tabGroup.open();


// Cross contexts
Ti.include('tools/cross/cross.js');

// Livestyle
Ti.App.Properties.setBool('_watching', false);
Ti.include('tools/livetanium/livetanium.js');
K.watch("192.168.10.236", 8128, win);




// Cross context demos

// Register this context under the name "app"
// The following function augments the passed object with a "call" function
K.reg(this, 'app');

// Some different types we'll fetch from tools/cross/demo.js:
var val = 7, // Plain variable
	fn = function(toAdd){ return 2 + toAdd; }, // Directly returning function
	deferred = function(toAdd, callback){ 
		setTimeout(function(){ callback(toAdd + 3); }, 1000); // Deferred function returning through callback
	},

	// Create a class to test registering of instances
	MyClass = (function(){
		function MyClass(val){
			this.val = val;
		};
		MyClass.prototype = {
			plus: function(a){ return this.val + a; }
		};
		return MyClass;
	})(),

	// Create an instance and register it to show that we can bind to objects too
	my = new MyClass(3);
	
K.reg(my, 'myclass');



// Force load
function forceLoad(){Ti.UI.createActivityIndicator();Ti.UI.createAlertDialog();Ti.UI.createAnimation();Ti.UI.createButton();Ti.UI.createButtonBar();Ti.UI.createCoverFlowView();Ti.UI.createEmailDialog();Ti.UI.createImageView();Ti.UI.createLabel();Ti.UI.createOptionDialog();Ti.UI.createScrollableView();Ti.UI.createSlider();Ti.UI.createSwitch();Ti.UI.createTab();Ti.UI.createTabGroup();Ti.UI.createTabbedBar();Ti.UI.createTableView();Ti.UI.createTableViewRow();Ti.UI.createTableViewSection();Ti.UI.createTextArea();Ti.UI.createTextField();Ti.UI.createToolbar();Ti.UI.createView();Ti.UI.createWebView();Ti.UI.createWindow();};
