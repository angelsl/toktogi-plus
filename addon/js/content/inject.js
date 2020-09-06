/* Copyright 2015, Brad McDermott, All rights reserved. */
"use strict";
//TODO  Hanja in its own  column when saving to TSV
//TODO  Toggle Sanseido-like mode for KR-Eng. Maybe naver Dict. Search the manually highlighted keyword.

if (window.browser == null) {
	window.browser = chrome;
}

;(function () {

   /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  	if (window.hasRun) {
		  console.log("window.hasRun is true. blocked double content script inject")
		  return;
  	}
	window.hasRun = true;

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
	let $manualhightlight_left;
	let $manualhightlight_right;
	let $manualrefreshdictentry;
	let $openNaverLink;
	let $openHighlightedOnNaverLink;
	let $openHighlightedOnGoogleTranslateLink;
	let $openHighlightedOnPapagoTranslateLink;
	let $openHighlightedOnLingqLink;
	let $lookupStartsWith;
	let $lookupVerbStartsWith;
	let $lookupContains;
	let $lookupVerbContains;
	let $lock;
	let $notification;
	//let $plus = $("<img>", { id: 'toktogi-plus', class: 'toktogi-icon', src: browser.getImageUrl("plus.png") });
	let isAndroid = false;
	let mouseDown;
	let mouseDownCoolDown;
	let is_debugMode = false;

	var timerF = function(name) {
		var start = new Date();
		return {
			stop: function() {
				var end  = new Date();
				var time = end.getTime() - start.getTime();
				console.log('Timer:', name, 'finished in', time, 'ms');
			}
		}
	};
	


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
				"Korean": highlightedvocabObj['word'+i],
				"English":highlightedvocabObj['defs'+i],
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

	function onToggleMnemonic(event){
		//place holder, not used
		console.log("called (fx) onToggleMnemonic");

		var x = document.getElementById("myDIV");
		if (x.style.display === "none") {
		  x.style.display = "block";
		} else {
		  x.style.display = "none";
		}

}
	
	function displayDef (defArray) {
		// Finds longest word in array of results for highlighting
		const longestMatch = defArray[defArray.length - 1].word;
		// TODO make sure the user hasn't moved the mouse since request
		if (currentNode) {
			let pTimer;
			let highlightTimer;
			let populateDictBoxTimer;
			if (is_debugMode){		
				pTimer = timerF('displayDef'); 	
				highlightTimer = timerF('highlightTimer'); 	
			}
			highlightMatch(longestMatch.length);
			if (is_debugMode){		
				highlightTimer.stop();	
				populateDictBoxTimer = timerF('populateDictBoxTimer'); 	
			 }

			populateDictBox(defArray);
			if (is_debugMode){	populateDictBoxTimer.stop();}

			// Save highlighted word coordinates

			var selectionBottom = rect.bottom + $(window).scrollTop();

			//Previously used top: savedY + 15, issue arise if mouse Y coordinate is too high when highlighting word(Dict popup will overlap word)
			// or when Y coordinates is is too low (Dict box too far down, can't move mouse over to the box due to isOutOfBox())
			// changed to selectionBottom for better dict popup location.
			//console.log("savedX: " + savedX + " window.innerWidth :" + window.innerWidth + " $dict.width()" + $dict.width() + "IsDictBoxOutside_RightWindowScreen: "+ (window.innerWidth<=savedX+$dict.width()));

			if (savedX+700>=window.innerWidth && !isAndroid){
				//also make sure device isn't android. As window.innerWidth changes constantly based on zoom size( Which is very often on android) 
				$dict.css({ top: selectionBottom, left: "", right: window.innerWidth-(savedX+100) }).show();
			}
			else{
				$dict.css({ top: selectionBottom, left: savedX, right:"" }).show();
			}
			// Save box coordinates
			boxTop = $dict.offset().top;
			boxLeft = $dict.offset().left;
			boxRight = boxLeft + $dict.width();
			boxBottom = boxTop + $dict.height();

			isShowing = true;
			if (is_debugMode){	pTimer.stop();}
			
		}
	}

	/// Highlight the matched text (but not if its in a field).
	function highlightMatch(length, manualhighlight = false) {
		if (manualhighlight == true) {
			let direction = length >= 1?  'forward' : 'backward';
			window.getSelection().modify('extend', direction, 'character');
			rect = wordRange.getBoundingClientRect();
		  }
		
		else if (currentNode.nodeType === 3) {
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
			$openNaverLink = $("<a>", { href: 'https://endic.naver.com/search.nhn?sLn=en&query='+word+'&searchOption=all&preQuery=&forceRedirect=N', class: 'naverlink', target:"_blank" }).text("🔍").appendTo($dictInner);
			
			/*
			might implement toggle Mnemonics button later
			var $toggleMnemonics = $("<button>", { id: i }).text("Toggle Mnemo").appendTo($dict);
			$toggleMnemonics.click({dataIndex: i}, onToggleMnemonic);
			$dictInner.append($toggleMnemonics);*/

			// Beautify Dictbox Entry, i.e. adding show/hide dict entries which has more that 4 lines , etc.
			let offlinedict2_entry_counter = 0;
			let offlinedict2_total_entry = 0;
			for (let j = 0; j < defArray[i].defs.length; j++) {
				if (defArray[i].defsDictType[j] =="offlinedict2"){
				offlinedict2_total_entry++;
				}
			}
			
			if (defArray[i].mnemonics){
				//if entry also has mnemonics
				let $mnemonics = $("<details>", { class: 'dict-def mnemonics', id:word  });
				$mnemonics.append("<summary>...(Show Mnemo)</summary>");
				$dictInner.append($mnemonics);
				for (let z = 0; z < defArray[i].mnemonics.length; z++) {
					$mnemonics.append(	$("<span>", { class: 'dict-def mnemonics' }).text( defArray[i].mnemonics[z]));
				}
			}
			for (let j = 0; j < defArray[i].defs.length; j++) {
				if (defArray[i].defsDictType[j] =="offlinedict2"){
					offlinedict2_entry_counter++;
					if (offlinedict2_total_entry>6 && offlinedict2_entry_counter==4  ){
						// This means Entry with 5 or more will toggle show/hide , starting from entry 4. >6 because it counts the <br> linebreak
						var $details = $("<details>", { class: 'dict-def offlinedict2' });
						$details.append("<summary>...(Toggle expand)</summary>");
						$dictInner.append($details);
						$details.append(	$("<span>", { class: 'dict-def offlinedict2' }).text( defArray[i].defs[j]));
					}
					else if (offlinedict2_total_entry>6 &&offlinedict2_entry_counter>4){
						$details.append(	$("<span>", { class: 'dict-def offlinedict2' }).text( defArray[i].defs[j]));
					}
					else{
						$dictInner.append(	$("<span>", { class: 'dict-def offlinedict2' }).text( defArray[i].defs[j]));
					}

				}
				else if (defArray[i].defsDictType[j] =="offlinedict3"){
					$dictInner.append(	$("<span>", { class: 'dict-def offlinedict3' }).text( defArray[i].defs[j]));
					$dictInner.append(	$("<span>", { class: 'dict-def offlinedict3tran' }).text( defArray[i].trans[j]));
					//$dictInner.append(	"<span><ul>	<li>Dict config. Now supports both En & JP & Kr definition (See option page)</li><li>Fixed bug. Option page configurations stored and retrieved incorrectly</li><li>Allow reverse range search. e.g. search for Kr def which has english definition containing 'office' word or '江原' hanja</li></ul></span>");
				}
				else {
					$dictInner.append(	$("<span>", { class: 'dict-def' }).text( defArray[i].defs[j]));
				}

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
			//console.log({"currentNode.nodeType":currentNode.nodeType, "currentNode.nodeName":currentNode.nodeName, "currentNode.data":currentNode.data,"currentNode.value":currentNode.value})
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
				

				if (isShowing && (currentNode.nodeType === 3 ||currentNode.nodeName === "INPUT" ||currentNode.nodeName === "TEXTAREA") && highlightedvocabObj['word'+ChosenDictVocabEntryIndex] !=  null){
					saveVocab(ChosenDictVocabEntryIndex);
				}

			}
			else if (ekeyCode ==88 && TSV_OR_AnkiConnect == 'TSV'){
				/*
				console.log("pressed 'x', downloading ");

				browser.downloadTSVFile(SAVED_VOCAB_LIST);*/
			}
			else if (ekeyCode ==80 ){
				/* Press P To test querying KRDict for vocab defn*/

				let tempNode = browser.getStartNode(range);
				console.log({"tempNode.nodeType":tempNode.nodeType, "tempNode.nodeName":tempNode.nodeName, "tempNode.data":tempNode.data,"tempNode.value":tempNode.value})
				/*	
				if (confirm("querying KRDict for vocab defn ?")) {

					//browser.sendMessage({ name: "deleteCachedVocab" });
					getSelectionText();
					showGeneralNotification("pressed 'p', querying KRDict");
				
				}*/

			}

			else if (ekeyCode ==219){
				//ekeyCode ==221 == Bracket Left '[' Turn on Greedy word recognition mode (by adding 'r' batchim to every word)

					browser.sendMessage({ name: "EnableGreedyWordRecognition" });
					showGeneralNotification("pressed '[', EnableGreedyWordRecognition");

			}
			else if (ekeyCode ==221){
				//ekeyCode ==221 == Bracket right ']' turn off Greedy word recognition mode

					browser.sendMessage({ name: "DisableGreedyWordRecognition" });
					showErrorNotification("pressed ']', DisableGreedyWordRecognition");

			}
			else if (ekeyCode ==77 && event.altKey){
				//ekeyCode ==77 == m
				
				if (confirm("Show Toktogi Option?")) {
					browser.sendMessage({ name: "showOptions" });
				}
				
			}
			//alert('keypress event\n\n' + 'key: ' + ekeyName+ '  key code:' +ekeyCode + 'isOn var: '+ isOn) ;
			});
			
		}
		$(document).on('mousedown mouseup', function mouseState(e) {
			if (e.type == "mousedown") {
				//code triggers on hold , use to make sure word lookup won't run when mouse down
				clearTimeout(mouseDownCoolDown);
				mouseDown = true;
			}
			else{
				// mouseDown = false;
				if (isAndroid){
					mouseDown = false; //Cooldown not neccessary for android device.
				}
				else{
					mouseDownCoolDown = setTimeout(function(){ mouseDown = false; }, 500);  //When mouse up, wait 0.5 seconds before changing variable. This way user have 0.5 seconds before dictlookup() starts
				}
				
			}
	
		});
		
		if (!isAndroid){
			$(document).on('contextmenu', function() {
				//Postpone lookup words when context menu opened
				clearTimeout(mouseDownCoolDown);
				mouseDown = true;
				setTimeout(function(){ mouseDown = false; }, 2000);
			});
		}


		
		$(document).on("mousemove", function (event) {
			clearTimeout(lookupTimeout);

			const pageX = event.clientX;
			const pageY = event.clientY;
			range = browser.getRange(pageX, pageY);
			if(event.ctrlKey){
				//don't look up word when ctrl Key down(holding)
				return;
			}
			if (mouseDown){
				//don't look up word when mouse down(holding)
				return;
			}
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

		$manualhightlight_left.click(function (event) {
			highlightMatch(-1,true);
		});

		$manualhightlight_right.click(function (event) {
			highlightMatch(1,true);
		});

		$openHighlightedOnNaverLink.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "openHighlightedWord_OnNaver" , data:x });
		});

		$lookupStartsWith.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "lookupRangeSearch" , data:{text:x, method:"a*"} });
		});

		$lookupVerbStartsWith.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "lookupRangeSearch" , data:{text:x, method:"a*da"} });
		});

		$lookupContains.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "lookupRangeSearch" , data:{text:x, method:"*a*"} });
		});

		$lookupVerbContains.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "lookupRangeSearch" , data:{text:x, method:"*a*da"} });
		});

		$openHighlightedOnGoogleTranslateLink.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "openHighlighted_OnGoogleTranslate" , data:x });
		});

		$openHighlightedOnPapagoTranslateLink.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "openHighlighted_OnPapagoTranslate" , data:x });
		});

		$openHighlightedOnLingqLink.click(function (event) {
			let x = getSelectionText();
			browser.sendMessage({ name: "openHighlighted_OnLingq" , data:x });
		});

		isLocked = false;
	}

	function turnOn() {

		console.log("@Content inject.js turnOn(), $notification:", $notification);
		if (!$notification){
			//Bug: $notification = undefined 
			// Happens when open previous firefox session & inject.js initialises faster than background.js 
			// resulting in inject.js sending "injectedLoaded" msg before background.js runs addListener("injectedLoaded", sendScriptData);
			// so now sendScriptData() isn't called, and injectedData msg isn't send to content script. 
			// and so inject.js loadData() isn't called. and finally $notification isn't created and startListeners() isn't running.
			// to fix this, we re-send injectedLoaded msg again (Which background.js missed) to re-kickstart the whole chain processes.
			console.log("$notification is undefined, attempting to send injectedLoaded to background again");
			browser.sendMessage({ name: "injectedLoaded" });
		} 
		else{
			$notification.show();
			setTimeout(function () {
				$notification.hide();
			}, 5000);
			startListeners();
		}
	}

	function stopListeners() {
		$(document).off("mousemove");
		$(document).off("keyup");
		$(document).off("mousedown");
		$(document).off("mouseup");
		$(document).off("contextmenu");
		$lock.off("click");
		$manualhightlight_left.off("click");
		$manualhightlight_right.off("click");
		$openHighlightedOnNaverLink.off("click");
		$lookupStartsWith.off("click");
		$lookupVerbStartsWith.off("click");
		$lookupContains.off("click");
		$lookupVerbContains.off("click");
		$openHighlightedOnGoogleTranslateLink.off("click");
		$openHighlightedOnPapagoTranslateLink.off("click");
		$openHighlightedOnLingqLink.off("click");
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
		isAndroid = data.isAndroid;
		is_debugMode = is_debugMode
		if (data.JUST_UPDATED) {
			showUpdateNotification();
		}

		console.log("@Content inject.js loadData, isOn:" , isOn, "is_debugMode:", is_debugMode , "TSV_OR_AnkiConnect:", TSV_OR_AnkiConnect);
		$dict = $("<div>", { id: 'dict' })
			.addClass("card-panel grey lighten-4")
			.appendTo("body");
		$dictInner = $("<div>", { id: 'dict-inner' }).appendTo($dict);
		$manualhightlight_left = $("<button>", { id: 'toktogi-highlight_left', class: 'toktogi-button' }).text("⇤").appendTo($dict);
		$manualhightlight_right = $("<button>", { id: 'toktogi-highlight_right', class: 'toktogi-button' }).text("⇥").appendTo($dict);
		//$manualrefreshdictentry = $("<button>", { id: 'toktogi-refresh_dict', class: 'toktogi-button' }).text("✔").appendTo($dict);
		$openHighlightedOnNaverLink = $("<button>", { id: 'toktogi-openhightlightedOnNaver',class: 'toktogi-button'}).text("🔎").appendTo($dict);
		$lookupStartsWith = $("<button>", { id: 'toktogi-lookupStartsWith',class: 'toktogi-button'}).text("a*").appendTo($dict);
		$lookupVerbStartsWith = $("<button>", { id: 'toktogi-lookupVerbStartsWith',class: 'toktogi-longbutton'}).text("a*다").appendTo($dict);
		$lookupContains = $("<button>", { id: 'toktogi-lookupContains',class: 'toktogi-midlongbutton'}).text("*a*").appendTo($dict);
		$lookupVerbContains = $("<button>", { id: 'toktogi-lookupVerbContains',class: 'toktogi-longbutton'}).text("*a*다").appendTo($dict);
		$openHighlightedOnGoogleTranslateLink = $("<button>", { id: 'toktogi-openHighlightedOnGoogleTranslateLink',class: 'toktogi-button'}).text("Ⓖ").appendTo($dict);
		$openHighlightedOnPapagoTranslateLink = $("<button>", { id: 'toktogi-openHighlightedOnPapagoTranslateLink',class: 'toktogi-button'}).text("🅿").appendTo($dict);
		$openHighlightedOnLingqLink = $("<button>", { id: 'toktogi-openHighlightedOnLingqLink',class: 'toktogi-button'}).text("🅻").appendTo($dict);
		$lock = $("<img>", { id: 'toktogi-lock', class: 'toktogi-icon' }).appendTo($dict);
		//🕵️
		
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
		is_debugMode = data.is_debugMode;
		console.log("@Content inject.js onlocalStorageChanged, TSV_OR_AnkiConnect:" + TSV_OR_AnkiConnect);
	}

	function readCachedVocabListResult(data) {
		//data got send in { vocablist: Array[0] }
		SAVED_VOCAB_LIST = data.vocablist;
		//console.log("At inject.js, doctitle: " + document.title + " Updated SAVED_VOCAB_LIST from Cached length:", SAVED_VOCAB_LIST.length);
		//showGeneralNotification("VocabList Refreshed");

	}

	function getSelectionText() {
		//
		// More info: from stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
		let text = "";
		if (window.getSelection) {
			text = window.getSelection().toString();
		} else if (document.selection && document.selection.type != "Control") {
			text = document.selection.createRange().text;
		}
		console.log("highlighted text is: " + text);

		return text;
	}

	function openGoogleTranslate() {
		//
		// More info: from stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
		//	https://translate.google.com/?oe=utf-8&client=firefox-b-ab&um=1&ie=UTF-8&hl=en&client=tw-ob#view=home&op=translate&sl=ko&tl=ja&text=%EB%AD%90%ED%95%98%EB%83%90
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
