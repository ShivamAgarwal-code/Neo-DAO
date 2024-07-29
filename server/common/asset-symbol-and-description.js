// This file contains the code for the object that holds an asset-symbol/description pair.

const {v4: uuidV4} = require('uuid');
const common_routines = require('../common/common-routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

/**
 * This object aggregates an asset symbol and its description.
 *
 * @constructor
 */
function AssetSymbolAndToken() {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {String} - The asset symbol. */
	this.name = '';
	
	/** @property {String} - The asset description. */
	this.description = '';
	
	/**
	 * Validates the contents of this object.  If valid, it
	 * 	simply returns.  If not, it throws an error.
	 */
	this.validate = function() {
		let methodName = self.constructor.name + '::' + `validate`;
		let errPrefix = '(' + methodName + ') ';
		
		if (misc_shared_lib.isEmptySafeString(self.name))
			throw new Error(errPrefix + `The "name" field is empty.`);
		if (misc_shared_lib.isEmptySafeString(self.description))
			throw new Error(errPrefix + `The "description" field is empty.`);
	}
}

/**
 * This function parses a string containing an asset symbol and its
 * 	description into an AssetSymbolAndToken object.  The fields are
 * 	both expected to be enclosed in double quotes.
 * 	(e.g. - "DOGE"  "Dogecoin")
 *
 * @param {String} str - The raw string to parse.
 *
 * @return {AssetSymbolAndToken} - Returns an AssetSymbolAndToken
 * 	object.
 * 	
 * @constructor
 */
AssetSymbolAndToken.Parse = function(str) {
	let errPrefix = `(AssetSymbolAndToken.Parse) `;
	
	if (misc_shared_lib.isEmptySafeString(str))
		throw new Error(errPrefix + `The str parameter is empty.`);
	
	// Build a new AssetSymbolAndToken object.
	let newObj = new AssetSymbolAndToken();
	
	// Iterate the string.
	let bInsideQuotes = false;
	let fieldNdx = 0;
	
	for (let i = 0; i < str.length; i++) {
		let c = str[i];
		
		// Is the current character a double-quote?
		if (c === '"') {
			// Were inside a pair of double-quotes?
			if (bInsideQuotes) {
				// Yes.  Move to the next field.
				fieldNdx++;
				
				// We should never have more than two fields.
				if (fieldNdx > 2)
					throw new Error(errPrefix + `Too many fields found input line.  There should be only 2.`);
			}
			
			// Yes. Toggle the inside quotes flag and ignore the character.
			bInsideQuotes = !bInsideQuotes;
		} else {
			// Current character is not a double-quote.
			
			// Are we currently inside a pair of double-quotes?
			//  If not, ignore this character.
			if (bInsideQuotes) {
				// Yes.  Accumulate character to the correct field.
				if (fieldNdx === 0)
					newObj.name += c;
				else if (fieldNdx === 1)
					newObj.description += c;
				else
					throw new Error(errPrefix + `Invalid field index.  Too many fields.`);
			}
		}
	}
	
	// Trim the fields.
	newObj.name = newObj.name.trim();
	newObj.description = newObj.description.trim();
	
	// Validate the new object.
	newObj.validate();
	
	return newObj;
}

module.exports = {
	AssetSymbolAndToken: AssetSymbolAndToken
}