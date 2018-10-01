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
**- [x] Press 's' to save highlighted vocab + its context sentence into internal vocab list**
**- [x] Press 'x' to export saved vocab list to Tsv (So you can later import them into Anki SRS program) **
- [ ] Handle frames correctly
- [ ] Grammar?
