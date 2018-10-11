
let isVocabListShowing;
let KeyPressToggleEnabled;
let TSV_OR_AnkiConnect;
let improved_ConjugatedWord_Recognition;
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

    TSV_OR_AnkiConnect = localStorage.getItem('TSV_OR_AnkiConnect') || 'TSV';
    document.getElementById("TSV_OR_AnkiConnect_Lb").innerHTML = TSV_OR_AnkiConnect;

    KeyPressToggleEnabled = localStorage.getItem('KeyPressToggleEnabled');
    console.log('KeyPressToggleEnabled: '+KeyPressToggleEnabled) ;
    if (KeyPressToggleEnabled==null){
        KeyPressToggleEnabled = true;
        localStorage.setItem('KeyPressToggleEnabled',JSON.stringify(true));
 
 
    }
    document.getElementById("KeyPressToggle_Lb").innerHTML = JSON.parse(KeyPressToggleEnabled); 

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

document.getElementById("KeyPressToggle_Btn").addEventListener("click", function(){
    if (document.getElementById("KeyPressToggle_Lb").innerHTML == 'false'){
        document.getElementById("KeyPressToggle_Lb").innerHTML = "true";
        KeyPressToggleEnabled = true;
        localStorage.setItem('KeyPressToggleEnabled',JSON.stringify(true));
        
    }
    else{
        document.getElementById("KeyPressToggle_Lb").innerHTML = 'false';
        KeyPressToggleEnabled = false;
        localStorage.setItem('KeyPressToggleEnabled',JSON.stringify(false));
    }
    
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
