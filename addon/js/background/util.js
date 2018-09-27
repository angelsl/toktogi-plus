/* Copyright 2015, Brad McDermott, All rights reserved. */
'use strict';

if (window.browser == null) {
	window.browser = chrome;
}

const util = {};

util.openTab = function(url, openerId) {
	browser.tabs.create({
		url: browser.extension.getURL(url)
	});
};

util.setBadgeText = function(text) {
	browser.browserAction.setBadgeText({ text: text });
};

util.getSavedVersion = function() {
	return localStorage.version;
};

util.getVersion = function() {
	return browser.runtime.getManifest().version;
};

util.setVersion = function(version) {
	localStorage.version = version;
};

util.sendMessage = function(tab, data) {
	// data is an object that includes 'name' and 'data' fields
	if (tab && tab.id !== null) {
		browser.tabs.sendMessage(tab.id, data);
	} else {
		browser.runtime.sendMessage(data);
	}
};

util.getDictJson = async function() {
	let response = await fetch('dict.json');
	return response.json();
};

util.sendAllMessage = function(name, data) {
	browser.tabs.query({}, function(tabs) {
		var message = { name: name, data: data };
		for (var i=0; i<tabs.length; ++i) {
			util.sendMessage(tabs[i], message);
		}
	});
};

util.messageCallbacks = {};

util.addListener = function (messageName, callback) {
	util.messageCallbacks[messageName] = callback;
};

util.addActionListener = function(callback) {
	browser.browserAction.onClicked.addListener(callback);
};


util.messageListener = function (message, sender) {
	var tab = sender.tab,
	    callback = util.messageCallbacks[message.name];

	if (callback) {
		callback(tab, message.data);
	}
};

util.init = function() {
	browser.runtime.onMessage.addListener(util.messageListener);
};

function convertToCSV (objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
}

util.exportCSVFile = function(headers, items, fileTitle) {
    if (headers) {
        items.unshift(headers);
    }

    // Convert Object to JSON
    var jsonObject = JSON.stringify(items);

    var csv = convertToCSV(jsonObject);
	console.log('at util.exportCSVFile')
    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    
}


util.download = function (){
  console.log('at util.download')
  var headers = {
      model: 'Phone Model'.replace(/,/g, ''), // remove commas to avoid errors
      chargers: "Chargers",
      cases: "Cases",
      earphones: "Earphones"
  };

  var itemsNotFormatted = [
      {
          model: 'Samsung S7',
          chargers: '55',
          cases: '56',
          earphones: '57',
          scratched: '2'
      },
      {
          model: 'Pixel XL',
          chargers: '77',
          cases: '78',
          earphones: '79',
          scratched: '4'
      },
      {
          model: 'iPhone 7',
          chargers: '88',
          cases: '89',
          earphones: '90',
          scratched: '6'
      }
  ];

  
  var itemsFormatted = [];

  // format the data
  itemsNotFormatted.forEach((item) => {
      itemsFormatted.push({
          model: item.model.replace(/,/g, ''), // remove commas to avoid errors,
          chargers: item.chargers,
          cases: item.cases,
          earphones: item.earphones
      });
  });

  var fileTitle = 'orders'; // or 'my-unique-title'

  util.exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download
}