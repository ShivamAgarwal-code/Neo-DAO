// This file contains the code for the cryptocurrency price caching manager object.
//
// NOTE: This object is NOT a facade that automatically makes the requisite
//  price API call if a price record is "stale".  It only servers as a
//  reference database of CryptocurrencyPriceDetails objects.  Those
//  object contain a dtFetched field that can be used for calculations.

// TODO: Later we should we create a generalized asset price management
//  framework that can handle different asset-symbol/api-id/denominated-by
//  triplets.  For now we just handle one type of asset and API.

const {v4: uuidV4} = require('uuid');
const common_routines = require('../common/common-routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');
const {CryptocurrencyPriceDetails} = require("./cryptocurency-price-details");

function CryptocurrencyPriceCacheManager() {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {Array<CryptocurrencyPriceDetails>} - An
	* 	associative array where the key field is a valid
	* 	cryptocurrency symbol and the value is a
	* 	CryptocurrencyPriceDetails object.
	*
	* @private
	*/
	this._aryPrices = [];
	
	/**
	 * Get a CryptocurrencyPriceDetails object from the cache.
	 *
 	 * @param {String} assetSymbol - The asset symbol whose
 	 * 	price is desired.
	 * @return {null|CryptocurrencyPriceDetails} - Return NULL
	 * 	if we don't have an object yet for the given asset symbol,
	 * 	or a CryptocurrencyPriceDetails object if we do.
	 */
	this.getPriceObj = function(assetSymbol) {
		let methodName = self.constructor.name + '::' + `getPriceObj`;
		let errPrefix = '(' + methodName + ') ';
		
		if (misc_shared_lib.isEmptySafeString(assetSymbol))
			throw new Error(errPrefix + `The assetSymbol parameter is empty.`);
			
		const cachedPriceObj = self._aryPrices[assetSymbol];
		
		if (cachedPriceObj === null || typeof cachedPriceObj === 'undefined')
			// Nothing found.  Confirm to NULL.
			return null;
			
		if (!(cachedPriceObj instanceof CryptocurrencyPriceDetails))
			throw new Error(errPrefix + `The object found for asset symbol(${assetSymbol}) is not a CryptocurrencyPriceDetails object.`);
			
		return cachedPriceObj;
	}
	
	/**
	 * Add or update the cached price object for the desired asset symbol.
	 *
 	 * @param {String} assetSymbol - The asset symbol whose price
 	 * 	object should be added or updated.
	 * @param {CryptocurrencyPriceDetails} newPriceObj - A valid
	 * 	CryptocurrencyPriceDetails object.
	 *
	 * @return {Boolean} - Returns TRUE if there was an existing
	 * 	CryptocurrencyPriceDetails object, FALSE if not.
	 */
	this.setPriceObj = function(assetSymbol, newPriceObj) {
		let methodName = self.constructor.name + '::' + `setPriceObj`;
		let errPrefix = '(' + methodName + ') ';
		
		if (misc_shared_lib.isEmptySafeString(assetSymbol))
			throw new Error(errPrefix + `The assetSymbol parameter is empty.`);
		if (!(newPriceObj instanceof CryptocurrencyPriceDetails))
			throw new Error(errPrefix + `The value in the newPriceObj parameter is not a CryptocurrencyPriceDetails object.`);
		
		const cachedPriceObj = self._aryPrices[assetSymbol];
		const bIsExisting = cachedPriceObj instanceof CryptocurrencyPriceDetails;
		
		self._aryPrices[assetSymbol] = newPriceObj;
		
		return bIsExisting;
	}
}

/**
 * Singleton pattern.
 */
const g_CryptocurrencyPriceCacheManager = new function ()
{
	const self = this;
	
	this.instance = new CryptocurrencyPriceCacheManager();
}();

module.exports = {
	g_CryptocurrencyPriceCacheManager: g_CryptocurrencyPriceCacheManager
}
