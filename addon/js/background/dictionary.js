/* Copyright 2015, Brad McDermott, All rights reserved. */
'use strict';

const dictionary = {};

// Hotfix, var not update unless restarted. will do this properly later.

//let improved_ConjugatedWord_Recognition = localStorage.getItem('improved_ConjugatedWord_Recognition') || 'true';
//console.log("at dictionary.js. improved_ConjugatedWord_Recognition is : " + improved_ConjugatedWord_Recognition);
// TODO Make this more efficient, probably redo the whole process
// TODO , assuming  word = str.substring(0, i), if char i jamo = 'n' ending, try removing it, also try adding 'da' after.

/*
Using the test. Lookupword is currently very inefficient and will search until the end of paragraph. For example , given a paragrapgh:

"대한민국과 조선민주주의인민공화국은 현재 국적법상. 부모양계혈통주의(父母兩系血統主義)에 따라 부모 중 한
 사람만 자국 국적자여도 그 자녀는 국적자가 되며, 귀화 제도를 운영하고 있다. 특히 결혼 이민자나 한국인의 혈통을 가진 외국인에 대해서는 귀화 요건이 완화된다. "

 Even if your mouse point at "대한민국", i.e. the very first index of a paragraph, lookupdict will Search 

@Dict.js Searched Dict with word: 대 &word.len:1  dictionary.js:25:3
@Dict.js Searched Dict with word: 대한 &word.len:2  dictionary.js:25:3
@Dict.js Searched Dict with word: 대한민 &word.len:3  dictionary.js:25:3
@Dict.js Searched Dict with word: 대한민국 &word.len:4  dictionary.js:25:3
....

@Dict.js Searched Dict with word: 대한민국과 조선민주주의인민공화국은 현재 국{omitted}그 자녀는 국적자가 되며,  &word.len:85

Which takes almost 0.1 second for a look up. (average should be 1ms for word look up)

TO fix is to use perhaps stop at . or search for up to str.substring(0, 15);

*/


dictionary.lookupWords = function(str) {

	dictionary.lookupWords_Old(str);
	let t0 = performance.now();
	// lookupword for up to 15 char. Vocab length shouldn't be longer
	str = str.substring(0,Math.max(str.length, 15));
	// clear all white spaces (Except if first char is white space) so that str like '먹을 거야' becomes '먹을거야' which has dict entry
	
	if (str.charAt(0) == ' '){
		// if (first char is white space) is needed if mouse pointed at word where first char is " " e.g.  " 먹다" will match and highlight " 먹" as "먹다"
		str = ' '.concat(str.replace(/\s/g, ''));
	}
	else{
		str = str.replace(/\s/g, '');
	}


	const dict = dictionary.dict;

	let entryList = [];
	//console.log("@@ dictionary.js. improved_ConjugatedWord_Recognition is : " + improved_ConjugatedWord_Recognition);
	// https://jsfiddle.net/4tfgoucx/ This will be helpful for improving Conjugated WordRecognition

	//console.log("@Dict.js  Begins Logging time. Search Dict with str.length:  " +str.length + " Str Value : " + str);


	let totalDictKeyLookupCount = 0;

	let t2 = performance.now();
	let  wordList = [];
	
	for (let i = 1; i < str.length + 1; i++) {
		const word = str.substring(0, i);
		if (str.charAt(i-1) =='니' || str.charAt(i-1) =='을'){
			// to handle 	inquisitive present & past formal low '먹니' & '먹었니'
			// 을 to handle st like 먹을게요 or ~(으)ㄹ게 
			// if not already in list, push
			if (!wordList.includes(str.substring(0, i-1).concat('다'))){
				wordList.push(str.substring(0, i-1).concat('다'));
				console.log("@ word ending contains '니' || '을'. "+ word+" becomes :" + str.substring(0, i-1).concat('다'));
			}
		}
		else if (str.charAt(i-1).normalize('NFD')[2] == 'ᆫ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆻ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆯ' ){
			// if final char ends with above batchim 1. Drop batchim & Add 다   AND 2. simply Adds 다  without dropping anything
			// handle things like 가졌 가질 가진

			let char_no_batchim = str.charAt(i-1).normalize('NFD')[0].concat(str.charAt(i-1).normalize('NFD')[1]).normalize('NFC');
			if (!wordList.includes(str.substring(0, i-1).concat(char_no_batchim).concat('다'))){
				wordList.push(str.substring(0, i-1).concat(char_no_batchim).concat('다'));
				console.log("@ word ending contains 'ᆫ' || 'ᆻ' || 'ᆯ' ,  "+ word +" becomes :" + str.substring(0, i-1).concat(char_no_batchim).concat('다'));
			}
			
			if (!wordList.includes(str.substring(0, i).concat('다'))){
				wordList.push(str.substring(0, i).concat('다'));
				console.log("@ word ending contains 'ᆫ' || 'ᆻ' || 'ᆯ' ,  "+ word +" becomes :" + str.substring(0, i).concat('다'));
			}
		}
		if (!wordList.includes(word)){
			wordList.push(word);
		}


	}
	console.log("Before sort : "+ wordList);

	wordList.sort(function(a, b) {
		return a.length - b.length || // sort by length, ASC Order. if equal then  (ASC  -> a.length - b.length) (DESC -> b.length - a.length)
			   a.localeCompare(b);    // sort by dictionary order  
	  });


	  console.log("After sort : "+ wordList);

	let t3 = performance.now();

	for (let i = 1; i < wordList.length + 1; i++) {
	
		// An array of definitions
		//console.log("@Dict.js Searched Dict with word: " + word + " &word.len:" + word.length);
		const info = dict[wordList[i]];
		totalDictKeyLookupCount = totalDictKeyLookupCount + 1;
		if (info) {
			if (info.defs) {
				entryList.push({ word: wordList[i], defs: info.defs.split("|") });
			}

			// word is a conjugated verb, add root definition
			if(info.roots) {
				const roots = Object.keys(info.roots);

				roots.forEach(function (root) {
					entryList.push({
						word: wordList[i],
						defs: dict[root].defs.split("|"),
						root: root
					});
				});
			}
		}
	}
	let t1 = performance.now();
	console.log("@Dict.js lookupWords_new Finished. Whole Fx() Took :" + (t1-t0) + "ms. Creating wordList[] Took  " +(t3-t2) +  "ms. Lookup dict[wordList[index] : " +totalDictKeyLookupCount + "Times. str.length: "+ str.length + " Str Value : " + str );
	//console.log("lookupWords_new cont. Wordlist[] is :" + wordList);


	return entryList;
}


dictionary.lookupWords_Old = function(str) {

	let t0 = performance.now();
	// lookupword for up to 15 char. Vocab length shouldn't be longer
	//str = str.substring(0,Math.max(str.length, 15));

	const dict = dictionary.dict;

	let entryList = [];
	//console.log("@@ dictionary.js. improved_ConjugatedWord_Recognition is : " + improved_ConjugatedWord_Recognition);
	// https://jsfiddle.net/4tfgoucx/ This will be helpful for improving Conjugated WordRecognition

	//console.log("@Dict.js  Begins Logging time. Search Dict with str.length:  " +str.length + " Str Value : " + str);

	let totalDictKeyLookupCount = 0;
	for (let i = 1; i < str.length + 1; i++) {
		const word = str.substring(0, i);
		// An array of definitions
		//console.log("@Dict.js Searched Dict with word: " + word + " &word.len:" + word.length);
		const info = dict[word];
		totalDictKeyLookupCount = totalDictKeyLookupCount + 1;
		if (info) {
			if (info.defs) {
				entryList.push({ word: word, defs: info.defs.split("|") });
			}

			// word is a conjugated verb, add root definition
			if(info.roots) {
				const roots = Object.keys(info.roots);

				roots.forEach(function (root) {
					entryList.push({
						word: word,
						defs: dict[root].defs.split("|"),
						root: root
					});
				});
			}
		}
	}
	let t1 = performance.now();
	console.log("@Dict.js lookupWords_Old Finished. Took :" + (t1-t0) + "ms "+  " Lookup dict[word] : " +totalDictKeyLookupCount + "Times. str.length: "+ str.length + " Str Value : " + str );
	return entryList;
}

dictionary.load = async function() {
	dictionary.dict = await util.getDictJson();
}
