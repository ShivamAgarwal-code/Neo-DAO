// This file contains the code for an object that aggregates a cryptocurrency price
//	and whatever other information should be associated with it.

const {v4: uuidV4} = require('uuid');
const common_routines = require('../common/common-routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

/**
 *
 * @param {String} assetSymbol - The asset symbol.
 * @param {Number} assetPrice - The asset price, denominated by the currency
 * 		given in the denominatedInCurrency field.
 * @param {String} denominatedInCurrency - The currency the asset price is denominated in.
 * @param {String} idOfPriceApi - The ID of the price API used to get this price.
 * @param {Date} dtFetched - The date/time the price was actually fetched
 * 		from the price API./
 *
 * @constructor
 */
function CryptocurrencyPriceDetails(assetSymbol, assetPrice, denominatedInCurrency, idOfPriceApi, dtFetched) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	if (misc_shared_lib.isEmptySafeString(assetSymbol))
		throw new Error(errPrefix + `The assetSymbol parameter is empty.`);

	if (typeof assetPrice !== 'number')
		throw new Error(errPrefix + `The value in the assetPrice parameter is not a number.`);

	if (assetPrice <= 0)
		throw new Error(errPrefix + `The asset price is zero or negative.`);
	
	if (misc_shared_lib.isEmptySafeString(denominatedInCurrency))
		throw new Error(errPrefix + `The targetCurrency parameter is empty.`);
	
	if (misc_shared_lib.isEmptySafeString(idOfPriceApi))
		throw new Error(errPrefix + `The idOfPriceApi parameter is empty.`);
	
	if (!(dtFetched instanceof Date))
		throw new Error(errPrefix + `The value in the dtFetched parameter is not a Date object.`);
		
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {String} - The asset symbol. */
	this.assetSymbol = assetSymbol;
	
	/** @property {Number} - The asset price, denominated by the currency
	* 		given in the denominatedInCurrency field.  */
	this.assetPrice = assetPrice;
	
	/** @property {String} - The currency the asset price is denominated in. */
	this.denominatedInCurrency = denominatedInCurrency;
	
	/** @property {String} - The ID of the price API used to get this price. */
	this.idOfPriceApi = idOfPriceApi;
	
	/** @property {Date} - The date/time price was actually fetched
	* 		from the price API.. */
	this.dtFetched = dtFetched;
}

/**
 * Convert a given an array of CryptocurrencyPriceDetails objects to an associative array
 *  for easy lookups by asset symbol.
 *
 * @param {Array<CryptocurrencyPriceDetails>} aryCryptocurrencyPriceDetailsObjs -
 * 	An array of CryptocurrencyPriceDetails objects.
 *
 * @return {Object} - Returns an associative array in object form whose
 * 	key (property name) is an asset symbol, and whose value (property value)
 * 	is the CryptocurrencyPriceDetails object associated with that asset
 * 	symbol.
 */
CryptocurrencyPriceDetails.arrayToPriceLookupTable = function (aryCryptocurrencyPriceDetailsObjs) {
	let errPrefix = `(CryptocurrencyPriceDetails.arrayToPriceLookupTable) `;
	
	if (!Array.isArray(aryCryptocurrencyPriceDetailsObjs))
		throw new Error(errPrefix + `The aryCryptocurrencyPriceDetailsObjs parameter value is not an array.`);
	if (aryCryptocurrencyPriceDetailsObjs.length < 1)
		throw new Error(errPrefix + `The array of CryptocurrencyPriceDetails objects is empty.`);
		
	let priceDetailsLookupTable = {};
	
	for (let ndx = 0; ndx < aryCryptocurrencyPriceDetailsObjs.length; ndx++) {
		const cryptocurrencyPriceDetailsObj = aryCryptocurrencyPriceDetailsObjs[ndx];
		
		if (!(cryptocurrencyPriceDetailsObj instanceof CryptocurrencyPriceDetails))
			throw new Error(errPrefix + `The value at ndx(${ndx}) is not a CryptocurrencyPriceDetails object.`);
			
		priceDetailsLookupTable[cryptocurrencyPriceDetailsObj.assetSymbol] = cryptocurrencyPriceDetailsObj;
	}
	
	return priceDetailsLookupTable;
}

module.exports = {
	CryptocurrencyPriceDetails: CryptocurrencyPriceDetails
}