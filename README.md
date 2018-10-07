![Toktogi](addon/images/64.png)


[Toktogi](http://www.toktogi.com/) (똑똑이 _clever kid_) is a Korean-English popup dictionary
for Firefox and Chrome written by [Brad McDermott](http://bradmcdermott.com/).

Toktogi+ is a modification of Toktogi 0.6.6 for Firefox. It mainly exists the survive the
sunsetting of legacy addon support planned for Firefox 57, but may get some other small
enhancements as well, depending on my motivation :)

## Installation

I recommend downloading a copy of the repo and installing the addon temporarily with
[this method](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).
You'll have to do this every time you restart Firefox.

Installing unsigned addons permanently requires a special version of Firefox; see
[here](https://wiki.mozilla.org/Addons/Extension_Signing#FAQ) for more.

## Enhancements

- [x] Convert to WebExtension API
- [x] Toolbar button toggles on/off with one click
- [x] Pop-up works for text in `<textarea>`/`<input>`
- [x] **Press 's' to save highlighted vocab + its context sentence into internal vocab list**
- [x] **Press 'x' to export saved vocab list to Tsv (So you can later import them into Anki SRS program)**
- [x] **Use actual sentence token instead of Paragraph when saving to TSV**
- [ ] **Hanja in its own  column when saving to TSV**
- [ ] **Toggle Sanseido-like mode for KR-Eng. Maybe naver Dict. Search the manually highlighted keyword.**
- [ ] **Escape tab character when saving to TSV**
- [ ] **Intergrate real-time import to Anki with Anki Connect**

- [x] **Choose populated Dict entry to save. Currently only able to save the first longest match entry.
      		- [ ] Either save with KeyDown 1,2,3,4. Or add the save icon to populated Dict Box.** 

- [] **Figure out how to share global SAVED_VOCAB_LIST. Currently they all are for each individual Tab**

- [ ] **More Field Option for SAVED_VOCAB_LIST. Full column should be  1.highlighted Hanguel 2.Hanja 3.Def   4. Sentence Token
					5.Index No   6. Source URL  7.Web Page Title  8. User Specified Tag**

- [x] **Add persistent local storage for SAVED_VOCAB_LIST , and perhaps for User-specified SAVED_VOCAB_LIST Field option**
- [ ] Handle frames correctly
- [ ] Grammar?
