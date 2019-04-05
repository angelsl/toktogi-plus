/* Copyright 2015, Brad McDermott, All rights reserved. */
'use strict';

const dictionary = {};
const dictionary2 = {};
const dictionary3 = {};
// To Add, Eng version sample API https://krdict.korean.go.kr/api/search?key={API AUTHENICATION KEY}&q=%22%EC%97%84%ED%95%98%EB%8B%A4%22&translated=y&trans_lang=1 
// V2, This one includes Hanja and everything , but word entry must be accurate https://krdict.korean.go.kr/api/view?&key={KEY}&type_search=view&method=WORD_INFO&part=word&q=%ED%91%9C%EC%A0%950&sort=dict&translated=y
// No hanja though, which is a shame  
// Hotfix, var not update unless restarted. will do this properly later.
//let improved_ConjugatedWord_Recognition = localStorage.getItem('improved_ConjugatedWord_Recognition') || 'true';
let KRDICT_API = "omitted";
let KRDICT_Mode_Enabled = true;
//OfflineDict_Mode:"1" ==> Dict1 = default, Dict2 = fallback
//OfflineDict_Mode:"2" ==> Use both Dict1 & Dict2, Merge Entry
//OfflineDict_Mode:"3" ==> Dict2 = default, Dict1 = fallback 
//OfflineDict_Mode:"4" ==> Dict1 = default, Dict2,Dict3 = merged_fallback
//OfflineDict_Mode:"5" ==> Dict2 = default, Dict1,Dict3 = merged_fallback
//OfflineDict_Mode:"6" ==> Dict3 = default, Dict1,Dict2 = merged_fallback 
//OfflineDict_Mode:"7" ==> Merge Dict3 & Dict2 & Dict1 Entry
//OfflineDict_Mode:"8" ==> Dict2 & Dict3 = merged_default, Dict1 = fallback

//TODO: handle -거리다
//TODO: handle -handle words conjugation where optionally 'wa' can becomes 'eo+a' or 'weo' = 'o + eo'

dictionary.lookupWords = function(str) {

	let initial_str = str.length; //for Debug purpose
	// lookupword for up to 15 char. Vocab length shouldn't be longer
	str = str.substring(0,Math.min(str.length, 15));
	// clear all white spaces (Except if first char is white space) so that str query like dict["할 거야"] becomes  dict["할거야"] which has dict entry
	if (str.charAt(0) == ' '){
		// check & preserve firt char if firt char == white space.  That is, we want " 먹다" to fail dict lookup & "먹다" to pass
		str = ' '.concat(str.replace(/\s/g, ''));
	}
	else{
		str = str.replace(/\s/g, '');
	}

	let len_limited_str = str.length; //for Debug purpose
	const dict = dictionary.dict;
	const dict2 = dictionary2.dict;
	const dict3 = dictionary3.dict;

	let entryList = [];
	//console.log("@@ dictionary.js. improved_ConjugatedWord_Recognition is : " + improved_ConjugatedWord_Recognition);
	// https://jsfiddle.net/4tfgoucx/ This will be helpful for improving Conjugated WordRecognition


	let totalDictKeyLookupCount = 0;

	/**
	 * Example. If Input str = 먹었
	 * wordList[] will becomes ['먹','먹었','먹어다','먹었다']
	 */
	let  wordList = [];
	for (let i = 1; i < str.length + 1; i++) {
		const word = str.substring(0, i);
		//TODO: More fine criteria i.e. (str.charAt(i-1) =='을' ||  str.charAt(i-1) == '은') && str.charAt(i-2) exist && str.charAt(i-2) has batchim
		if (['니','며','느','라','을','은','으','지','는','게','네','잖','쇼','죠','고','듯','던','더','았','었','셔'].includes(str.charAt(i-1)) || ['거나','거든','도록'].includes(str.substring(i-1,i+1)) || (GreedyWordRecognition_Enabled && ['기','십','이','되'].includes(str.charAt(i-1))) ){
			// to handle 	inquisitive present & past formal low '먹니' & '먹었니'
			// 을 to handle st like 먹을게요 or ~(으)ㄹ게 
			// if not already in list, push
			// '지' to handle  다루지 못하는 (다루다)
			// 는 to handle 하는
			// Only if GreedyWordRecognition_Enabled, then change 기 (verb Normalization to noun) to 다 , to deal with 듣기 (to listen)
			// Only if GreedyWordRecognition_Enabled, then deal with -네요 , i.e. 크네요  ,크다 = to be big 
			//  았 to deal with variable conjugation contraction i.e. 바라봤다/  바라보았다 becomes > (바라보다)
			// 이 to deal with 짓다 /짓이나 
			if (!wordList.includes(str.substring(0, i-1).concat('다'))){
				wordList.push(str.substring(0, i-1).concat('다'));
				//console.log("@ word ending contains '니' || '을'. "+ word+" becomes :" + str.substring(0, i-1).concat('다'));
			}
		}
		if (str.charAt(i-1).normalize('NFD')[2] == 'ᆫ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆻ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆯ' ){
			// if final char ends with above batchim 1. Drop batchim & Add 다   AND 2. simply Adds 다  without dropping anything
			// handle things like 가졌 가질 가진

			let char_no_batchim = str.charAt(i-1).normalize('NFD')[0].concat(str.charAt(i-1).normalize('NFD')[1]).normalize('NFC');
			if (!wordList.includes(str.substring(0, i-1).concat(char_no_batchim).concat('다'))){
				wordList.push(str.substring(0, i-1).concat(char_no_batchim).concat('다'));
				//console.log("@ word ending contains 'ᆫ' || 'ᆻ' || 'ᆯ' ,  "+ word +" becomes :" + str.substring(0, i-1).concat(char_no_batchim).concat('다'));
			}
			
			if (!wordList.includes(str.substring(0, i).concat('다'))){
				wordList.push(str.substring(0, i).concat('다'));
				//console.log("@ word ending contains 'ᆫ' || 'ᆻ' || 'ᆯ' ,  "+ word +" becomes :" + str.substring(0, i).concat('다'));
			}


			// Deal with ㅎ irregular verbs , 커다란  >> 커다랗다
			let char_with_batchim_h_added = str.charAt(i-1).normalize('NFD')[0].concat(str.charAt(i-1).normalize('NFD')[1]).concat('랗'.normalize('NFD')[2]).normalize('NFC');
			//console.log("i"+i+ " str.substring(0, i-1)" + str.substring(0, i-1)+ " char_with_batchim_h_added "+char_with_batchim_h_added+" str.charAt(i-1)"+ str.charAt(i-1) + "@ word to add" + str.substring(0, i-1).concat(char_with_batchim_h_added+"다"));
			if(!wordList.includes(str.substring(0, i-1).concat(char_with_batchim_h_added+"다"))){
				wordList.push(str.substring(0, i-1).concat(char_with_batchim_h_added+"다"));
			}
		}

		if  (  (str.charAt(i-1) =='운' ||(str.charAt(i-1) =='울'))&& i-2>=0  ){
			// to handle fix 두렵다 future base (두려울)    ㅂ 불규칙 동사 (irregular verb)
			// 매섭다 (매서운). : if (운 ||울) and previous char no batchim > previous char add b, current char add da
			let already_contains_batchim = typeof str.charAt(i-2).normalize('NFD')[2] !== "undefined"?  true : false;
			// is_hanguel check if character has korean vowel entry. Obviously 'zᆸ' , '.' , etc won't have them
			let is_hanguel = isHanguel(str.charAt(i-2));
			
			if (is_hanguel && !already_contains_batchim){

				let char_with_batchim_b_added = str.charAt(i-2,0).normalize('NFD')[0].concat(str.charAt(i-2,0).normalize('NFD')[1]).concat('섭'.normalize('NFD')[2]).normalize('NFC');
				//console.log("@ char_with_batchim_r_added :" + char_with_batchim_r_added);
				let Str_with_batchim_b_added = str.substr(0, i-2,0) + char_with_batchim_b_added + '다';
				//console.log("@ after Str_with_batchim_r_added :" + Str_with_batchim_r_added);
				if (!wordList.includes(Str_with_batchim_b_added)){
				
					wordList.push(Str_with_batchim_b_added);
				}

			}

		}
		if (['해','했'].includes(str.charAt(i-1))){
			// to handle -하다 vocab not in dict 1 (meaning no conjugation table)
			// without this, 치사해요 will fail.

			if (!wordList.includes(str.substring(0, i-1).concat('하다'))){
				wordList.push(str.substring(0, i-1).concat('하다'));
			}
		}

		if (['런'].includes(str.charAt(i-1))){
			// to handle 게걸스런 >> 게걸스럽다
			if (!wordList.includes(str.substring(0, i-1).concat('럽다'))){
				wordList.push(str.substring(0, i-1).concat('럽다'));
			}
		}
		
		if (!wordList.includes(word)){
			wordList.push(word);
		}


	}
	//console.log("@ Check GreedyWordRecognition_Enabled is :" + GreedyWordRecognition_Enabled);
	let inital_wordList_len = wordList.length;
	if (GreedyWordRecognition_Enabled){
		// Deal with 노는지  suffix (irregular "whether form" where 'r' is omitted) → 놀다 (to play) 
		// Greedy Word recognition mode explaination : Handle words like 노는지 ( 놀다 ) by adding batchim to every word (up to the first 6 char)
		// for input word 노는지, the word list would become  [노r는지 , 노는지, 노는지r]
		// on average if wordList.length =  15 before, after 60-150 (avg90, max300)
		//console.log(wordList.length +"@ GreedyWordRecognition_Enabled, wordlist is " + wordList);
		
		for (let i = 0; i < wordList.length; i++) {
				let mStr = wordList[i]
				
				//console.log("@ mStr is " + mStr);
				
				for (let k = 0; k < Math.min(mStr.length, 6); k++) {
					//add 'r' batchim only up to the first 6 char of the word to not make it too crazy
					let already_contains_batchim = typeof mStr.charAt(k).normalize('NFD')[2] !== "undefined"?  true : false;
					// is_hanguel check if character has korean vowel entry. Obviously 'z' , '.' , etc won't have them
					let is_hanguel = isHanguel(mStr.charAt(k));
					
					//console.log(mStr.charAt(k) +  "@ is_hanguel :" + is_hanguel + ", already_contains_batchim :" + already_contains_batchim);
					
					if (is_hanguel && !already_contains_batchim){
						// if char already contain batchim e.g '는' then ignore, no need to replace 'n' with 'r' batchim
						let char_with_batchim_r_added = mStr.charAt(k).normalize('NFD')[0].concat(mStr.charAt(k).normalize('NFD')[1]).concat('을'.normalize('NFD')[2]).normalize('NFC');
						//console.log("@ char_with_batchim_r_added :" + char_with_batchim_r_added);
						let Str_with_batchim_r_added = mStr.substr(0, k) + char_with_batchim_r_added + mStr.substr(k + 1);
						//console.log("@ after Str_with_batchim_r_added :" + Str_with_batchim_r_added);
						if (!wordList.includes(Str_with_batchim_r_added)){
						
							wordList.push(Str_with_batchim_r_added);
						}
					}

					
				}

				
				
	}
	//console.log(wordList.length  + "@ After GreedyWordRecognition_Enabled, wordlist is " + wordList);

	
	}

	if (GreedyWordRecognition_Enabled){
		append_Da_to_List(str,wordList);
	}
	let final_wordList_len = wordList.length; //for Debug purpose
	for (let i = 0; i < wordList.length + 1; i++) {
		detectDictFormOfConjugatedDef(i);
	}

	wordList.sort(function(a, b) {
		return a.length - b.length || // sort by length, ASC Order. if equal then  (ASC  -> a.length - b.length) (DESC -> b.length - a.length)
			   a.localeCompare(b);    // sort by dictionary order. No Idea how it accomplishes the task, but I trust Stackoverflow's top voted.
	  });


	for (let i = 0; i < wordList.length + 1; i++) {
	
		// An array of definitions
		//console.log("@Dict.js Searched Dict with word: " + word + " &word.len:" + word.length);
		//console.log("OfflineDict_Mode: "+OfflineDict_Mode);
		let hasEntry = true;
		if  (OfflineDict_Mode == 1){
			hasEntry = lookupDict1(i);
			if (!hasEntry){
				lookupDict2(i);
			}
		}
		else if (OfflineDict_Mode == 2){
			lookupDict1(i);
			lookupDict2(i);

			if  (entryList.length>=2){
				// if word property from last index match word property from current index then merge entry
				if  (entryList[entryList.length-1].word == entryList[entryList.length-2].word && !entryList[entryList.length-2].root){
					totalDictKeyLookupCount += 1;
					//console.log("word entry found in both dict1 & dict2 !:" + entryList[entryList.length-1].word + " totalDictKeyLookupCount:" + totalDictKeyLookupCount);
					entryList[entryList.length-2].defs = entryList[entryList.length-2].defs.concat(entryList[entryList.length-1].defs);
					entryList[entryList.length-2].defsDictType = entryList[entryList.length-2].defsDictType.concat(entryList[entryList.length-1].defsDictType); 
					entryList.pop();
				}
			}
		}

		else if (OfflineDict_Mode == 3){
			hasEntry = lookupDict2(i);
			if (!hasEntry){
				lookupDict1(i);
			}			
		}
		else if (OfflineDict_Mode == 4){
			//OfflineDict_Mode:"4" ==> Dict1 = default, Dict2,Dict3 = merged_fallback
			hasEntry = lookupDict1(i);
			if (!hasEntry){
				lookupDict2(i);
				lookupDict3(i);
				if  (entryList.length>=2){
					// if word property from last index match word property from current index then merge entry
					if  (entryList[entryList.length-1].word == entryList[entryList.length-2].word && !entryList[entryList.length-2].root){
						totalDictKeyLookupCount += 1;
						//console.log("word entry found in both dict1 & dict2 !:" + entryList[entryList.length-1].word + " totalDictKeyLookupCount:" + totalDictKeyLookupCount);
						entryList[entryList.length-2].defs = entryList[entryList.length-2].defs.concat(entryList[entryList.length-1].defs);
						entryList[entryList.length-2].defsDictType = entryList[entryList.length-2].defsDictType.concat(entryList[entryList.length-1].defsDictType); 
						entryList.pop();
					}
				}
			}		
		}

		else if (OfflineDict_Mode == 5){
			//OfflineDict_Mode:"5" ==> Dict2 = default, Dict1,Dict3 = merged_fallback
			hasEntry = lookupDict2(i);
			if (!hasEntry){
				lookupDict1(i);
				lookupDict3(i);
				if  (entryList.length>=2){
					// if word property from last index match word property from current index then merge entry
					if  (entryList[entryList.length-1].word == entryList[entryList.length-2].word && !entryList[entryList.length-2].root){
						totalDictKeyLookupCount += 1;
						//console.log("word entry found in both dict1 & dict2 !:" + entryList[entryList.length-1].word + " totalDictKeyLookupCount:" + totalDictKeyLookupCount);
						entryList[entryList.length-2].defs = entryList[entryList.length-2].defs.concat(entryList[entryList.length-1].defs);
						entryList[entryList.length-2].defsDictType = entryList[entryList.length-2].defsDictType.concat(entryList[entryList.length-1].defsDictType); 
						entryList.pop();
					}
				}
			}		
		}
		//OfflineDict_Mode:"6" ==> Dict3 = default, Dict1,Dict2 = merged_fallback 
		else if (OfflineDict_Mode == 6){
			
			hasEntry = lookupDict3(i);
			if (!hasEntry){
				lookupDict1(i);
				lookupDict2(i);
	
				if  (entryList.length>=2){
					// if word property from last index match word property from current index then merge entry
					if  (entryList[entryList.length-1].word == entryList[entryList.length-2].word && !entryList[entryList.length-2].root){
						totalDictKeyLookupCount += 1;
						//console.log("word entry found in both dict1 & dict2 !:" + entryList[entryList.length-1].word + " totalDictKeyLookupCount:" + totalDictKeyLookupCount);
						entryList[entryList.length-2].defs = entryList[entryList.length-2].defs.concat(entryList[entryList.length-1].defs);
						entryList[entryList.length-2].defsDictType = entryList[entryList.length-2].defsDictType.concat(entryList[entryList.length-1].defsDictType); 
						entryList.pop();
					}
				}
			}			
		}
		//OfflineDict_Mode:"7" ==> Merge Dict3 & Dict2 & Dict1 Entry
		else if (OfflineDict_Mode == 7){
			lookupDict1(i);
			lookupDict2(i);
			if  (entryList.length>=2){
				// if word property from last index match word property from current index then merge entry
				if  (entryList[entryList.length-1].word == entryList[entryList.length-2].word && !entryList[entryList.length-2].root){
					totalDictKeyLookupCount += 1;
					//console.log("word entry found in both dict1 & dict2 !:" + entryList[entryList.length-1].word + " totalDictKeyLookupCount:" + totalDictKeyLookupCount);
					entryList[entryList.length-2].defs = entryList[entryList.length-2].defs.concat(entryList[entryList.length-1].defs);
					entryList[entryList.length-2].defsDictType = entryList[entryList.length-2].defsDictType.concat(entryList[entryList.length-1].defsDictType); 
					entryList.pop();
				}
			}
			lookupDict3(i);	
			if  (entryList.length>=2){
				// if word property from last index match word property from current index then merge entry
				if  (entryList[entryList.length-1].word == entryList[entryList.length-2].word && !entryList[entryList.length-2].root){
					totalDictKeyLookupCount += 1;
					//console.log("word entry found in both dict1 & dict2 !:" + entryList[entryList.length-1].word + " totalDictKeyLookupCount:" + totalDictKeyLookupCount);
					entryList[entryList.length-2].defs = entryList[entryList.length-2].defs.concat(entryList[entryList.length-1].defs);
					entryList[entryList.length-2].defsDictType = entryList[entryList.length-2].defsDictType.concat(entryList[entryList.length-1].defsDictType); 
					entryList.pop();
				}
			}	
		}

		//OfflineDict_Mode:"8" ==> Dict2 & Dict3 = merged_default, Dict1 = fallback
		else if (OfflineDict_Mode == 8){
			hasEntry = lookupDict2(i);
			let hasEntry2 = lookupDict3(i);
			if  (entryList.length>=2){
				// if word property from last index match word property from current index then merge entry
				if  (entryList[entryList.length-1].word == entryList[entryList.length-2].word && !entryList[entryList.length-2].root){
					totalDictKeyLookupCount += 1;
					//console.log("word entry found in both dict1 & dict2 !:" + entryList[entryList.length-1].word + " totalDictKeyLookupCount:" + totalDictKeyLookupCount);
					entryList[entryList.length-2].defs = entryList[entryList.length-2].defs.concat(entryList[entryList.length-1].defs);
					entryList[entryList.length-2].defsDictType = entryList[entryList.length-2].defsDictType.concat(entryList[entryList.length-1].defsDictType); 
					entryList.pop();
				}
			}

			if ((hasEntry && hasEntry2) == false){
				lookupDict1(i);
			}	
		}


	}

	//console.log("@Dict.js lookupWords_new Finished. wordList.length: "+ wordList.length + " Str Value : " + str + "WordList :" + wordList);
	if (KRDICT_Mode_Enabled && KRDICT_API){

		//lookupKRDict(entryList);
	}
	// DummylookupKRDict();  //to play around with it later
	//console.log("initial_str: "+ initial_str+", len_limited_str: "+len_limited_str + ", totalDictKeyLookupCount"+totalDictKeyLookupCount + ", inital_wordList_len: "+ inital_wordList_len + ", final_wordList_len: "+ final_wordList_len);
	return entryList;

	function detectDictFormOfConjugatedDef(i){
		// Dict1 includes conjugated form of verbs in DB, i.e. It recognise 끄덕인다 as having the rootword/dictionaryform => 끄덕이다
		// So we'll use that information to  help  dict2/dict3 recognise 끄덕인다 as => 끄덕이다 as well
		let info = dict[wordList[i]];
		if (info) {
			// word is a conjugated verb, add root definition
			if(info.roots) {
				let roots = Object.keys(info.roots);
				// Example info.roots[object Object],  roots  => [선택하다]
				// info.roots => [object Object], roots   => [서다,설다]
				roots.forEach(function (root) {
					if (!wordList.includes(root)){
						wordList.push(root);
					};
				});
			}
		}
	}

	function lookupDict1(i){
		let info = dict[wordList[i]];
		if (info) {

			if (info.defs) {
				entryList.push({ word: wordList[i], defs: info.defs.split("|"),defsDictType: new Array(info.defs.split("|").length).fill("offlinedict1") });
			}
			// word is a conjugated verb, add root definition
			if(info.roots) {
				let roots = Object.keys(info.roots);
				// Example info.roots[object Object],  roots  => [선택하다]
				// info.roots => [object Object], roots   => [서다,설다]
				roots.forEach(function (root) {
					entryList.push({
						word: wordList[i],
						defs: dict[root].defs.split("|"),
						root: root,
						defsDictType: new Array(dict[root].defs.split("|").length).fill("offlinedict1")
						}
					);
				});
			}
			return true;
		}
		return false;
	}
	
	function lookupDict2(i){
		//OfflineDict_Mode:"1" ==> Only check dict2 if dict1 entry not found.
		let info = dict2[wordList[i]];
		if (info) {
				entryList.push({ word: wordList[i], defs: info.split("<BR>"), defsDictType: new Array(info.split("<BR>").length).fill("offlinedict2") });
				// defsDictType: new Array( size of defs array).fill("offlinedict2") . Use in inject.js for populating dictbox entry with different color for offlinedict2
				return true;
		}	
		return false;
	}

	function lookupDict3(i){
		let info = dict3[wordList[i]];

		if (info) {
				entryList.push({ word: wordList[i], defs: info.displaydef.split("<BR>"), pos:info.pos, hanja:info.hanja, defsDictType: new Array(info.displaydef.split("<BR>").length).fill("offlinedict3") });
				return true;
		}	
		return false;
	}
	
	function isHanguel(c){
		c = c.charCodeAt(0);
		if (c < 0xAC00 || c > 0xD7A3) {
			return false;
		  }
		return true;
	}

}



function append_Da_to_List(input_str, wordList){
	// example: Input = "복세편살" , processed_wordlist_output  = ['복세편다','복세다','복다']
	// useful for dealing with  verb stem + unknown eomi
	let mstr = input_str;
	for (let i = 1; i < mstr.length ; i++) {
		if (!wordList.includes(mstr.substring(0,mstr.length-i).concat('다'))){
			wordList.push(mstr.substring(0,mstr.length-i).concat('다'));
		}
	}
}

function lookupKRDict(entryList){
	let KRDict_entryList = [];

	if (entryList == []){
		return KRDict_entryList;
	}


	let url = "https://krdict.korean.go.kr/api/search?key="+KRDICT_API+"&type_search=search&method=WORD_INFO&translated=y&sort=dict&q=";
	let p = "신실한";
	// let p = entryList[0].word;

	console.log("url+p is ", url+p);


	
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.addEventListener('error', () => reject('failed to query KRDict'));
		xhr.addEventListener('load', () => {
			try {

				console.log("XMLHttpRequest to KRDict response: ", xhr.response);
				console.log("XMLHttpRequest to KRDict text: ", xhr.responseText);
				console.log("XMLHttpRequest to KRDict responseXML: ", xhr.responseXML);

				var txt = "";
				path = "/bookstore/book/price[text()]";
				if (xml.evaluate) {
					var nodes = xml.evaluate(path, xml, null, XPathResult.ANY_TYPE, null);
					var result = nodes.iterateNext();
					while (result) {
						txt += result.childNodes[0].nodeValue + "<br>";
						result = nodes.iterateNext();
					} 
				// Code For Internet Explorer
				} 
				document.getElementById("demo").innerHTML = txt;


				resolve(xhr.responseText);



			} catch (e) {
				reject(e);
			}
		});

		xhr.open("GET", url+p);
		xhr.send();
	});	



}


function DummylookupKRDict(){
	let KRDict_entryList = [];
	let sampleEntryObj ={ target_code:"target_code", word: "", sup_no:"sup_no",pos:"pos", defs :{sense_order:"1",KrDef:"",JPDef:"",JPWord:""}};

	let transPath = "/channel/item/word_info/sense_info/translation";


	let url = "https://krdict.korean.go.kr/api/search?key="+KRDICT_API+"&type_search=search&method=WORD_INFO&translated=y&sort=dict&q=";
	let p = "신실한";
	// let p = entryList[0].word;

	console.log("url+p is ", url+p);


	
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.addEventListener('error', () => reject('failed to query KRDict'));
		xhr.addEventListener('load', () => {
			try {

				//console.log("XMLHttpRequest to KRDict response: ", xhr.response);
				//console.log("XMLHttpRequest to KRDict text: ", xhr.responseText);
				console.log("XMLHttpRequest to KRDict responseXML: "+ xhr.responseXML);
				let xml = xhr.responseXML;
				let itemList = [];

				let item, y, itemlen; 
				let itemObj = {};
				let itemsLength = xml.getElementsByTagName("item").length;
				let sen_El;
				let sen_List = [];
				
				for (let i = 0;i<itemsLength;i++){
					//loops through all items element
					item = xml.getElementsByTagName("item")[i];
					itemlen = item.childNodes.length;
					y = item.firstChild;
					itemObj = {};
					let sentence_index = 0;
					for (let j = 0; j < itemlen; j++) {
						// loops through all item childNotes element i.e. <target_code>, <word>, <pos>,etc
						
						if (y.nodeType == 1) {
							if (y.childNodes.length==1){
								itemObj[y.nodeName] = y.firstChild.nodeValue;
							}
							else if (y.nodeName =='sense'){
								sentence_index++;
								sen_El = y.childNodes
								for (let k = 0; k < sen_El.length; k++) {
									if (sen_El[k].nodeType==1){
										//console.log(sen_El[k].nodeName);
										if (sen_El[k].childNodes.length==1 && sen_El[k].nodeName == "definition"){
											itemObj["Kr"+sen_El[k].nodeName.concat(sentence_index)] =sen_El[k].firstChild.nodeValue;
										}
										else if (sen_El[k].childNodes.length==1 && sen_El[k].nodeName == "sense_order"){
											itemObj["Kr"+sen_El[k].nodeName.concat(sentence_index)] =sen_El[k].firstChild.nodeValue;
										}
										
										else if (sen_El[k].nodeName =='translation'){
											let translation_el = sen_El[k].childNodes;
											let trans_lang;
											for (let z = 0; z < translation_el.length; z++) {
												if (translation_el[z].nodeType==1){
													if (translation_el[z].nodeName =="trans_lang"){
														trans_lang = translation_el[z].firstChild.nodeValue;
													}
													else if (translation_el[z].nodeName =="trans_dfn"){
														itemObj[trans_lang+translation_el[z].nodeName.concat(sentence_index)] =translation_el[z].firstChild.nodeValue;
													}
													else if (translation_el[z].nodeName =="trans_word"){
														if (translation_el[z].firstChild !=null){
															itemObj[trans_lang+translation_el[z].nodeName.concat(sentence_index)] =translation_el[z].firstChild.nodeValue;
														}
														else{
															itemObj[trans_lang+translation_el[z].nodeName.concat(sentence_index)] =null;
														}
													}
												}
											}

										}
										
										
									}
									
								}
							
							}

							
							
						}
						y = y.nextSibling;
					}
					itemList.push(itemObj);
				}

			
				//console.log( txt);
				console.log( itemObj);
				console.log( itemList);
				//console.log( "xml result: " +itemList);

				
				resolve(xhr.responseText);



			} catch (e) {
				reject(e);
			}
		});

		xhr.open("GET", "demoKRDictResult_multi_language.xml");
		xhr.send();
	});	



}

//var tsv is the TSV file with headers
function TsvLineToObjectDict(tsv,dictNo){
	/* Given multi-line strings like 
	"가등기 / [假登記] provisional registration<BR>
	가뜩 / full; on top of everything else<BR>" 
	" 
	use " / " as delimiter and convert to object with ['가등기'] & ['가뜩'] as key	*/

	// console.log(typeof dictionary2.dict); //String
	//console.log(dictionary2.dict.length);
	// console.log(dictionary2.dict.substring(0,100));
	//let  numberOfLineBreaks = (dictionary2.dict.match(/\n/g)||[]).length; //63435
	//let arrayOfLines = dictionary2.dict.match(/[^\r\n]+/g);  //63435
	// console.log(numberOfLineBreaks, arrayOfLines.length); //63435, 63435
	/*
	var keys = Object.keys(dictionary.dict);
	console.log('Dict keys total = ' + keys.length + "key[0] key[1] : " + keys[0] + "  |  " +  keys[1]);
	let maxkeyvaluelength = 0;

	for (let i = 0;i<keys.length;i++){
		maxkeyvaluelength = Math.max(maxkeyvaluelength,keys[i].length);
		if (keys[i].length >12){
			console.log(keys[i]);
		}
	}

	console.log('Dict max key length is :' + maxkeyvaluelength);
	*/
	//let arrayOfLines = dictionary2.dict.match(/[^\r\n]+/g);  
	//let options={"separator" : " / "};
		
	
		let lines=tsv.split("\n");

		let headers=lines[0].split("\t");
		
		for(let i=1;i<lines.length;i++){
			let currentline=lines[i].split("\t");
			if (dictNo == "dict2"){

				if (dictionary2.dict[currentline[0]]) {
					// if entry already exist, append
					dictionary2.dict[currentline[0]] = dictionary2.dict[currentline[0]] + currentline[1];
				}
				else {
					dictionary2.dict[currentline[0]] = currentline[1];	
				}
			}
			else if (dictNo == "dict3"){

				/* HANDLES EOMI */	
				if (currentline[0].charAt(0)=='-'){
					// -대요	んですよ。そうですよ  > Becomes 대요	(-대요)んですよ。そうですよ
					currentline[1] = "("+ currentline[0] +")  ".concat(currentline[1])
					currentline[0] = currentline[0].replace("-", "");
				}

				if (dictionary3.dict[currentline[0]]){
					// if entry already exist, append
					dictionary3.dict[currentline[0]] = { jp_defs:dictionary3.dict[currentline[0]].jp_defs+"\n"+currentline[1], pos: dictionary3.dict[currentline[0]].pos+"|"+currentline[2], hanja: dictionary3.dict[currentline[0]].hanja+"|"+currentline[3],jp_trans:dictionary3.dict[currentline[0]].jp_trans+"\n"+currentline[4], displaydef:dictionary3.dict[currentline[0]].displaydef }
					let temp =  currentline[2].concat(currentline[3]).concat(currentline[1]).concat(currentline[4]).concat("<BR>");
					dictionary3.dict[currentline[0]].displaydef = dictionary3.dict[currentline[0]].displaydef +"\n" + temp
					

				}
				else{
					dictionary3.dict[currentline[0]] = { jp_defs:currentline[1], pos: currentline[2], hanja: currentline[3],jp_trans:currentline[4]}
					dictionary3.dict[currentline[0]].displaydef = currentline[2].concat(currentline[3]).concat(currentline[1]).concat(currentline[4]).concat("<BR>");	
				}

				if (false){
					//todo: nicer jp def formatting
					//   /(\d\..*?[\s$])/  will match [4] for 1.ととのえる【整える】 2.ととのえる【整える】 3.きりまわす【切り回す】 4.ととのえる【整える】。おさえる【抑える】
					
					let jpdefs = splitjp_Def_str_to_list(currentline[1]); // "1.が 2.に" > ['1.が', '2.に']  &&  "がい【街】。がいく【街区" > ["がい【街】。がいく【街区】"]
					let jptrans = splitjp_Trans_str_to_list(currentline[4]); // ensure line count == splitjpDefStr(), if jp_Def < jp_trans.length, put the rest of jp_trans[] into last jp_def[-1]  
					// Also, for jp_Trans, regex match "。", unless it's  "。また、"  
					let kptrans = splitkp_Trans_str_to_list(currentline[5]); // same as above, but regex match ".", unless it's  ". 또는"  
					split_en_Def_str_to_list(); //low priority
					split_en_Trans_str_to_list(); //low priority
					ensure_def_andTrans_SameLength();
					generate_table();
				}
				
			}
		}
		
		//return dictionary2.dict; //JavaScript object
		if (dictNo == "dict2"){
			console.log("dictionary2.dict[가량없다] : ", dictionary2.dict['가량없다']);
		}
		/*
		if (dictNo == "dict3"){
			console.log("dictionary3.dict['가구'] : ", dictionary3.dict['가구']);
		}*/
		return JSON.stringify(dictionary2.dict); //JSON

		function splitjp_Def_str_to_list(jpdef){
			//str "1.が 2.に" => ['1.が', '2.に']  &&  "がい【街】。がいく【街区" => ["がい【街】。がいく【街区】"]
			let l = jpdef.match(/(\d\..*?\s|\d\..*?$)/gm); //[number]+[dot]+[.*?]+[ ] OR [number]+[dot]+[.*?]+[End of line]
			if (!l){ // if null
				l = []
				l.push(jpdef);
			}
			return l
		}
		function splitjp_Trans_str_to_list(jptrans){
			//str jptrans "糸車で糸をつむぐとき。また、その金軸。 細くて長く。 かぞえる単位。" => ["糸車で糸をつむぐとき。また、その金軸。", "細くて長く。", "かぞえる単位。" ]
			let l = jptrans.match(/(.*?。また.*?。|.*?。)/gm); //[.*?] + ['。', but not '。また']  
			if (!l){
				l = []
				l.push(jptrans);
			}
			return l
		}
		function splitkp_Trans_str_to_list(kptrans){
			//str jpdef "물레. 또는 그 꼬챙. 가늘고. 세는 단위.";
			let l = kptrans.match(/(.*?\.\s또는.*?\.|.*?\.)/gm); //split by '.' but ignore '. 또는'
			if (!l){
				// if null
				l = []
				l.push(kptrans);
			}
			return l
		}

		function ensure_def_andTrans_SameLength(){
			
		}
		function generate_table(){

		}
	}



dictionary.load = async function() {
	
	dictionary.dict = await util.getDictJson();
	//Important! Makesure TSV file does not have carriage return , otherwise the Saving vocab feature will break. Temp fix is to use \r to catch the and replace them in notepad++
	dictionary2.dict = {};
	dictionary2.dictstr = await util.getDictSpaceSlashSpaceDelimitedTSV();
	TsvLineToObjectDict(dictionary2.dictstr,"dict2");
	dictionary2.dictstr = null; //don't need dictstr anymore, use dictionary2.dict obj instead. fotmat dictionary2[Str of  'Dictentry'] = Str 'defs'
	//Now for the third dict...
	dictionary3.dict = {};
	dictionary3.dictstr = await util.getKRJP_DictSpaceSlashSpaceDelimitedTSV();
	TsvLineToObjectDict(dictionary3.dictstr,"dict3");
	dictionary3.dictstr = null; //don't need dictstr anymore, use dictionary2.dict obj instead. fotmat dictionary2[Str of  'Dictentry'] = Str 'defs'
}

dictionary.reloadFromGoogleSpreadSheet_TSV = async function() {
	
	dictionary2.dictstr2 = await util.getGoogleSpreadSheetTSVDict();
	TsvLineToObjectDict(dictionary2.dictstr2,"dict2");
	dictionary2.dictstr2 = null; //don't need dictstr anymore, use dictionary2.dict obj instead. fotmat dictionary2[Str of  'Dictentry'] = Str 'defs'

}