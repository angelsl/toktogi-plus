	// localStorage only store string. JSON.stringify() turns boolean true into 'true' and string "true" into '"true"' , null into 'null'
	// JSON.parse can convert stringified 'null' into null, but fails put in JSON.parse(null)
	// So JSON.parse(localStorage.getItem('hotkey_Enabled')) convert 'true' > boolean true, '"true"' > str "true, but if key hotkey_Enabled doesn't exist will throw error
	// localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage);
	// so we check first if localStorage.getItem() returns null/ doesn't exist. if not null then stringify
	// on a side note, these link are useful for recapping truthy and falsey 
	// https://www.sitepoint.com/javascript-truthy-falsy/
	// https://www.xul.fr/javascript/boolean.php
	// https://javascriptweblog.wordpress.com/2011/02/07/truth-equality-and-javascript/
	/**
	 * The following values are always falsy:

		false   
		0 (zero)   
		'' or "" (empty string) 
		null
    	undefined
    	NaN (e.g. the result of 1/0)

	Everything else is truthy. That includes:

    	'0' (a string containing a single zero)
    	'false' (a string containing the text “false”)
    	[] (an empty array)  BE CAREFUL WITH THIS ONE !! when trying to use if (value) {} , if value is [], then it's true !.
    	{} (an empty object) BE CAREFUL WITH THIS ONE !! 

	 */
	let x = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
	//expected  {depends on if exist already} {true} {true} {false} {true}
	// treat ? as "if true { }", treat : as else{}
	x = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
	console.log ('x :', x);

	let y = localStorage.getItem('asdasdasd') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
	console.log ('y :', y);
	
	localStorage.removeItem('hotkey_Enabled');
	let z = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
	console.log ('z :', z);

	localStorage.setItem('hotkey_Enabled',JSON.stringify(false));
	let a = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
	console.log ('a :', a);

	localStorage.setItem('hotkey_Enabled',JSON.stringify(true));
	let q = localStorage.getItem('hotkey_Enabled') == null?  true :  JSON.parse(localStorage.getItem('hotkey_Enabled'));
	console.log ('q :', q);