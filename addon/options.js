
let isVocabListShowing;
let hotkey_Enabled;
let TSV_OR_AnkiConnect;
let is_debugMode;
let Greedy_word_Recognition;
let OfflineDict_Mode;
let DictLanguageMode;
let KRDICT_API; //Either String with value , or Null, Or Empty String "" if submitted blank Value
//converts List Array to HTML table

//To implement
let onlineDictFeedURL = {DictURLs:[{name:"Public_Dict Feed", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vRx3emMmjh07vucKBs5x_I3uwtF3ldPybucONoNsNk7-_ob5ML2uJNEs28vzv6t-zTMYqJW5ZSgKUjo/pub?gid=0&single=true&output=tsv"}], MnemonicURLs:[{name:"Public_Mnemonic Feed", url:"https://docs.google.com/spreadsheets/d/e/2PACX-1vRx3emMmjh07vucKBs5x_I3uwtF3ldPybucONoNsNk7-_ob5ML2uJNEs28vzv6t-zTMYqJW5ZSgKUjo/pub?gid=1587620401&single=true&output=tsv"}] }

/*Structure
onlineDictFeedURL == Obj  {  DictURLs: [{name, url}, {name, url}] ,MnemonicURLs: [{name, url}, {name, url}] }

alert(onlineDictFeedURL["DictURLs"][0]["name"]);  //Public_Dict Feed
alert(onlineDictFeedURL.DictURLs[0].name);      //Public_Dict Feed
*/

function ulify(mList){
    let mString = "<ul>\n";
    console.log("mString is :" + mString);
    for (i=0; i<=mList.length; i++){
        mString += "<li>" + String(mList[i]) + "</li>\n";
        console.log(mString);
    }

    mString += "</ul>";
    console.log("final mString is :" + mString);
    return mString;
}
//document.querySelector("form").addEventListener("submit", saveOptions);

function restoreOptions() {

    is_debugMode =  localStorage.getItem('is_debugMode') == null?  false :  JSON.parse(localStorage.getItem('is_debugMode'));

    document.getElementById("debugMode_Lb").innerHTML = is_debugMode;
    
    Greedy_word_Recognition = localStorage.getItem('GreedyWordRecognition_Enabled') == null?  false :  JSON.parse(localStorage.getItem('GreedyWordRecognition_Enabled'));

    document.getElementById("Greedy_word_Recognition_Lb").innerHTML = Greedy_word_Recognition;

    OfflineDict_Mode = localStorage.getItem('OfflineDict_Mode') == null?  7 :  JSON.parse(localStorage.getItem('OfflineDict_Mode'));
    DictLanguageMode = localStorage.getItem('DictLanguageMode') == null?  "Jp" :  localStorage.getItem('DictLanguageMode');
    if (OfflineDict_Mode ==1){
        document.getElementById("OfflineDict_Mode_type1").checked = true;
    }
    else if (OfflineDict_Mode ==2) {
        document.getElementById("OfflineDict_Mode_type2").checked = true;
    }
    else if (OfflineDict_Mode ==3) {
        document.getElementById("OfflineDict_Mode_type3").checked = true;
    }
    else if (OfflineDict_Mode ==4) {
        document.getElementById("OfflineDict_Mode_type4").checked = true;
    }
    else if (OfflineDict_Mode ==5) {
        document.getElementById("OfflineDict_Mode_type5").checked = true;
    }
    else if (OfflineDict_Mode ==6) {
        document.getElementById("OfflineDict_Mode_type6").checked = true;
    }
    else if (OfflineDict_Mode ==7) {
        document.getElementById("OfflineDict_Mode_type7").checked = true;
    }
    else if (OfflineDict_Mode ==8) {
        document.getElementById("OfflineDict_Mode_type8").checked = true;
    }

    document.getElementById(DictLanguageMode).checked = true;


    KRDICT_API = localStorage.getItem('KRDICT_API');
    TSV_OR_AnkiConnect = localStorage.getItem('TSV_OR_AnkiConnect') == null? 'TSV' : localStorage.getItem('TSV_OR_AnkiConnect');
    document.getElementById("TSV_OR_AnkiConnect_Lb").innerHTML = TSV_OR_AnkiConnect;
    //if null , then = true, else JSON.parse( <'true'/'false'>) into boolean
    hotkey_Enabled = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));

    document.getElementById("hotkey_Enabled_Lb").innerHTML = hotkey_Enabled? 'Enabled': 'Disabled'; 

    let VList = localStorage.getItem("vocabList");

    if (!VList){
		console.log('@Option.restoreOptions, VList is null, converting VList to empty list ' + VList);
		VList = [];
    }
    else{
        VList = JSON.parse(VList);
    }

 

    document.getElementById("VocabCount_Lb").innerHTML = VList.length;

    
  }

function showVocabList(){
    

        let VList = localStorage.getItem('vocabList');
     
        
        if (!VList){
            console.log('@Option.showVocabList_Btn, VList is null, converting VList to empty list ' + VList);
            VList = [];
        }
        else{
            VList = JSON.parse(VList);
        }
    
        
        console.log('@Option.showVocabList_Btn: retrieved vocabList :');
        document.getElementById("VocabCount_Lb").innerHTML = VList.length;
      
        
    
        document.getElementById("VocabList_Value_p").innerHTML = ulify(VList);
    
    
}

document.addEventListener("DOMContentLoaded", restoreOptions);

document.getElementById("refreshpage").addEventListener("click", function(){
    restoreOptions();
});


document.getElementById("KeyPressToggle_Btn").addEventListener("click", function(){

    browser.extension.getBackgroundPage().toggleHotkey("toggle-hotkey");
    restoreOptions();

    
});

document.getElementById("Use_TSV_Btn").addEventListener("click", function(){
    localStorage.setItem('TSV_OR_AnkiConnect','TSV');
    restoreOptions();

    browser.extension.getBackgroundPage().broadcastStorageChange();

});

document.getElementById("Use_AnkiConnect_Btn").addEventListener("click", function(){
    localStorage.setItem('TSV_OR_AnkiConnect','AnkiConnect');
    restoreOptions();
        // call function from backgroundPage directly
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("Use_debugMode_Btn").addEventListener("click", function(){
    localStorage.setItem('is_debugMode',true);
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("Dont_Use_debugMode_Btn").addEventListener("click", function(){
    localStorage.setItem('is_debugMode',false);
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("Use_Greedy_word_Recognition_Btn").addEventListener("click", function(){
    localStorage.setItem('GreedyWordRecognition_Enabled',true);
    restoreOptions(); 
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("Dont_Use_Greedy_word_Recognition_Btn").addEventListener("click", function(){
    localStorage.setItem('GreedyWordRecognition_Enabled',false);
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("LoadSpreadSheetDict").addEventListener("click", function(){
    restoreOptions();
    browser.extension.getBackgroundPage().reloadGoogleSpreadSheetDict();
    console.log("@Options, Google Speadsheet Dict Re-downloaded !");
    alert("Dict Re-downloaded !");
});
   
document.getElementById("OfflineDict_Mode_type1").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','1');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("OfflineDict_Mode_type2").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','2');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("OfflineDict_Mode_type3").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','3');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("OfflineDict_Mode_type4").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','4');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("OfflineDict_Mode_type5").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','5');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("OfflineDict_Mode_type6").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','6');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("OfflineDict_Mode_type7").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','7');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("OfflineDict_Mode_type8").addEventListener("click", function(){
    localStorage.setItem('OfflineDict_Mode','8');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("En").addEventListener("click", function(){
    localStorage.setItem('DictLanguageMode','En');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("Jp").addEventListener("click", function(){
    localStorage.setItem('DictLanguageMode','Jp');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("EnKr").addEventListener("click", function(){
    localStorage.setItem('DictLanguageMode','EnKr');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});
document.getElementById("JpKr").addEventListener("click", function(){
    localStorage.setItem('DictLanguageMode','JpKr');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("Online_KR_Dict_Form").addEventListener("click", function(){
    //alert(document.getElementById("Online_KR_Dict_API_id").value + typeof document.getElementById("Online_KR_Dict_API_id").value);
    // Either String value or Empty String ""
    localStorage.setItem('KRDICT_API',document.getElementById("Online_KR_Dict_API_id").value);
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});



document.getElementById("showVocabList_Btn").addEventListener("click", showVocabList);

document.getElementById("downloadVocabList_Btn").addEventListener("click", function(){
            //Anki don't have header for tsv. so don't use this. var tsv = 'Name,Title\n';
        console.log('Clicked downloadVocabList_Btn');
        let VList = localStorage.getItem('vocabList');
        if (!VList){
            console.log('@Option.showVocabList_Btn, VList is null, converting VList to empty list ' + VList);
            VList = []
        }
    
        else{
            VList = JSON.parse(VList);
            console.log("Vlist :",VList);
        }
        
		var tsv = '';
        VList.forEach(function(row) {
                //console.log(row.join('\t'));
                let joinedrow = row.join('\t');
                joinedrow = joinedrow.replace(/(\r\n|\n|\r)/gm, ""); //remove any existing new line in dictdef (i.e. used for shoowing def entry with line break when showing dict popups)
                tsv += joinedrow;
                tsv += "\r\n"; //added \r for windows compatability
        });
     
        console.log('tsv: ' , tsv);
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/tsv;charset=utf-8,' + encodeURI(tsv);
        hiddenElement.target = '_blank';
        hiddenElement.download = 'Toktogi_SavedVocabList.tsv';
        document.body.appendChild(hiddenElement);
        hiddenElement.click();
        document.body.removeChild(hiddenElement);
});


document.getElementById("resetVocabList_Btn").addEventListener("click", function(){

    if (confirm("Confirm Reset Vocab List ?")) {

        localStorage.removeItem('vocabList');
        console.log('localStorage.removeItem vocabList: completed');
        showVocabList();
        // call background function to let all content.js get notified of VocabList Changes
        browser.extension.getBackgroundPage().retrieveVocabList();
        alert("Vocab List Reset Complete!");
    
    } else {
        
    }

});
