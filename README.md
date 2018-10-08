![Toktogi](addon/images/64.png)


[Toktogi](http://www.toktogi.com/) (똑똑이 _clever kid_) is a Korean-English popup dictionary
for Firefox and Chrome written by [Brad McDermott](http://bradmcdermott.com/).

Toktogi+ is a modification of Toktogi 0.6.6 for Firefox. It mainly exists the survive the
sunsetting of legacy addon support planned for Firefox 57, but may get some other small
enhancements as well, depending on my motivation :)

## Temporary Installation (Works even newer version of Firefox, but a bit of a hassle)

As this add-on is unsigned, I recommend downloading a copy of the repo and installing the addon temporarily with
[this method](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

**You'll have to do this every time you restart Firefox.**


## Permanent Installation (Not compatible with most newer Firefox )

Installing unsigned addons permanently requires a special version of Firefox; see
[here](https://wiki.mozilla.org/Addons/Extension_Signing#FAQ) for more.

In other word, Firefox ESR version 52.9 or less will work. https://ftp.mozilla.org/pub/firefox/releases/52.9.0esr/win64/en-US/

**You need to disable "xpinstall.signatures.required" in about:config**

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
- [ ] **Hanja in its own  column when saving to TSV**
- [ ] **Better Conjugated Word recognition. To starts with, maybe also try removing 'n' final jamo and adds 다 when querying?**
- [ ] **Toggle Sanseido-like mode for KR-Eng. Maybe naver Dict. Search the manually highlighted keyword.**




- [ ] **Escape tab character when saving to TSV**

- [ ] **More Field Option for SAVED_VOCAB_LIST. Full column should be  1.highlighted Hanguel 2.Hanja 3.Def   4. Sentence Token
					5.Index No   6. Source URL  7.Web Page Title  8. User Specified Tag**

- [x] **Add persistent local storage for SAVED_VOCAB_LIST , and perhaps for User-specified SAVED_VOCAB_LIST Field option**


