/* Copyright 2015, Brad McDermott, All rights reserved. */
'use strict';
let isOn = false;
let version = util.getVersion();
let NEW_INSTALL = util.getSavedVersion() === undefined;
let JUST_UPDATED = !NEW_INSTALL && version !== util.getSavedVersion();
let isAndroid =false;
let TSV_OR_AnkiConnect = localStorage.getItem('TSV_OR_AnkiConnect') || 'TSV';
let improved_ConjugatedWord_Recognition = localStorage.getItem('improved_ConjugatedWord_Recognition') || 'true';
let hotkey_Enabled = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
let OfflineDict_Mode = localStorage.getItem('OfflineDict_Mode') == null?  7 :  JSON.parse(localStorage.getItem('OfflineDict_Mode'));

function init() {
	if (NEW_INSTALL) {
		util.openTab("guide.html");
	}

	try {
	util.setBadgeText("");
	}

	catch(err) {
		// Too much work to handle runtime.getBrowserInfo() Promise. This will do for now.
		console.log("Unable to set badge text. Likely because Client Browser is Android");
		isAndroid = true;
	}

	browser.browserAction.setTitle({ title: "Toktogi:KR-En Popup Dict (Off)" });

	// Update version after setting JUST_UPDATED
	console.log("loaded hotkey_Enabled", hotkey_Enabled);
	util.setVersion(util.getVersion());

	util.addListener("text", handleLookup);
	util.addListener("injectedLoaded", sendScriptData);
	util.addListener("updateIsOn", toggleOnOff);
	util.addListener("showOptions", showOptions);
	util.addListener("addToList", addToList);
	//util.addListener("retrieveCachedVocab", util.retrieveVocabList); 
	util.addListener("setCachedVocab", util.storeVocabList);
	util.addListener("deleteCachedVocab", util.clearVocabList);

	try {
		browser.commands.onCommand.addListener(toggleHotkey);
		}
	
		catch(err) {
			console.log("Unable to run browser.commands.onCommand. Likely because Client Browser is Android");
			isAndroid = true;
		}

	util.init();
	//util.addListener("localStorageChanged",broadcastStorageChange);
	util.addActionListener(toggleOnOff);
}

function toggleHotkey(command) {
	if (command == "toggle-hotkey") {
		hotkey_Enabled = !hotkey_Enabled;
		localStorage.setItem('hotkey_Enabled',JSON.stringify(hotkey_Enabled));
		console.log("hotkey_Enabled: ", hotkey_Enabled);
		util.sendAllMessage("toggle-hotkey", {	hotkey_Enabled:hotkey_Enabled		});
	}
  }

// Listener callbacks
function broadcastStorageChange() {
	// i.e local storage changed from option page
	//util.sendAllMessage("startListeners");
	TSV_OR_AnkiConnect = localStorage.getItem('TSV_OR_AnkiConnect') || 'TSV';
	improved_ConjugatedWord_Recognition = localStorage.getItem('improved_ConjugatedWord_Recognition') || 'true';
	OfflineDict_Mode = localStorage.getItem('OfflineDict_Mode') == null?  7 :  JSON.parse(localStorage.getItem('OfflineDict_Mode'));

	console.log("broadcastStorageChange, TSV_OR_AnkiConnect: " +TSV_OR_AnkiConnect + " | improved_ConjugatedWord_Recognition: "+improved_ConjugatedWord_Recognition);

	util.sendAllMessage("localStorageChanged", {	TSV_OR_AnkiConnect:TSV_OR_AnkiConnect		});
}

function handleLookup(tab, data) {
	const found = dictionary.lookupWords(data.text);
	if (found.length > 0) {
		util.sendMessage(tab, { name: "found", data: found });
	}
}

function sendScriptData(tab, data) {
	//refresh hotkey_Enabled before sending to be safe
	hotkey_Enabled = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
	util.sendMessage(tab, {
		name: "injectedData",
		data: {
			isOn: isOn,
			JUST_UPDATED: JUST_UPDATED,
			TSV_OR_AnkiConnect: TSV_OR_AnkiConnect,
			hotkey_Enabled: hotkey_Enabled,
			isAndroid:isAndroid
		}
	});
	JUST_UPDATED = false;
	//also notify inject.js if VocabList[] exists in localstorage
	retrieveVocabList();
}

function showOptions(tab, data) {

	util.openTab("options.html", tab.id);
}

function toggleOnOff(tab) {
	isOn = !isOn;

	if (isOn) {
		util.sendAllMessage("startListeners");
		browser.browserAction.setTitle({ title: "Toktogi:KR-En Popup Dict (On)" });
		util.setBadgeText("On");

	} else {
		util.sendAllMessage("stopListeners");
		browser.browserAction.setTitle({ title: "Toktogi:KR-En Popup Dict (Off)" });
		util.setBadgeText("");
	}
}


function retrieveVocabList() {
	// convert result to empty [] if getItem() returns null
	let result = localStorage.getItem('vocabList') == null? []:  JSON.parse(localStorage.getItem('vocabList'));
	util.sendAllMessage("cachedVocabListResult", { vocablist: result });
	//console.log('util.retrieveVocabList: retrieved vocabList :'+result)
};

function addToList(tab, data) {
	// ???
	const definition = data.definition;
	console.log("Received definition object:", data);
}

dictionary.load().then(() => init());
