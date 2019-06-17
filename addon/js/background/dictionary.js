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

/**
 * Figure out how long it takes for a method to execute.
 * 
 * @param {Function} method to test 
 * @param {number} iterations number of executions.
 * @param {Array} args to pass in. 
 * @param {T} context the context to call the method in.
 * @return {number} the time it took, in milliseconds to execute.
 */

var bench = function (method, iterations, args, context) {

    var time = 0;
    var timer = function (action) {
        var d = Date.now();
        if (time < 1 || action === 'start') {
            time = d;
            return 0;
        } else if (action === 'stop') {
            var t = d - time;
            time = 0;    
            return t;
        } else {
            return d - time;    
        }
    };

    var result = [];
    var i = 0;
    timer('start');
    while (i < iterations) {
        result.push(method.apply(context, args));
        i++;
    }

    var execTime = timer('stop');

    if ( typeof console === "object") {
        console.log("Mean execution time was: ", execTime / iterations, "ms");
        console.log("Sum execution time was: ", execTime, "ms");
        console.log("Result of the method call was:", result[0]);
    }

    return execTime;  
};

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

dictionary.lookupWords = function(str) {
	//let t = timerF('lookupwords');

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

	/*
	let is_first_char_hanguel = isHanguel(str.charAt(0));
	let firstcharbatchim;
	if (is_first_char_hanguel){
		firstcharbatchim = typeof str.charAt(0).normalize('NFD')[2] !== "undefined"? str.charAt(0).normalize('NFD')[2] : false; 
		//Convert "Trailing Hangul Jamo Area" to "Hangul Compatibility" . for dict3
		if (firstcharbatchim == 'ᆫ'){
			firstcharbatchim = 'ㄴ'
		}
		else if (firstcharbatchim == 'ᆯ'){
			firstcharbatchim = 'ㄹ'
		}
		else if (firstcharbatchim == 'ᆷ'){
			firstcharbatchim = 'ㅁ'
		}
		else if (firstcharbatchim == 'ᆸ' // use these for if 'NFD'[2]== 'etc' ){  
			firstcharbatchim = 'ㅂ'
		}
		else{
			firstcharbatchim = false;
		}
	}
	*/
	let totalDictKeyLookupCount = 0;

	/**
	 * Example. If Input str = 먹었
	 * wordList[] will becomes ['먹','먹었','먹어다','먹었다']
	 **/
	let  wordList = [];
	for (let i = 1; i < str.length + 1; i++) {
		const word = str.substring(0, i);
		//TODO: More fine criteria i.e. (str.charAt(i-1) =='을' ||  str.charAt(i-1) == '은') && str.charAt(i-2) exist && str.charAt(i-2) has batchim
		if (['니','며','느','군','라','단','긴','렴','을','은','으','지','는','게','신','시','심','실','네','러','셨','잖','쇼','죠','고','듯','던','더','았','었','셔','기','십','되','면','려','길','냐','왔','습'].includes(str.charAt(i-1)) || ['거나','거든','거라','도록','세요','구나'].includes(str.substring(i-1,i+1)) || (GreedyWordRecognition_Enabled && ['이'].includes(str.charAt(i-1))) ){
			// to handle 	inquisitive present & past formal low '먹니' & '먹었니'
			// 을 to handle st like 먹을게요 or ~(으)ㄹ게 
			// if not already in list, push
			// 신 to handle -신가요
			// quick fix 세요 to 다
			// '지' to handle  다루지 못하는 (다루다)
			// 는 to handle 하는
			// Only if GreedyWordRecognition_Enabled, then change 기 (verb Normalization to noun) to 다 , to deal with 듣기 (to listen)
			// Only if GreedyWordRecognition_Enabled, then deal with -네요 , i.e. 크네요  ,크다 = to be big 
			//  았 to deal with variable conjugation contraction i.e. 바라봤다/  바라보았다 becomes > (바라보다)
			// 이 to deal with 짓다 /짓이나 
			// substring is exclusiveor, var str = 'Mozilla' , str.substring(0, 1) >> "M"
			if (!wordList.includes(str.substring(0, i-1).concat('다')) && str.substring(0, i-1).length != 0){
				//str.substring(0, i-1).length != 0 checks to prevent adding just "다" to entry list
				wordList.push(str.substring(0, i-1).concat('다'));
				//console.log("@ word ending contains '니' || '을'. "+ word+" becomes :" + str.substring(0, i-1).concat('다'));
			}
		}
		
		if (str.charAt(i-1).normalize('NFD')[1]=='ᅧ' && ['ᆻ', 'ᆫ' ,'ᆯ', 'ᆷ','ᆸ',undefined ].includes( str.charAt(i-1).normalize('NFD')[2] )  ){
			let char_with_replaced_vowel_no_batchim = str.charAt(i-1).normalize('NFD')[0].concat('ᅵ').normalize('NFC');
			// Deals with i + eo =ᅧ Contraction.  i.e. 떠올렸 becomes > 떠올리다
			if (!wordList.includes(str.substring(0, i-1).concat(char_with_replaced_vowel_no_batchim).concat('다'))){
				wordList.push(str.substring(0, i-1).concat(char_with_replaced_vowel_no_batchim).concat('다'));
				//console.log("@ word ending contains 'ᆫ' || 'ᆻ' || 'ᆯ' ,  "+ word +" becomes :" + str.substring(0, i-1).concat(char_no_batchim).concat('다'));
			}
		}
		// deals with ᅯ. e.g. 가리워진다, 가리웠다 가리웜 >> 가리우다
		if (str.charAt(i-1).normalize('NFD')[1]=='ᅯ' && ['ᆻ', 'ᆫ' ,'ᆯ', 'ᆷ','ᆸ',undefined ].includes( str.charAt(i-1).normalize('NFD')[2] )  ){
			let char_with_replaced_vowel_no_batchim = str.charAt(i-1).normalize('NFD')[0].concat('ᅮ').normalize('NFC');
			if (!wordList.includes(str.substring(0, i-1).concat(char_with_replaced_vowel_no_batchim).concat('다'))){
				wordList.push(str.substring(0, i-1).concat(char_with_replaced_vowel_no_batchim).concat('다'));
			}
		}
		if (str.charAt(i-1).normalize('NFD')[2] == 'ᆫ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆻ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆯ' || str.charAt(i-1).normalize('NFD')[2] == 'ᆷ'){

			// if final char ends with above batchim 1. Drop batchim & Add 다   AND 2. simply Adds 다  without dropping anything
			// handle things like 가졌 가질 가진
			// 'ᆷ' handle 건방짐>>건방지다. 도도함>>도도하다 , 오만함 >> 오만하다<BR>
			let char_no_batchim = str.charAt(i-1).normalize('NFD')[0].concat(str.charAt(i-1).normalize('NFD')[1]).normalize('NFC');
			if (!wordList.includes(str.substring(0, i-1).concat(char_no_batchim).concat('다'))){
				wordList.push(str.substring(0, i-1).concat(char_no_batchim).concat('다'));
				//console.log("@ word ending contains 'ᆫ' || 'ᆻ' || 'ᆯ' ,  "+ word +" becomes :" + str.substring(0, i-1).concat(char_no_batchim).concat('다'));
			}


			if(str.charAt(i-1).normalize('NFD')[2] == 'ᆯ' && (str.charAt(i)=='까'|| GreedyWordRecognition_Enabled)){
				// if current char has 'ㄹ' batchim, and next char = '까'. then remove ㄹ까.  >> 어째설까 will becomes 어째서
				if (!wordList.includes(str.substring(0, i-1).concat(char_no_batchim))){
					wordList.push(str.substring(0, i-1).concat(char_no_batchim));
				}
			}

			if(str.charAt(i-1).normalize('NFD')[2] == 'ᆫ' && (str.charAt(i)=='데'|| GreedyWordRecognition_Enabled)){
				// if current char has 'ᆫ' batchim, and next char = '데'. then remove ᆫ데.  >> 진짠데 will becomes 진짜
				if (!wordList.includes(str.substring(0, i-1).concat(char_no_batchim))){
					wordList.push(str.substring(0, i-1).concat(char_no_batchim));
				}
			}
			else if (GreedyWordRecognition_Enabled){
				if (!wordList.includes(str.substring(0, i-1).concat(char_no_batchim))){
					wordList.push(str.substring(0, i-1).concat(char_no_batchim));
					// 진짠데 will becomes 진짜
					// str.substring(0, i-1) = 진.   (Current char excluded)
					// char_no_batchim = 짜
				}
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

		if  (  (str.charAt(i-1) =='운' ||(str.charAt(i-1) =='울')||(str.charAt(i-1) =='웠'||(str.charAt(i-1) =='워') ||(str.charAt(i-1) =='움')||(str.charAt(i-1) =='우') ))&& i-2>=0  ){
			// to handle fix 두렵다 future base (두려울)    ㅂ 불규칙 동사 (irregular verb)
			// Will recognise 혐오스러웠,혐오스러워 as 혐오스럽다
			// '우' to handle 날카로우나 >> 날카롭다
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
		if (['드'].includes(str.charAt(i-1))){
			// to handle 시중드는 >> 시중들다
			if (!wordList.includes(str.substring(0, i-1).concat('들다'))){
				wordList.push(str.substring(0, i-1).concat('들다'));
			}
		}
		if (['하여','하였'].includes(str.substring(i-1,i+1))){
			if (!wordList.includes(str.substring(0, i-1).concat('하다'))){
				wordList.push(str.substring(0, i-1).concat('하다'));
			}
		}
		if (['스레'].includes(str.substring(i-1,i+1))){
			if (!wordList.includes(str.substring(0, i-1).concat('스럽다'))){
				wordList.push(str.substring(0, i-1).concat('스럽다'));
			}
		}

		//HANDLES Polite B ᆸ (Not complete, still missing past tense form)
			//나옵니까 >>나오다 
		if (str.charAt(i-1).normalize('NFD')[2]  == 'ᆸ'){
		let next_char_isHanguel = isHanguel(str.charAt(i));
		if (next_char_isHanguel && ['네','니' ,'디' ,'시','죠','지','셨'].includes(str.charAt(i))){
			let current_char_no_batchim = str.charAt(i-1).normalize('NFD')[0].concat(str.charAt(i-1).normalize('NFD')[1]).normalize('NFC');
			if (!wordList.includes(str.substring(0, i-1).concat(current_char_no_batchim+'다'))){
					wordList.push(str.substring(0, i-1).concat(current_char_no_batchim+'다'));
				}
			}
		}
	
		//HANDLES basic 르 irregular verbs. i.e. 짤라 & 타일렀다

		if (str.charAt(i-1).normalize('NFD')[2]  == 'ᆯ'){
			// if '일', (charAt(i-1)) from 타일렀다 contains  'ᆯ'
			//then check if next char is hanguel & not null
			let next_char_isHanguel = isHanguel(str.charAt(i));
			if (next_char_isHanguel){
				// if charAt(i) a.k.a. '렀', a.k.a. next char without batchim is either '러' or '라' then, add
				let next_char_no_batchim = str.charAt(i).normalize('NFD')[0].concat(str.charAt(i).normalize('NFD')[1]).normalize('NFC');
				if (['러','라'].includes(next_char_no_batchim)){
					let current_char_no_batchim = str.charAt(i-1).normalize('NFD')[0].concat(str.charAt(i-1).normalize('NFD')[1]).normalize('NFC');
					if (!wordList.includes(str.substring(0, i-1).concat(current_char_no_batchim+'르다'))){
						// adds 타이르다 ,  current_char_no_batchim == 이
						wordList.push(str.substring(0, i-1).concat(current_char_no_batchim+'르다'));
					}
				}
			}
		}

		if  (  (isHanguel(str.charAt(i-1)))){
			// to handle things like 튕겨	>> 튕기다
			
			/*
			if (is_hanguel && !already_contains_batchim){

				let char_with_batchim_b_added = str.charAt(i-2,0).normalize('NFD')[0].concat(str.charAt(i-2,0).normalize('NFD')[1]).concat('섭'.normalize('NFD')[2]).normalize('NFC');
				//console.log("@ char_with_batchim_r_added :" + char_with_batchim_r_added);
				let Str_with_batchim_b_added = str.substr(0, i-2,0) + char_with_batchim_b_added + '다';
				//console.log("@ after Str_with_batchim_r_added :" + Str_with_batchim_r_added);
				if (!wordList.includes(Str_with_batchim_b_added)){
				
					wordList.push(Str_with_batchim_b_added);
				}

			}
			*/
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
		/*
		if (firstcharbatchim){
			//if first char has batchim ie. str = 난듯하다. then lookup [ㄴ, ㄴ듯, ㄴ듯하, ㄴ듯하다]
			if (!wordList.includes(firstcharbatchim.concat(str.substring(1, i)))){
				console.log(firstcharbatchim.concat(str.substring(1, i)))
				wordList.push(firstcharbatchim.concat(str.substring(1, i)));
			}
		}
		*/
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

	//let sortPriority = str   sort( (a, b) => priority.indexOf(a.id) - priority.indexOf(b.id) )
	//uniq = [...new Set(array)];
	//TODO: maybe do the sorting after got entrylist from dict. Otherwise waste cpu time sorting 10+length strs without hit entries.
	wordList.sort(function(a, b) {
		return a.length - b.length || // sort by length, ASC Order. if equal then  (ASC  -> a.length - b.length) (DESC -> b.length - a.length)
				str.indexOf(a)-str.indexOf(b)|| // If same length, sort by closet to input str. (보니) >>  보니 , 보다 , 보
				a.localeCompare(b);    // Otherwise, sort by dictionary order. No Idea how it accomplishes the task, but I trust Stackoverflow's top voted.
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
						entryList[entryList.length-2].trans = new Array(entryList[entryList.length-2].defsDictType.length - entryList[entryList.length-1].defsDictType.length ).fill("polyfil").concat(entryList[entryList.length-1].trans);
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
						entryList[entryList.length-2].trans = new Array(entryList[entryList.length-2].defsDictType.length - entryList[entryList.length-1].defsDictType.length ).fill("polyfil").concat(entryList[entryList.length-1].trans);
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
					entryList[entryList.length-2].trans = new Array(entryList[entryList.length-2].defsDictType.length - entryList[entryList.length-1].defsDictType.length ).fill("polyfil").concat(entryList[entryList.length-1].trans);
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
					entryList[entryList.length-2].trans = new Array(entryList[entryList.length-2].defsDictType.length - entryList[entryList.length-1].defsDictType.length ).fill("polyfil").concat(entryList[entryList.length-1].trans);
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
				entryList.push({ word: wordList[i], defs: info.displaydef.split("<BR>"), trans: info.displaytran.split("<BR>"), pos:info.pos, hanja:info.hanja, defsDictType: new Array(info.displaydef.split("<BR>").length).fill("offlinedict3") });
				return true;
		}	
		return false;
	}
	
	function isHanguel(c){
		c = c.charCodeAt(0);
		if (c < 0xAC00 || c > 0xD7A3 || Number.isNaN(c)) {
			return false;
		  }
		return true;
	}

}

function isItHanguel(c){
	c = c.charCodeAt(0);
	if (c < 0xAC00 || c > 0xD7A3 || Number.isNaN(c)) {
		return false;
	  }
	return true;
}
function filterRangeSearch(str, method){
	let initial_str = str.length; //for Debug purpose
	// lookupword for up to 15 char. Vocab length shouldn't be longer
	str = str.substring(0,Math.min(str.length, 30));
	// clear all white spaces so that str query like dict["할 거야"] becomes  dict["할거야"] which has dict entry
	str = str.replace(/\s/g, '');

	if (str ==""){
		return [];
	}
	let hanguelentry = isItHanguel(str.charAt(0));
	const dict2keys = dictionary2.keysL;
	const dict2 = dictionary2.dict;
	const dict3keys = dictionary3.keysL;
	const dict3 = dictionary3.dict;


	
	let entryList = [];
	let entryList2 = [];

	if (hanguelentry){
		//First Input Str == Hanguel. 
		if (method == "a*"){
			entryList = dict2keys.filter((entry)=> entry.startsWith(str));
			entryList2 = dict3keys.filter((entry)=> entry.startsWith(str));
		}
		else if (method == "a*da"){
			entryList = dict2keys.filter((entry)=> entry.startsWith(str) && entry.endsWith('다'));
			entryList2 = dict3keys.filter((entry)=> entry.startsWith(str)&& entry.endsWith('다'));
		}
		else if (method == "*a*"){
			entryList = dict2keys.filter((entry)=> entry.includes(str));
			entryList2 = dict3keys.filter((entry)=> entry.includes(str));
		}
		else if (method == "*a*da"){
			entryList = dict2keys.filter((entry)=> entry.includes(str) && entry.endsWith('다'));
			entryList2 = dict3keys.filter((entry)=> entry.includes(str)&& entry.endsWith('다'));
		}
	}
	else{
		//first str not hanguel. Perform range search on definition 
		if (method == "*a*" || method == "a*"){
			//e.g. Search Entry which has def containing "to eat" 
			for(let key in dict2) {
				if (dict2.hasOwnProperty(key)) {
				  if (dict2[key].replace(/\s/g, '').includes(str)){
					entryList.push(key);
				  }
				}
			}
			for(let key in dict3) {
				if (dict3.hasOwnProperty(key)) {
				  if (dict3[key].displaydef.replace(/\s/g, '').includes(str)){
					entryList2.push(key);
					}
					else if (dict3[key].displaytran.replace(/\s/g, '').includes(str)){
						entryList2.push(key);
					}
				}
			}
		}
		
		else if (method == "*a*da" || method == "a*da"){
				//e.g. Search Entry which has def containing "to eat" , and hanguel ends with "다"
				for(let key in dict2) {
					if (dict2.hasOwnProperty(key)) {
						if (key.endsWith('다')){
							if (dict2[key].replace(/\s/g, '').includes(str)){
								entryList.push(key);
							}
						}
					}
				}
				for(let key in dict3) {
					if (dict3.hasOwnProperty(key)) {
						if (key.endsWith('다')){
					 		if (dict3[key].displaydef.replace(/\s/g, '').includes(str)){
								entryList2.push(key);
							 }
							 else if (dict3[key].displaytran.replace(/\s/g, '').includes(str)){
								entryList2.push(key);
							}
					  	}
					}
				}
		}
	}


	for (let k in entryList2){
		if (!entryList.includes(entryList2[k])){
			//combine dict2 dict3
			entryList.push(entryList2[k])
		}
	}

	//entryList = ["장전as","장전zzzxc","weqr"].filter((entry)=> entry.startsWith(str));


	

	entryList.sort(function(a, b) {
	return a.length - b.length || // sort by length, ASC Order. if equal then  (ASC  -> a.length - b.length) (DESC -> b.length - a.length)
			str.indexOf(a)-str.indexOf(b)|| // If same length, sort by closet to input str. (보니) >>  보니 , 보다 , 보
			a.localeCompare(b);    // Otherwise, sort by dictionary order. No Idea how it accomplishes the task, but I trust Stackoverflow's top voted.
	});

	if (is_debugMode){
			
		console.log(entryList.length);
	
		for (let i = 0; i < Math.min(entryList.length,6); i++) {
			console.log(i);
			console.log(i + " " + entryList[i]);
			}
		 }
	
	let resultL = []
	for (let i = 0; i < Math.min(entryList.length,12); i++) {
			let info1 = dict2[entryList[i]];
			let info2 = dict3[entryList[i]];
			if (info1 && info2) {
				let mergeddef = info1.split("<BR>").concat(info2.displaydef.split("<BR>"));
				let defsDictType = new Array(info1.split("<BR>").length).fill("offlinedict2").concat(new Array(info2.displaydef.split("<BR>").length).fill("offlinedict3"));
				let prev_dicttypelen =  info1.split("<BR>").length
				resultL.push({ word: entryList[i], defs: mergeddef  , trans: new Array(prev_dicttypelen).fill("polyfil").concat(info2.displaytran.split("<BR>")) , defsDictType: defsDictType, pos:info2.pos, hanja:info2.hanja });
			}
			else if (info1) {
				resultL.push({ word: entryList[i], defs: info1.split("<BR>"), defsDictType: new Array(info1.split("<BR>").length).fill("offlinedict2") });
			}
			else if (info2) {
				resultL.push({ word: entryList[i], defs: info2.displaydef.split("<BR>"), trans: info2.displaytran.split("<BR>"), pos:info2.pos, hanja:info2.hanja, defsDictType: new Array(info2.displaydef.split("<BR>").length).fill("offlinedict3") });
			}
		}

	return resultL;
}

function getVowel(){
	// example getVowel('쳤')  : ㅕ
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
			//we want no white space. Otherwise dict like this "로스트 제너레이션" will be hard to catch if input without spacing
			currentline[0] = currentline[0].replace(/\s/g, '');
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
				let target_def;
				let target_tran;
				if (DictLanguageMode== "En"){
					target_def = currentline[8];
					target_tran = currentline[9];
				}
				else if (DictLanguageMode== "Jp"){
					target_def = currentline[1];
					target_tran = currentline[4];
				}
				else if (DictLanguageMode== "EnKr"){
					target_def = currentline[8];
					target_tran = currentline[5];
				}
				else if (DictLanguageMode== "JpKr"){
					target_def = currentline[1];
					target_tran = currentline[5];
				}

				/* HANDLES EOMI */	
				if (currentline[0].charAt(0)=='-'){
					// -대요	んですよ。そうですよ  > Becomes 대요	(-대요)んですよ。そうですよ
					target_def = "("+ currentline[0] +")  ".concat(target_def)
					currentline[0] = currentline[0].replace("-", "");
				}

				if (dictionary3.dict[currentline[0]]){
					// if entry already exist, append
					dictionary3.dict[currentline[0]] = { jp_defs:dictionary3.dict[currentline[0]].jp_defs+"\n"+target_def, pos: dictionary3.dict[currentline[0]].pos+"|"+currentline[2], freq: dictionary3.dict[currentline[0]].freq+"|"+currentline[6], hanja: dictionary3.dict[currentline[0]].hanja+"|"+currentline[3],jp_trans:dictionary3.dict[currentline[0]].jp_trans+"\n"+target_tran, displaydef:dictionary3.dict[currentline[0]].displaydef, displaytran:dictionary3.dict[currentline[0]].displaytran }
					let temp =  currentline[6].concat(currentline[2]).concat(currentline[3]).concat(target_def).concat("<BR>");
					dictionary3.dict[currentline[0]].displaydef = dictionary3.dict[currentline[0]].displaydef +"\n" + temp
					dictionary3.dict[currentline[0]].displaytran = dictionary3.dict[currentline[0]].displaytran +"\n" + target_tran.concat("<BR>");
				}
				else{
					dictionary3.dict[currentline[0]] = { jp_defs:target_def, pos: currentline[2], hanja: currentline[3],jp_trans:target_tran,freq:currentline[6]}
					dictionary3.dict[currentline[0]].displaydef = currentline[6].concat(currentline[2]).concat(currentline[3]).concat(target_def).concat("<BR>");	
					dictionary3.dict[currentline[0]].displaytran = target_tran.concat("<BR>");
				}


				/* HANDLES leading batchim */	
				if (['ㄴ','ㄹ','ㅁ','ㅂ'].includes(currentline[0].charAt(0))){
					
					//  ㄴ적이있다	ことがある	 Becomes>  적이있다	(ㄴ적이있다) ことがある
					// target_def = "("+ currentline[0] +")  ".concat(target_def) This line not needed. Done from Handle EOMI part above
					currentline[0] = currentline[0].substring(1); //bypass firstchar
					//TODO: factorise this function
					if (dictionary3.dict[currentline[0]]){
						// if entry already exist, append
						dictionary3.dict[currentline[0]] = { jp_defs:dictionary3.dict[currentline[0]].jp_defs+"\n"+target_def, pos: dictionary3.dict[currentline[0]].pos+"|"+currentline[2], freq: dictionary3.dict[currentline[0]].freq+"|"+currentline[6], hanja: dictionary3.dict[currentline[0]].hanja+"|"+currentline[3],jp_trans:dictionary3.dict[currentline[0]].jp_trans+"\n"+target_tran, displaydef:dictionary3.dict[currentline[0]].displaydef , displaytran:dictionary3.dict[currentline[0]].displaytran}
						let temp =  currentline[6].concat(currentline[2]).concat(currentline[3]).concat(target_def).concat("<BR>");
						dictionary3.dict[currentline[0]].displaydef = dictionary3.dict[currentline[0]].displaydef +"\n" + temp
						dictionary3.dict[currentline[0]].displaytran = dictionary3.dict[currentline[0]].displaytran +"\n" + target_tran.concat("<BR>");
	
					}
					else{
						dictionary3.dict[currentline[0]] = { jp_defs:target_def, pos: currentline[2], hanja: currentline[3],jp_trans:target_tran,freq:currentline[6]}
						dictionary3.dict[currentline[0]].displaydef = currentline[6].concat(currentline[2]).concat(currentline[3]).concat(target_def).concat("<BR>");	
						dictionary3.dict[currentline[0]].displaytran = target_tran.concat("<BR>");
					}
				}

				if (false){
					//todo: nicer jp def formatting
					//   /(\d\..*?[\s$])/  will match [4] for 1.ととのえる【整える】 2.ととのえる【整える】 3.きりまわす【切り回す】 4.ととのえる【整える】。おさえる【抑える】
					
					let jpdefs = splitjp_Def_str_to_list(target_def); // "1.が 2.に" > ['1.が', '2.に']  &&  "がい【街】。がいく【街区" > ["がい【街】。がいく【街区】"]
					let jptrans = splitjp_Trans_str_to_list(target_tran); // ensure line count == splitjpDefStr(), if jp_Def < jp_trans.length, put the rest of jp_trans[] into last jp_def[-1]  
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

		if (dictNo == "dict2"){
			dictionary2.keysL = Object.keys(dictionary2.dict);
		}
		else if (dictNo == "dict3"){
			dictionary3.keysL = Object.keys(dictionary3.dict);
		}

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

	await dictionary.reloadFromGoogleSpreadSheet_TSV();
}

dictionary.reloadFromGoogleSpreadSheet_TSV = async function() {
	
	dictionary2.dictstr2 = await util.getGoogleSpreadSheetTSVDict();
	
	if (dictionary2.dictstr2){
		//only if result not null.
		console.log(dictionary2.dictstr2);
		TsvLineToObjectDict(dictionary2.dictstr2,"dict2");
	}
	else{
		console.log("Could not fetch data from google Spreadsheeet. No internet connection ?");
	}
	
	dictionary2.dictstr2 = null; //don't need dictstr anymore, use dictionary2.dict obj instead. fotmat dictionary2[Str of  'Dictentry'] = Str 'defs'

}