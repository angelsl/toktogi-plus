
let isVocabListShowing;
let hotkey_Enabled;
let TSV_OR_AnkiConnect;
let improved_ConjugatedWord_Recognition;
let OfflineDict_Mode;
let KRDICT_API; //Either String with value , or Null, Or Empty String "" if submitted blank Value
//converts List Array to HTML table
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

    improved_ConjugatedWord_Recognition = localStorage.getItem('improved_ConjugatedWord_Recognition') || 'true';

    document.getElementById("improved_ConjugatedWord_Recognition_Lb").innerHTML = improved_ConjugatedWord_Recognition;


    OfflineDict_Mode = localStorage.getItem('OfflineDict_Mode') == null?  3 :  JSON.parse(localStorage.getItem('OfflineDict_Mode'));
    
    if (OfflineDict_Mode ==1){
        document.getElementById("OfflineDict_Mode_type1").checked = true;
    }
    else if (OfflineDict_Mode ==2) {
        document.getElementById("OfflineDict_Mode_type2").checked = true;
    }
    else if (OfflineDict_Mode ==3) {
        document.getElementById("OfflineDict_Mode_type3").checked = true;
    }

    KRDICT_API = localStorage.getItem('KRDICT_API');
    TSV_OR_AnkiConnect = localStorage.getItem('TSV_OR_AnkiConnect') || 'TSV';
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

document.getElementById("Use_improved_Word_Recognition_Btn").addEventListener("click", function(){
    localStorage.setItem('improved_ConjugatedWord_Recognition','true');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
});

document.getElementById("Dont_Use_improved_Word_Recognition_Btn").addEventListener("click", function(){
    localStorage.setItem('improved_ConjugatedWord_Recognition','false');
    restoreOptions();
    browser.extension.getBackgroundPage().broadcastStorageChange();
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
            console.log('@Option.showVocabList_Btn, VList is null, converting VList to empty list ' + VList)
            VList = []
        }
    
        else{
            VList = JSON.parse(VList);
        }

		var tsv = '';
        VList.forEach(function(row) {
                tsv += row.join('\t');
                tsv += "\n";
        });
     
        console.log('tsv:' + tsv);
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
