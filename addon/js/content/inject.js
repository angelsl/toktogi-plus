/* Copyright 2015, Brad McDermott, All rights reserved. */
"use strict";
//TODO  Use actual sentence token instead of Paragraph when saving to TSV
//TODO  Hanja in its own  column when saving to TSV
//TODO  Toggle Sanseido-like mode for KR-Eng. Maybe naver Dict. Search the manually highlighted keyword.
//TODO escape tab character when saving to TSV
//TODO Intergrate real-time import to Anki with Anki Connect

//TODO Choose populated Dict entry to save. Currently only able to save the first longest match entry.
//        - Either save with KeyDown 1,2,3,4. Or add the save icon to populated Dict Box. 

//TODO Figure out how to share global SAVED_VOCAB_LIST. Currently they all are for each individual Tab

//TODO More Field Option for SAVED_VOCAB_LIST. Full column should be  1.highlighted Hanguel 2.Hanja 3.Def   4. Sentence Token
//									5.Index No   6. Source URL  7.Web Page Title  8. User Specified Tag

//TODO Add persistent local storage for SAVED_VOCAB_LIST , and perhaps for User-specified SAVED_VOCAB_LIST Field option
if (window.browser == null) {
	window.browser = chrome;
}

;(function () {
	let range;
	let currentNode;
	let currentOffset;
	let isOn;
	let savedX;
	let savedY;
	let highlightedvocabObj = {};
	let highlightedvocabObjMaxLength;
	let highlightedvocabObjFirstIndex;
	let highlightedvocab_CurrentSentence;
	//highlightedvocabObj.word;
	//highlightedvocabObj.root;
	//highlightedvocabObj.defs;
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

	function addPlusToList(event){

			console.log("called (fx) addPlusToList, Vocab Index to save is: "+event.data.dataIndex);

			let i = event.data.dataIndex;
			
	
			console.log("Def found. Saving...\n" +highlightedvocabObj['word'+i] + " | " +highlightedvocabObj['root'+i] + " | " + highlightedvocabObj['defs'+i]+ " | " + highlightedvocab_CurrentSentence );

			// If root word a.k.a Dictionary form exist , save root word instead of hightlighted conjugated word
			if (highlightedvocabObj["root"+i])
			{
				SAVED_VOCAB_LIST.push([highlightedvocabObj['root'+i],highlightedvocabObj['defs'+i],highlightedvocab_CurrentSentence]);
				showSaveVocabSuccessNotification(highlightedvocabObj['root'+i]);
			}
			else
			{
				SAVED_VOCAB_LIST.push([highlightedvocabObj['word'+i],highlightedvocabObj['defs'+i],highlightedvocab_CurrentSentence]);
				showSaveVocabSuccessNotification(highlightedvocabObj['word'+i]);
			}



			

		
	}
	function displayDef (defArray) {
		// Finds longest word in array of results for highlighting
		const longestMatch = defArray[defArray.length - 1].word;

		// TODO make sure the user hasn't moved the mouse since request
		if (currentNode) {


			highlightMatch(longestMatch.length);

			populateDictBox(defArray);

			$dict.css({ top: savedY + 15, left: savedX }).show();

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
			wordRange.setEnd(currentNode, currentOffset + length);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(wordRange);
			//highlightedvocabObj = wordRange
			/*
			// @MY SCRIPT@
			console.log("at highlightMatch. Length:" + length + "   word range:" + wordRange);
			console.log("@highlightMatch Current node content:" + currentNode.data);
			var nodeParagraph = currentNode.data
			var nodeSentence = nodeParagraph.replace(/(((?![.!?]['"]?\s).)*[.!?]['"]?)(\s|$)/g, '$1');
			// console.log("@highlightMatch Current node Sentence:"  + typeof sentence);
			alert(nodeSentence);
			console.log("@highlightMatch Current node Sentence:");
			*/
			highlightedvocab_CurrentSentence = currentNode.data;
		}
	}

	// Clear dict box, fill with results, longest word on top
	function populateDictBox(defArray) {
		//console.log("@populateDictBox:" +defArray);
		$dictInner.empty();

		/*
		highlightedvocabObj.word = defArray[defArray.length - 1].word;
		if (defArray[defArray.length - 1].root) { 
			highlightedvocabObj.root  = defArray[defArray.length - 1].root;
		}
		*/

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

	// Decide whether the mouse has moved far enough away to dimiss
	// the dictionary pop-up.
	function isOutOfBox (x, y) {
		if (browser.getStartNode(range) === currentNode &&
			browser.getOffset(range) !== currentOffset) return true;
		if (
			(x <= boxRight + 5) &&
			(x >= boxLeft - 5) &&
			(y >= boxTop - 40) &&
			(y <= boxBottom + 5)
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


	function startListeners () {
		// @savetofile feature
		$(document).on("keydown", function (event) {

			const ekeyName = event.key;
			var ekeyCode = event.keyCode;

			if (ekeyCode ==83){
				console.log("pressed 's' ");
				// browser.sendMessage({ name: "downloadcsv" });
				
				// Only save when definition found and text highlighted
				if (isShowing & currentNode.nodeType === 3){

					console.log("Def found. Saving...\n" +highlightedvocabObj['word'+highlightedvocabObjFirstIndex] + " | " +highlightedvocabObj['root'+highlightedvocabObjFirstIndex] + " | " + highlightedvocabObj['defs'+highlightedvocabObjFirstIndex]+ " | " + currentNode.data );

					// If root word a.k.a Dictionary form exist , save root word instead of hightlighted conjugated word
					if (highlightedvocabObj["root"+highlightedvocabObjFirstIndex])
					{
						SAVED_VOCAB_LIST.push([highlightedvocabObj['root'+highlightedvocabObjFirstIndex],highlightedvocabObj['defs'+highlightedvocabObjFirstIndex],highlightedvocab_CurrentSentence]);
						showSaveVocabSuccessNotification(highlightedvocabObj['root'+highlightedvocabObjFirstIndex]);
					}
					else
					{
						SAVED_VOCAB_LIST.push([highlightedvocabObj['word'+highlightedvocabObjFirstIndex],highlightedvocabObj['defs'+highlightedvocabObjFirstIndex],highlightedvocab_CurrentSentence]);
						showSaveVocabSuccessNotification(highlightedvocabObj['word'+highlightedvocabObjFirstIndex]);
					}
					
					
				}

			}
			else if (ekeyCode ==88){
				console.log("pressed 'x', saving ");

				browser.downloadTSVFile(SAVED_VOCAB_LIST);
			}
			//alert('keypress event\n\n' + 'key: ' + ekeyName+ '  key code:' +ekeyCode + 'isOn var: '+ isOn) ;

		});

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
		$(document).off("keydown");
		$lock.off("click");
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


	browser.addListener("injectedData", loadData);
	browser.addListener("found", displayDef);
	browser.addListener("startListeners", turnOn);
	browser.addListener("stopListeners", stopListeners);
	browser.initInject();
})();
