/* Copyright 2015, Brad McDermott, All rights reserved. */
'use strict';
let isOn = false;
let version = util.getVersion();
let NEW_INSTALL = util.getSavedVersion() === undefined;
let JUST_UPDATED = !NEW_INSTALL && version !== util.getSavedVersion();
let isAndroid =false;
let TSV_OR_AnkiConnect = localStorage.getItem('TSV_OR_AnkiConnect') == null? 'TSV' : localStorage.getItem('TSV_OR_AnkiConnect');
let is_debugMode =  localStorage.getItem('is_debugMode') == null?  false :  JSON.parse(localStorage.getItem('is_debugMode'));
let hotkey_Enabled = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
let OfflineDict_Mode = localStorage.getItem('OfflineDict_Mode') == null?  7 :  JSON.parse(localStorage.getItem('OfflineDict_Mode'));
let DictLanguageMode = localStorage.getItem('DictLanguageMode') == null?  "Jp" :  localStorage.getItem('DictLanguageMode');
let GreedyWordRecognition_Enabled = localStorage.getItem('GreedyWordRecognition_Enabled') == null?  false :  JSON.parse(localStorage.getItem('GreedyWordRecognition_Enabled'));
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
	console.log("Init. loaded hotkey_Enabled", hotkey_Enabled, " DictLanguageMode: ", DictLanguageMode, " , TSV_OR_AnkiConnect: " , TSV_OR_AnkiConnect , " | is_debugMode: ", is_debugMode, " OfflineDict_Mode: ", OfflineDict_Mode, " GreedyWordRecognition_Enabled: ", GreedyWordRecognition_Enabled);
	util.setVersion(util.getVersion());

	util.addListener("text", handleLookup);
	util.addListener("injectedLoaded", sendScriptData);
	util.addListener("updateIsOn", toggleOnOff);
	util.addListener("showOptions", showOptions);
	util.addListener("EnableGreedyWordRecognition", EnableGreedyWordRecognition);
	util.addListener("DisableGreedyWordRecognition", DisableGreedyWordRecognition);
	util.addListener("addToList", addToList);
	//util.addListener("retrieveCachedVocab", util.retrieveVocabList); 
	util.addListener("setCachedVocab", util.storeVocabList);
	util.addListener("deleteCachedVocab", util.clearVocabList);
	util.addListener("openHighlightedWord_OnNaver", openHighlightedWord_OnNaver);
	util.addListener("openHighlighted_OnGoogleTranslate", openHighlighted_OnGoogleTranslate);
	util.addListener("openHighlighted_OnPapagoTranslate", openHighlighted_OnPapagoTranslate);
	util.addListener("openHighlighted_OnLingq", openHighlighted_OnLingq);
	util.addListener("lookupRangeSearch", lookupRangeSearch);
	

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
function reloadGoogleSpreadSheetDict() {
	console.log("@ background.js . Calling reloadGoogleSpreadSheetDict()");
	dictionary.reloadFromGoogleSpreadSheet_TSV();
	console.log("@ background.js . Completed reloadGoogleSpreadSheetDict()");
}
// Listener callbacks
function broadcastStorageChange() {
	// i.e local storage changed from option page
	//util.sendAllMessage("startListeners");
	TSV_OR_AnkiConnect = localStorage.getItem('TSV_OR_AnkiConnect') == null? 'TSV' : localStorage.getItem('TSV_OR_AnkiConnect');
	is_debugMode =  localStorage.getItem('is_debugMode') == null?  false :  JSON.parse(localStorage.getItem('is_debugMode'));
	OfflineDict_Mode = localStorage.getItem('OfflineDict_Mode') == null?  7 :  JSON.parse(localStorage.getItem('OfflineDict_Mode'));
	DictLanguageMode = localStorage.getItem('DictLanguageMode') == null?  "Jp" :  localStorage.getItem('DictLanguageMode');
	GreedyWordRecognition_Enabled = localStorage.getItem('GreedyWordRecognition_Enabled') == null?  false :  JSON.parse(localStorage.getItem('GreedyWordRecognition_Enabled'));
	console.log("broadcastStorageChange. hotkey_Enabled", hotkey_Enabled, " DictLanguageMode: ", DictLanguageMode, " , TSV_OR_AnkiConnect: " , TSV_OR_AnkiConnect , " | is_debugMode: ", is_debugMode, " OfflineDict_Mode: ", OfflineDict_Mode, " GreedyWordRecognition_Enabled: ", GreedyWordRecognition_Enabled);
	//bench(function(){return dictionary.lookupWords("나는 슬그머니 뒤로 빠졌다. 여기서 내가 할 일은 없다. 이 마인은 김수");}, 100, [], this) ;
	util.sendAllMessage("localStorageChanged", {	
		TSV_OR_AnkiConnect:TSV_OR_AnkiConnect,
		is_debugMode: is_debugMode		
	});
}

function handleLookup(tab, data) {
	if (is_debugMode){		var t = timerF('lookupwords'); 	}

	const found = dictionary.lookupWords(data.text);

	if (is_debugMode){		t.stop();	 }

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
			isAndroid:isAndroid,
			is_debugMode:is_debugMode
		}
	});
	JUST_UPDATED = false;
	//also notify inject.js if VocabList[] exists in localstorage
	retrieveVocabList();
}

function showOptions(tab, data) {

	util.openTab("options.html", tab.id);
}

function EnableGreedyWordRecognition(tab, data){
	GreedyWordRecognition_Enabled = true;
	localStorage.setItem('GreedyWordRecognition_Enabled',true);
}

function DisableGreedyWordRecognition(tab, data){
	GreedyWordRecognition_Enabled = false;
	localStorage.setItem('GreedyWordRecognition_Enabled',false);
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

function openHighlightedWord_OnNaver(tab, data) {
	util.openTab("https://endic.naver.com/search.nhn?sLn=en&query="+data+"&searchOption=all&preQuery=&forceRedirect=N");
}

function openHighlighted_OnGoogleTranslate(tab, data) {
	util.openTab("https://translate.google.com/#auto/ja/"+data+"");
	//https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=미소를짓다"
}

function openHighlighted_OnPapagoTranslate(tab, data) {
	util.openTab("https://papago.naver.com/?sk=ko&tk=ja&st="+data+"");
}

function openHighlighted_OnLingq(tab, data) {
	util.openTab("https://www.lingq.com/en/translate/ko/"+data+"");
}

function lookupRangeSearch(tab, data) {

	var t_RangeSearch = timerF('lookupRangeSearch'); 

	const found = filterRangeSearch(data.text, data.method);

	t_RangeSearch.stop();

	if (found.length > 0) {
		util.sendMessage(tab, { name: "found", data: found });
	}
	
	
	
}

dictionary.load().then(() => init());
