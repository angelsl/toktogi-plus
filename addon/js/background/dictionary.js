/* Copyright 2015, Brad McDermott, All rights reserved. */
'use strict';

const dictionary = {};

// Hotfix, var not update unless restarted. will do this properly later.

//let improved_ConjugatedWord_Recognition = localStorage.getItem('improved_ConjugatedWord_Recognition') || 'true';
//console.log("at dictionary.js. improved_ConjugatedWord_Recognition is : " + improved_ConjugatedWord_Recognition);
// TODO Make this more efficient, probably redo the whole process
// TODO , assuming  word = str.substring(0, i), if char i jamo = 'n' ending, try removing it, also try adding 'da' after.
dictionary.lookupWords = function(str) {
	const dict = dictionary.dict;

	let entryList = [];
	console.log("@@ dictionary.js. improved_ConjugatedWord_Recognition is : " + improved_ConjugatedWord_Recognition);
	// https://jsfiddle.net/wqLb5zvd/ This will be helpful for improving Conjugated WordRecognition
	for (let i = 1; i < str.length + 1; i++) {
		const word = str.substring(0, i);
		// An array of definitions
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
	return entryList;
}

dictionary.load = async function() {
	dictionary.dict = await util.getDictJson();
}
