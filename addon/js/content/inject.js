/* Copyright 2015, Brad McDermott, All rights reserved. */
"use strict";
//TODO  Hanja in its own  column when saving to TSV
//TODO  Toggle Sanseido-like mode for KR-Eng. Maybe naver Dict. Search the manually highlighted keyword.

if (window.browser == null) {
	window.browser = chrome;
}

;(function () {
	let range;
	let currentNode;
	let currentOffset;
	let TSV_OR_AnkiConnect = 'TSV';
	let hotkey_Enabled = true;
	// Use rect for saving highlighted word coordinates
	let rect;
	let isOn;
	let savedX;
	let savedY;
	let highlightedvocabObj = {};
	let highlightedvocabObjMaxLength;
	let highlightedvocabObjFirstIndex;
	let highlightedvocab_CurrentSentence;
	// Box state and variables
	let lookupTimeout;
	let isShowing;
	let isLocked;
	let boxRight;
	let boxLeft;
	let boxTop;
	let boxBottom;
	// box jquery object
	let $dict;
	let $dictInner;
	let $lock;
	let $notification;
	//let $plus = $("<img>", { id: 'toktogi-plus', class: 'toktogi-icon', src: browser.getImageUrl("plus.png") });
	


	// my global obj for saving csv to file
	let SAVED_VOCAB_LIST = [];

	function saveVocab(i){
		// i = dictionary entry index

		console.log("Def found. Saving...\n" +highlightedvocabObj['word'+i] + " | " +highlightedvocabObj['root'+i] + " | " + highlightedvocabObj['defs'+i]+ " | " + highlightedvocab_CurrentSentence + " | " + document.title);

		// If root word a.k.a Dictionary form exist , save root word instead of hightlighted conjugated word
		if (highlightedvocabObj["root"+i]){
			highlightedvocabObj['word'+i] = highlightedvocabObj["root"+i]
		}

		if (TSV_OR_AnkiConnect == 'TSV'){
			// Use 'TSV' List to Save Vocab
			
			//save list locally
			SAVED_VOCAB_LIST.push([highlightedvocabObj['word'+i],highlightedvocabObj['defs'+i],highlightedvocab_CurrentSentence, document.title]);
			//save list in local.storage   (which is still persistent after firefox restart)
			//TODO: since vocablist changes are always updated in localstorage, consider removing SAVED_VOCAB_LIST from inject.js and just simply use 
			// browser.sendMessage({ name: "pushvocablist" , data:[highlightedvocabObj['word'+i],highlightedvocabObj['defs'+i],highlightedvocab_CurrentSentence, document.title] });
			browser.sendMessage({ name: "setCachedVocab" , data:SAVED_VOCAB_LIST });
			showSaveVocabSuccessNotification(highlightedvocabObj['word'+i] + "TSV MODE");
		}

		else{
			// TSV_OR_AnkiConnect == 'AnkiConnect', Import Vocab directly to Anki via AnkiConnect Add-on
			ankiConnect_addNote({
				"Korean_Vocab": highlightedvocabObj['word'+i],
				"Meaning_E":highlightedvocabObj['defs'+i],
				"Context_Sentence":highlightedvocab_CurrentSentence,
				"Source_Title":document.title
				}).then((value) => {
					// fulfillment
					console.log("ankiConnect_addNote() Success ! Result: "+ value);
					showGeneralNotification("Exported To Anki: "+ highlightedvocabObj['word'+i]);
					}, (reason) => {
					// rejection
					console.log("ankiConnect_addNote() Failed ! Reason:"+ reason);
					showErrorNotification("Failed Anki Export.. Reason: "+ reason);
					});

		}

	}

	function addPlusToList(event){

			console.log("called (fx) addPlusToList, Vocab Index to save is: "+event.data.dataIndex);
			getSentenceFromNodeParagrapgh();
			let i = event.data.dataIndex;	
			saveVocab(i);

		
	}
	function displayDef (defArray) {
		// Finds longest word in array of results for highlighting
		const longestMatch = defArray[defArray.length - 1].word;

		// TODO make sure the user hasn't moved the mouse since request
		if (currentNode) {

			highlightMatch(longestMatch.length);

			populateDictBox(defArray);

			// Save highlighted word coordinates

			var selectionBottom = rect.bottom + $(window).scrollTop();

			//Previously used top: savedY + 15, issue arise if mouse Y coordinate is too high when highlighting word(Dict popup will overlap word)
			// or when Y coordinates is is too low (Dict box too far down, can't move mouse over to the box due to isOutOfBox())
			// changed to selectionBottom for better dict popup location.
			$dict.css({ top: selectionBottom, left: savedX }).show();

			// Save box coordinates
			boxTop = $dict.offset().top;
			boxLeft = $dict.offset().left;
			boxRight = boxLeft + $dict.width();
			boxBottom = boxTop + $dict.height();

			isShowing = true;
		}
	}

	/// Highlight the matched text (but not if its in a field).
	function highlightMatch(length) {
		if (currentNode.nodeType === 3) {
			const wordRange = document.createRange();
			wordRange.setStart(currentNode, currentOffset);

			try {
				wordRange.setEnd(currentNode, currentOffset + length);
			}
			catch(err) {
				// This try catch is a gapstop for bug introduced by a makeshift word congujation recognition improvement
				// for exaple , Given the past base form of 먹다 > 먹었. There is no 먹었 or Dict definition, but there is 먹었다
				// This makeshift word congujation recognition will recognise 먹었 as 먹었다. And all seems fine
				// <p>먹었 </p> is fine. But problem arise when trying to highlight , <p>먹었</p> as <p>먹었다</p> . You will get Err: Index or size is negative or greater than the allowed amount
				// When that happens, just hightlight one char less
				// console.log("Error on wordRange.setEnd(currentNode, currentOffset + length) Err: "+ err.message);
				wordRange.setEnd(currentNode, currentOffset + length -1);				
			}
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(wordRange);
			
			rect = wordRange.getBoundingClientRect();
		}
	}

	// Clear dict box, fill with results, longest word on top
	function populateDictBox(defArray) {
		//console.log("@populateDictBox:" +defArray);
		$dictInner.empty();

		highlightedvocabObj = {};

		// because defArray for loop below goes from i to i-- . highlightedvocabObjFirstIndex used for selecting first entry of vocab definition when pressing 's'
		highlightedvocabObjMaxLength = defArray.length;
		highlightedvocabObjFirstIndex = highlightedvocabObjMaxLength - 1;

		for (let i = defArray.length - 1; i >= 0; i--) {
			if (i !== defArray.length - 1) {
				$dictInner.append($("<div>", { class: 'divider' }));
			}

			let word = defArray[i].word;
			highlightedvocabObj['word'+i] = defArray[i].word;
			//console.log('at populateDictBox , i is' + i);



			if (defArray[i].root) {
				word = word + " (" + defArray[i].root + ")";
				highlightedvocabObj['root'+i] = defArray[i].root;

			}

			$dictInner.append(
				$("<span>", { class: 'dict-word' }).text(word)
				
			);

			
			// TODO turn this back on when vocab list is working. 
			// Got-Cha bud !
			var $plus = $("<img>", { class: 'toktogi-plus toktogi-icon', "data-index": i, src: browser.getImageUrl('plus.png') });
			$plus.click({dataIndex: i}, addPlusToList);
			$dictInner.append($plus);

			for (let j = 0; j < defArray[i].defs.length; j++) {
				$dictInner.append(
					$("<span>", { class: 'dict-def' }).text( defArray[i].defs[j])
				);

					if (!highlightedvocabObj['defs'+i]){
						// Prevent definition from containing something like  'Undefined | etc | etc2'
						highlightedvocabObj['defs'+i] = defArray[i].defs[j];
					}

					else{
						highlightedvocabObj['defs'+i] = highlightedvocabObj['defs'+i] + '|' + defArray[i].defs[j];
					}
					
				
			}

			//console.log('highlightedvocabObj["word"+i]. : ' + highlightedvocabObj['word'+i] + ' Definition: '+ highlightedvocabObj['defs'+i]+' Sentence is :' + highlightedvocab_CurrentSentence);

		}
	}
	function getSentenceFromNodeParagrapgh(){
		let nodeParagraph = currentNode.data;
		let nodeSentence;

		//let wordRange = '두각을';
		//let pBeforeWordRange = nodeParagraph.substring(0,nodeParagraph.indexOf(wordRange));
		let pBeforeWordRange = nodeParagraph.substring(0,currentOffset);

		let sBeforeWordRangeIndex = pBeforeWordRange.lastIndexOf('.');
		
		// If '.' not found before word range, therefore returning -1 index , then include everything 
		if (sBeforeWordRangeIndex == -1){
			sBeforeWordRangeIndex = 0;
		}
		
		let WordRange_Sentence_End_Index = nodeParagraph.indexOf('.', currentOffset);
		
		
		// if  '.' not found at the end of sentence, then include everything after wordrange index
		if (WordRange_Sentence_End_Index == -1){
			nodeSentence = nodeParagraph.substring(sBeforeWordRangeIndex);
		}
		else{
			nodeSentence = nodeParagraph.substring(sBeforeWordRangeIndex,WordRange_Sentence_End_Index);
		}

		//console.log("currentOffset "+currentOffset);
		//console.log("pBeforeWordRange" + pBeforeWordRange + " | sBeforeWordRangeIndex: "+sBeforeWordRangeIndex + " | WordRange_Sentence_End_Index:" + WordRange_Sentence_End_Index);
		//console.log("nodeSentence: " + nodeSentence);
		// highlightedvocab_CurrentSentence = currentNode.data;
		highlightedvocab_CurrentSentence = nodeSentence;
	}
	// Decide whether the mouse has moved far enough away to dimiss
	// the dictionary pop-up.
	function isOutOfBox (x, y) {
		if (browser.getStartNode(range) === currentNode &&
			browser.getOffset(range) !== currentOffset) return true;
		if (
			(x <= boxRight + 5) &&
			(x >= boxLeft - 5) &&
			(y >= boxTop - 40) &&
			(y <= boxBottom + 10)
		) return false;
		return true;
	}

	function closeBox () {
		isShowing = false;
		$dict.hide();
	}

	function getCurrentNodeContents() {
		if (currentNode.nodeType === 3) {
			//console.log("Current node content\n\n" + currentNode.data)
			return currentNode.data;
		} else {
			return currentNode.value;
		}
	}

	function lookupWord () {
		// Already showing dict
		if (isShowing) {
			return;
		}

		// No text after mouse
		if (!range) {
			return;
		}

		const startNode = browser.getStartNode(range);

		// startNode sometimes null
		if (startNode === null) {
			return;
		}

		const isTextOrField =
			startNode.nodeType === 3 ||
			startNode.nodeName === "INPUT" ||
			startNode.nodeName === "TEXTAREA";

		if (isTextOrField) {
			currentNode = startNode;
			currentOffset = browser.getOffset(range);
			// TODO more efficient searching, check for adjacent nodes
			const text = getCurrentNodeContents().slice(currentOffset);
			browser.sendMessage({ name: "text", data: { text } });
		}
	}

	function ankiConnect_addNote ( vFieldsObj) {
		/*
		vFieldsObj Example:
		let vFieldsObj = {	
			"Korean_Vocab": highlightedvocabObj['word'+ChosenDictVocabEntryIndex],
			"Meaning_E":highlightedvocabObj['defs'+ChosenDictVocabEntryIndex],
			"Context_Sentence":highlightedvocab_CurrentSentence,
			"Source_Title":document.title
		};
		*/
		
		//TODO: Hard Coded deckname & Model name
		let action = "addNote";
		let version = 6;
		let deckname = "Vocab_Toktogi";
		let modelName = "Toktogi";



		let params = {
			"note": {
				"deckName": deckname,
				"modelName": modelName,
				"fields": vFieldsObj,
				"tags": [
					"toktogiPlus"
				]

			}
			};
		
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.addEventListener('error', () => reject('failed to connect to AnkiConnect'));
			xhr.addEventListener('load', () => {
				try {
					const response = JSON.parse(xhr.responseText);
					if (response.error) {
						throw response.error;
					} else {
						if (response.hasOwnProperty('result')) {
							resolve(response.result);
						} else {
							reject('failed to get results from AnkiConnect');
						}
					}
				} catch (e) {
					reject(e);
				}
			});
	
			xhr.open('POST', 'http://127.0.0.1:8765');
			xhr.send(JSON.stringify({action, version, params}));
		});

	}
	

	function startListeners () {
		// @savetofile feature
		console.log("@inject startListeners, hotkey_Enabled:", hotkey_Enabled);
		if (hotkey_Enabled == true){
			$(document).on("keyup", function (event) {

			const ekeyName = event.key;
			var ekeyCode = event.keyCode;
			
			if (ekeyCode ==83 || ekeyName==1 || ekeyName==2 || ekeyName==3  || ekeyName==4 ){
				
				getSentenceFromNodeParagrapgh();
				console.log("pressed "+ekeyName);
				
				// Only save when definition found and text highlighted
				let ChosenDictVocabEntryIndex 
				if  (ekeyCode ==83 || ekeyName==1){
					ChosenDictVocabEntryIndex = highlightedvocabObjFirstIndex;
				}
				else {
					// i.e. Press key '4' , then  ChosenDictVocabEntryIndex =  highlightedvocabObjMaxLength - 4
					ChosenDictVocabEntryIndex = highlightedvocabObjMaxLength - ekeyName;
				}
				

				if (isShowing && currentNode.nodeType === 3 && highlightedvocabObj['word'+ChosenDictVocabEntryIndex] !=  null){
					saveVocab(ChosenDictVocabEntryIndex);
				}

			}
			else if (ekeyCode ==88 && TSV_OR_AnkiConnect == 'TSV'){
				console.log("pressed 'x', downloading ");

				browser.downloadTSVFile(SAVED_VOCAB_LIST);
			}
			else if (ekeyCode ==80 && TSV_OR_AnkiConnect == 'TSV'){
				/* To reset vocabList. Use option menu instead.
				if (confirm("Confirm Reset Vocab List ?")) {

					console.log("pressed 'p', Purging Vocab from Cached storage ");
					browser.sendMessage({ name: "deleteCachedVocab" });
					showGeneralNotification("pressed 'p', Purged Vocab from Cached storage");
				
				}
				*/
			}

			else if (ekeyCode ==77){
				//ekeyCode ==77 == m
				if (confirm("Show Toktogi Option?")) {
					browser.sendMessage({ name: "showOptions" });
				}
			}
			//alert('keypress event\n\n' + 'key: ' + ekeyName+ '  key code:' +ekeyCode + 'isOn var: '+ isOn) ;
			});
			
		}
		$(document).on("mousemove", function (event) {
			clearTimeout(lookupTimeout);

			const pageX = event.clientX;
			const pageY = event.clientY;

			range = browser.getRange(pageX, pageY);

			if (!isShowing) {
				savedX = $(window).scrollLeft() + pageX;
				savedY = $(window).scrollTop() + pageY;
				lookupTimeout = setTimeout(lookupWord, 5);
				return;
			}

			// if showing, see if mouse has left dict/word area
			if (!isLocked && isOutOfBox(pageX + $(window).scrollLeft(), pageY + $(window).scrollTop())) {
				closeBox();
				// Remove selection
				if (currentNode.nodeType === 3) {
					window.getSelection().removeAllRanges();
				}
			}
		});

		$lock.click(function (event) {
			isLocked = !isLocked;
			updateLock();
		});

		isLocked = false;
	}

	function turnOn() {
		if (!$notification) return;

		$notification.show();
		setTimeout(function () {
			$notification.hide();
		}, 5000);
		startListeners();
	}

	function stopListeners() {
		$(document).off("mousemove");
		$(document).off("keyup");
		$lock.off("click");
		showErrorNotification("Toktogi Turned Off ");
	}

	function showSaveVocabSuccessNotification(inputV) {
		const $SaveVocabSuccessNotification	=	$("<div>", { id: 'SaveVocabSuccess-notification' })
		.text("Vocab Saved: " + inputV)
		.addClass("card-panel grey lighten-4")
		.appendTo("body");

		$SaveVocabSuccessNotification.show();

		setTimeout(function () {
			$SaveVocabSuccessNotification.hide();
		}, 1000);

	}

	function showGeneralNotification(inputM) {
		const $GeneralNotification	=	$("<div>", { id: 'General_notification' })
		.text(inputM)
		.addClass("card-panel green lighten-4")
		.appendTo("body");

		$GeneralNotification.show();

		setTimeout(function () {
			$GeneralNotification.hide();
		}, 1000);

	}

	function showErrorNotification(inputM) {
		const $GeneralNotification	=	$("<div>", { id: 'Error_notification' })
		.text(inputM)
		.addClass("card-panel green lighten-4")
		.appendTo("body");

		$GeneralNotification.show();

		setTimeout(function () {
			$GeneralNotification.hide();
		}, 1000);

	}

	function showUpdateNotification() {
		const $update = $("<div>", { id: 'update-notification' }).appendTo("body");
		const $updateText = $("<span>").text("Toktogi has been ");
		const $updateLink = $("<a>").text("updated").appendTo($updateText);

		$update.append($updateText);

		$updateText.on("click a", function (event) {
			event.preventDefault();
			browser.sendMessage({ name: "showOptions" });
			$update.hide();
		});

		setTimeout(function () {
			$update.hide();
		}, 12000);
	}

	function updateLock() {
		if (isLocked) {
			$lock
				.attr("src", browser.getImageUrl("lock.png"));
		} else {
			$lock
				.attr("src", browser.getImageUrl("unlock.png"));
		}
	}

	// Kick things off when response comes back from bg page
	function loadData(data) {
		isOn = data.isOn;
		TSV_OR_AnkiConnect = data.TSV_OR_AnkiConnect;
		hotkey_Enabled = data.hotkey_Enabled;
		if (data.JUST_UPDATED) {
			showUpdateNotification();
		}

		$dict = $("<div>", { id: 'dict' })
			.addClass("card-panel grey lighten-4")
			.appendTo("body");
		$dictInner = $("<div>", { id: 'dict-inner' }).appendTo($dict);
		$lock = $("<img>", { id: 'toktogi-lock', class: 'toktogi-icon' }).appendTo($dict);
		updateLock();
		$notification = $("<div>", { id: 'toktogi-notification' })
			.text("Toktogi is on")
			.addClass("card-panel grey lighten-4")
			.appendTo("body");

		if (isOn) {
			startListeners();
		}
	}
	
	function onlocalStorageChanged(data){
		//TSV_OR_AnkiConnect = browser.extension.getBackgroundPage().localStorage.getItem('TSV_OR_AnkiConnect') || 'TSV';
		TSV_OR_AnkiConnect = data.TSV_OR_AnkiConnect;
		console.log("@Content inject.js onlocalStorageChanged, TSV_OR_AnkiConnect:" + TSV_OR_AnkiConnect);
	}

	function readCachedVocabListResult(data) {
		//data got send in { vocablist: Array[0] }
		SAVED_VOCAB_LIST = data.vocablist;
		//console.log("At inject.js, doctitle: " + document.title + " Updated SAVED_VOCAB_LIST from Cached length:", SAVED_VOCAB_LIST.length);
		//showGeneralNotification("VocabList Refreshed");

	}

	browser.addListener("injectedData", loadData);
	browser.addListener("found", displayDef);
	browser.addListener("startListeners", turnOn);
	browser.addListener("stopListeners", stopListeners);
	browser.addListener("cachedVocabListResult",readCachedVocabListResult );
	browser.addListener("localStorageChanged",onlocalStorageChanged );
	browser.addListener("toggle-hotkey",function(data){hotkey_Enabled = data.hotkey_Enabled;console.log("@ inject.js hotkey_Enabled" , hotkey_Enabled);showGeneralNotification("Hotkey_On :"+ data.hotkey_Enabled); if (hotkey_Enabled){startListeners();}else{$(document).off("keyup");} });

	browser.initInject();
})();
