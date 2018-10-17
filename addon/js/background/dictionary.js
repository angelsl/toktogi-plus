/* Copyright 2015, Brad McDermott, All rights reserved. */
'use strict';

const dictionary = {};
const dictionary2 = {};
// To Add, Eng version sample API https://krdict.korean.go.kr/api/search?key={API AUTHENICATION KEY}&q=%22%EC%97%84%ED%95%98%EB%8B%A4%22&translated=y&trans_lang=1 
// V2, This one includes Hanja and everything , but word entry must be accurate https://krdict.korean.go.kr/api/view?&key={KEY}&type_search=view&method=WORD_INFO&part=word&q=%ED%91%9C%EC%A0%950&sort=dict&translated=y
// No hanja though, which is a shame  
// Hotfix, var not update unless restarted. will do this properly later.
//let improved_ConjugatedWord_Recognition = localStorage.getItem('improved_ConjugatedWord_Recognition') || 'true';
let KRDICT_API = "omitted";
let KRDICT_Mode_Enabled = true;
let use_dictionary2 = true;

dictionary.lookupWords = function(str) {

	// lookupword for up to 15 char. Vocab length shouldn't be longer
	str = str.substring(0,Math.max(str.length, 15));
	// clear all white spaces (Except if first char is white space) so that str query like dict["할 거야"] becomes  dict["할거야"] which has dict entry
	if (str.charAt(0) == ' '){
		// check & preserve firt char if firt char == white space.  That is, we want " 먹다" to fail dict lookup & "먹다" to pass
		str = ' '.concat(str.replace(/\s/g, ''));
	}
	else{
		str = str.replace(/\s/g, '');
	}

	const dict = dictionary.dict;
	const dict2 = dictionary2.dict;

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
		if (str.charAt(i-1) =='니' || str.charAt(i-1) =='을' ||  str.charAt(i-1) == '은'){
			// to handle 	inquisitive present & past formal low '먹니' & '먹었니'
			// 을 to handle st like 먹을게요 or ~(으)ㄹ게 
			// if not already in list, push
			if (!wordList.includes(str.substring(0, i-1).concat('다'))){
				wordList.push(str.substring(0, i-1).concat('다'));
				//console.log("@ word ending contains '니' || '을'. "+ word+" becomes :" + str.substring(0, i-1).concat('다'));
			}
		}
		else if (str.charAt(i-1).normalize('NFD')[2] == 'ᆫ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆻ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆯ' ){
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
		}
		if (!wordList.includes(word)){
			wordList.push(word);
		}

	}

	wordList.sort(function(a, b) {
		return a.length - b.length || // sort by length, ASC Order. if equal then  (ASC  -> a.length - b.length) (DESC -> b.length - a.length)
			   a.localeCompare(b);    // sort by dictionary order. No Idea how it accomplishes the task, but I trust Stackoverflow's top voted.
	  });


	for (let i = 0; i < wordList.length + 1; i++) {
	
		// An array of definitions
		//console.log("@Dict.js Searched Dict with word: " + word + " &word.len:" + word.length);
		const info = dict[wordList[i]];
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
	if (use_dictionary2 == true){
		for (let i = 0; i < wordList.length + 1; i++) {
	
			// An array of definitions
			//console.log("@Dict.js Searched dict2 with word: " + word + " &word.len:" + word.length);
			const info = dict2[wordList[i]];
			if (info) {
					entryList.push({ word: wordList[i], defs: info.split("<BR>") });

			}
		}
	}
	//console.log("@Dict.js lookupWords_new Finished. wordList.length: "+ wordList.length + " Str Value : " + str + "WordList :" + wordList);
	if (KRDICT_Mode_Enabled && KRDICT_API){

		//lookupKRDict(entryList);
	}
	return entryList;
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
				resolve(xhr.responseText);



			} catch (e) {
				reject(e);
			}
		});

		xhr.open("GET", url+p);
		xhr.send();
	});	



}

//var tsv is the TSV file with headers
function TsvLineToObjectDict(tsv){
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
	
		dictionary2.dict = {};
	
		let headers=lines[0].split("\t");
		
		for(let i=1;i<lines.length;i++){
			let currentline=lines[i].split("\t");
			dictionary2.dict[currentline[0]] = currentline[1];
		}
		
		//return dictionary2.dict; //JavaScript object
		console.log("dictionary2.dict[가량없다] : ", dictionary2.dict['가량없다']);
		return JSON.stringify(dictionary2.dict); //JSON
	}



dictionary.load = async function() {
	dictionary.dict = await util.getDictJson();
	dictionary2.dictstr = await util.getDictSpaceSlashSpaceDelimitedTSV();
	TsvLineToObjectDict(dictionary2.dictstr);
	dictionary2.dictstr = null; //don't need dictstr anymore, use dictionary2.dict obj instead. fotmat dictionary2[Str of  'Dictentry'] = Str 'defs'
}

