// This file holds the code for a global singleton object that loads
//	the cryptocurrency and symbol list and keeps it in memory.

const {v4: uuidV4} = require('uuid');
const common_routines = require('../../common/common-routines');
// const misc_shared_lib = require('../../public/javascripts/misc/misc-shared-lib');
const misc_shared_lib = require('../../public/javascripts/misc/misc-shared-lib');
const pathLib = require('path');
const jsonfile = require('jsonfile');
const {AssetSymbolAndToken} = require("../../common/asset-symbol-and-description");


function CryptoSymbolAndDescription() {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {Array<AssetSymbolAndToken} - An array of cryptocurrency
	* 		symbol and  description objects, for the most popular
	* 		cryptocurrencies (at this time).  */
	this.aryAssetSymbolAndDescriptions = null;
	
	// ---------------------- CONSTRUCTOR CODE ----------------
	
	// Load the data from the JSON file.
	const str = __dirname;
	console.warn('Dirname: ' + str);

	const assetFilename = pathLib.resolve('../server/input-files/top-1000-cryptocurrency-symbol-and-name-list.json');
	console.warn('Loading assets from file: ' + assetFilename);

	let cryptoCurrencyDetails = jsonfile.readFileSync(assetFilename);
	
	if (!('aryAssetSymbolAndDescriptions' in cryptoCurrencyDetails))
		throw new Error(errPrefix + `The JSON object that should contain the cryptocurrency symbols and descriptions is missing the aryAssetSymbolAndDescriptions property.`);
	
	if (!Array.isArray(cryptoCurrencyDetails.aryAssetSymbolAndDescriptions))
		throw new Error(errPrefix + `The cryptoCurrencyDetails.aryAssetSymbolAndDescriptions property is not an array.`);
		
	if (cryptoCurrencyDetails.aryAssetSymbolAndDescriptions.length < 1)
		throw new Error(errPrefix + `The cryptoCurrencyDetails.aryAssetSymbolAndDescriptions property is empty`);

	// Save it.
	self.aryAssetSymbolAndDescriptions = cryptoCurrencyDetails.aryAssetSymbolAndDescriptions;
}

/**
 * Singleton pattern.
 */
const g_CryptoSymbolAndDescription = new function ()
{
	const self = this;
	
	this.instance = new CryptoSymbolAndDescription();
	
}();

module.exports = {
	g_CryptoSymbolAndDescription: g_CryptoSymbolAndDescription
}
