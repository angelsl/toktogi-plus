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
//OfflineDict_Mode:"1" ==> Dict1 = default, Dict2 = fallback
//OfflineDict_Mode:"2" ==> Use both Dict1 & Dict2, Merge Entry
//OfflineDict_Mode:"3" ==> Dict2 = default, Dict1 = fallback 


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


	}

	//console.log("@Dict.js lookupWords_new Finished. wordList.length: "+ wordList.length + " Str Value : " + str + "WordList :" + wordList);
	if (KRDICT_Mode_Enabled && KRDICT_API){

		//lookupKRDict(entryList);
	}
	// DummylookupKRDict();  //to play around with it later
	return entryList;

	function lookupDict1(i){
		let info = dict[wordList[i]];
		if (info) {

			if (info.defs) {
				entryList.push({ word: wordList[i], defs: info.defs.split("|"),defsDictType: new Array(info.defs.split("|").length).fill("offlinedict1") });
			}
			// word is a conjugated verb, add root definition
			if(info.roots) {
				let roots = Object.keys(info.roots);

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
		//console.log("atlookupdict2 : ")

		//OfflineDict_Mode:"1" ==> Only check dict2 if dict1 entry not found.
		let info = dict2[wordList[i]];
		if (info) {
				entryList.push({ word: wordList[i], defs: info.split("<BR>"), defsDictType: new Array(info.split("<BR>").length).fill("offlinedict2") });
				// defsDictType: new Array( size of defs array).fill("offlinedict2") . Use in inject.js for populating dictbox entry with different color for offlinedict2
				return true;
		}	
		return false;
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
			
			if (dictionary2.dict[currentline[0]]){
				// if entry already exist, append
				//console.log("dict2 entry already exist: "+ currentline[0]);
				dictionary2.dict[currentline[0]] = dictionary2.dict[currentline[0]] + currentline[1];

			}
			else{
				dictionary2.dict[currentline[0]] = currentline[1];
			}
			
		}
		
		//return dictionary2.dict; //JavaScript object
		console.log("dictionary2.dict[가량없다] : ", dictionary2.dict['가량없다']);
		return JSON.stringify(dictionary2.dict); //JSON
	}



dictionary.load = async function() {
	dictionary.dict = await util.getDictJson();
	//Important! Makesure TSV file does not have carriage return , otherwise the Saving vocab feature will break. Temp fix is to use \r to catch the and replace them in notepad++
	dictionary2.dictstr = await util.getDictSpaceSlashSpaceDelimitedTSV();
	TsvLineToObjectDict(dictionary2.dictstr);
	dictionary2.dictstr = null; //don't need dictstr anymore, use dictionary2.dict obj instead. fotmat dictionary2[Str of  'Dictentry'] = Str 'defs'
}

