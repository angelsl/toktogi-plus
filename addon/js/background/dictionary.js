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
	const dict = dictionary.dict;

	let entryList = [];
	console.log("@@ dictionary.js. improved_ConjugatedWord_Recognition is : " + improved_ConjugatedWord_Recognition);
	// https://jsfiddle.net/wqLb5zvd/ This will be helpful for improving Conjugated WordRecognition

	console.log("@Dict.js  Begins Logging time. Search Dict with str.length:  " +str.length + " Str Value : " + str);

	let t0 = performance.now();
	for (let i = 1; i < str.length + 1; i++) {
		const word = str.substring(0, i);
		// An array of definitions
		console.log("@Dict.js Searched Dict with word: " + word + " &word.len:" + word.length);
		const info = dict[word];

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
	console.log("@Dict.js  Finished Logging time. Took :" + (t1-t0) + "ms");
	return entryList;
}

dictionary.load = async function() {
	dictionary.dict = await util.getDictJson();
}
