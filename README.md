![Toktogi](addon/images/64.png)


[Toktogi](http://www.toktogi.com/) (똑똑이 _clever kid_) is a Korean-English popup dictionary
for Firefox and Chrome written by [Brad McDermott](http://bradmcdermott.com/).

Toktogi+ is a modification of Toktogi 0.6.6 for Firefox. It mainly exists the survive the
sunsetting of legacy addon support planned for Firefox 57, but may get some other small
enhancements as well, depending on my motivation :)

## Temporary Installation (Works even on newer version of Firefox, but you'll have to do this every time you restart Firefox)

As this add-on is unsigned, I recommend downloading a copy of the repo and installing the addon temporarily with
[this method](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

**You'll have to do this every time you restart Firefox.**


## Permanent Installation (Not compatible with most newer Firefox )

Installing unsigned addons permanently requires a special version of Firefox; see
[here](https://wiki.mozilla.org/Addons/Extension_Signing#FAQ) for more.

In other word, Firefox ESR version 52.9 or less will work. https://ftp.mozilla.org/pub/firefox/releases/52.9.0esr/win64/en-US/

**You need to disable "xpinstall.signatures.required" in about:config**


## It's installed but the Add-on Doesn't work...?

Try refreshing (F5) The current page & Then Toggle the Toktogi Icon again. You should see the 'Toktogi is on' Popup on the upper right corner if everything's working as intended.

## What About Firefox Android Installation?

As For Firefox Android, 

1. use Firefox Android version 56+ at minimum, 57+ Recommended (Newest version from playstore should work)

2. open Firefox for Android, type about:config in address bar and press enter, find & set xpinstall.signatures.required to false. You should now be able to install unsigned add-on.

3. download & place "Toktogiplus @ example.com.xpi" in root SD Card directory. Open Firefox for Android and browse to file:///mnt/sdcard , then check and install "Toktogiplus @ example.com.xpi"

4. Pray. I haven't spend a lot of time to test whether this works or not, and Firefox for Android doesn't tolerate error very well. Anki-Connect feature won't work for Android.


Android Add-on Install Comprehensive Guide (Source : https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Developing_WebExtensions_for_Firefox_for_Android)


## Enhancements

- [x] Convert to WebExtension API
- [x] Toolbar button toggles on/off with one click
- [x] Pop-up works for text in `<textarea>`/`<input>`
- [x] **Press 's' to save highlighted vocab + its context sentence into internal vocab list**
- [x] **Press 'x' to export saved vocab list to Tsv (So you can later import them into Anki SRS program)**
- [x] **Use actual sentence token instead of Paragraph when saving to TSV**
- [x] **Figure out how to share global SAVED_VOCAB_LIST. Currently they all are for each individual Tab**
- [x] **Choose populated Dict entry to save via mouse clicking plus save Icon.**
- [x] **Choose populated Dict entry to save using KeyDown 1,2,3,4** 
- [x] **Intergrate real-time import to Anki with Anki Connect**
- [x] **Add persistent local storage for SAVED_VOCAB_LIST , and perhaps for User-specified SAVED_VOCAB_LIST Field option**
- [ ] **Replace all localstorage saving api with storage.local which is more suitable for extensions**
- [ ] **Hanja in its own  column when saving to TSV**
- [ ] **Better Conjugated Word recognition. To starts with, maybe also try removing 'n' final jamo and adds 다 when querying?**
- [ ] **Toggle Sanseido-like mode for KR-Eng. Maybe naver Dict. Search the manually highlighted keyword.**
- [ ] **Toggle Sanseido-like mode for KR-JP, and KR-KR. Maybe naver Dict. Search the manually highlighted keyword.**
- [ ] **Add popup menu when clicked the toktogi logo, easy way to check config, Ankiconnect connection, and how many words saved**
- [x] **Handle -며 form i.e. 느끼며   (느끼다)**
- [ ] Handle variable conjugation i.e 이뤄지다/이루어지다    ,  바라봤다/바라보았다 (바라보다)
- [ ] Show dict2/dict3 entry for dict1 conjugated verb entry as well
- [ ] Add [Korean vocab Frequency List](https://github.com/open-korean-text/open-korean-
- [ ] Add [Korean vocab Frequency List](https://github.com/open-korean-text/open-korean-
- [ ] Add [Korean vocab Frequency List](https://github.com/open-korean-text/open-korean-text/tree/master/src/main/resources/org/openkoreantext/processor/util/freq)  to field. Tags 1-5000 as very common , 5001-10000 as common, 10001-20000 as rare, 20001+ as extremely rare



## To do Low Priority Enhancements 

- [ ] There is a bug that cause multiple instances of Toktogi-plus add-on running. Try to fix it.
- [ ] After krdict API is done, store retrieved dict vocab locally as well. Saves time for user, and saved dict could also be used to further make comprehensive offline user dict 

- [ ] Add eomi (語尾) Defition to Default Offline Dict.

- [ ] Add eomi (語尾) Defition to Default Offline Dict.

- [ ] Consider ways to make offline KR-KR Dict , and KR-JP Dict. 


- [ ] Even more comprehensive congujation recognition. Perhaps by using [Open Korean Text Processor](https://github.com/open-korean-text/open-korean-text) on existing Vocab Dictionary >> Finds and Tags all Verb+ Adj >> parse into this [Tool](https://github.com/dbravender/korean_conjugation)  to get all conjugated Verb >> Add back to JSON Dict.

- [ ] If new Verb/Noun not in current offline Dict is detected( Perhaps from krdict API), before adding them into offline user dict, Do >> Parse {{Verb/Noun}} with [Tool](https://github.com/dbravender/korean_conjugation)  to get all conjugated Verb >> Add back to JSON Dict.

- [ ] if Offline User Dict is implemented, add ways to View/Import/Export/Save them.

- [ ] Escape tab character when saving to TSV

- [ ] More Field Option for SAVED_VOCAB_LIST. Full column should be  1.highlighted Hanguel 2.Hanja 3.Def   4. Sentence Token
					5.Index No   6. Source URL  7.Web Page Title  8. User Specified Tag



