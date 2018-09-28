/* Copyright 2015, Brad McDermott, All rights reserved. */
"use strict";

if (window.browser == null) {
	window.browser = chrome;
}

;(function (root, browser) {
	root.browser = browser;

	// Generic

	browser.messageCallbacks = {};

	browser.addListener = function (messageName, callback) {
		browser.messageCallbacks[messageName] = callback;
	}

	browser.sendMessage = function (data, callback) {
		browser.runtime.sendMessage(data, callback);
	}

	browser.messageListener = function (message) {
		const callback = browser.messageCallbacks[message.name];

		callback && callback(message.data);
	}


	// Inject.js

	browser.getRange = function (pageX, pageY) {
		if (document.caretPositionFromPoint) {
			return document.caretPositionFromPoint(pageX, pageY);
		} else {
			let output = document.caretRangeFromPoint(pageX, pageY);
			output.offsetNode = output.startContainer;
			output.offset = output.startOffset;
			return output;
		}
	}

	browser.getOffset = function (range) {
		return range.offset;
	}

	browser.getStartNode = function (range) {
		return range.offsetNode;
	}

	browser.initInject = function () {
		browser.runtime.onMessage.addListener(browser.messageListener);

		browser.sendMessage({ name: "injectedLoaded" });
	}

	browser.getImageUrl = function (filename) {
		return browser.extension.getURL("images/" + filename);
	}

	browser.downloadTSVFile = function (data) {

	
		//Anki don't have header for tsv. so don't use this. var tsv = 'Name,Title\n';
		var tsv = '';
		 data.forEach(function(row) {
				 tsv += row.join('\t');
				 tsv += "\n";
		 });
	  
		 console.log(tsv);
		 var hiddenElement = document.createElement('a');
		 hiddenElement.href = 'data:text/tsv;charset=utf-8,' + encodeURI(tsv);
		 hiddenElement.target = '_blank';
		 hiddenElement.download = 'Toktogi_SavedVocabList.tsv';
		 document.body.appendChild(hiddenElement);
		 hiddenElement.click();
		 document.body.removeChild(hiddenElement);

	}
})(window, browser);
