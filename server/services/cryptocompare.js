// This module gets the price for a particular cryptocurrency using the CryptoCompare API.
// const {v4: uuidV4} = require('uuid');

const {v4: uuidV4} = require('uuid');
const https = require('https');
const URLParser = require('url');

const common_routines = require('../common/common-routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');
const {returnStandardErrorObj} = require("../common/common-routines");
const {g_CryptocurrencyPriceCacheManager} = require("../common/cryptocurrency-price-cache");
const {CryptocurrencyPriceDetails} = require("../common/cryptocurency-price-details");
const price_shared_lib = require('../public/javascripts/misc/price-shared-lib');

// The ID for the Cryptcompare price API service.
const ID_API_CRYPTOCOMPARE_PRICE = "cryptocompare_price_1";

// This is the amount of time a price object in the cache
//  will be considered fresh (i.e. - not "stale").
const CACHE_INTERVAL_MILLISECONDS = 60 * 1000; // 1 minute cache interval.

/**
 * This object aggregates the important details of a cryptocurrency price.
 *
 * @constructor
 */

/**
 * Convert a price in USD format into the SSML needed to say it.
 *
 * @param {Number} priceInUSD - A price in USD.
 *
 * @return {String} - Returns the SSML text that will say the number
 * 	properly.
 */
function getUsdPriceSSML(priceInUSD) {
	let errPrefix = `(getUsdPriceSSML) `;
	
	if (typeof priceInUSD !== 'number')
		throw new Error(errPrefix + `The value in the priceInUSD parameter is not a number.`);
	if (priceInUSD < 0)
		throw new Error(errPrefix + `The priceInUSD parameter is negative.`);
		
	// Split the price into its dollar and strCents components.
	const dollars = Math.trunc(priceInUSD);
	const cents = Math.trunc(100 * (priceInUSD - dollars));
	
	if (dollars < 0)
		throw new Error(errPrefix + `The dollars part of the price is negative.`);
	if (cents < 0)
		throw new Error(errPrefix + `The RAW cents part of the price is negative.`);
		
	let retSSML = null;
	
	let strDollarsPart = dollars === 1 ? `${dollars} dollar` : `${dollars} dollars`;
	let strCentsPart = cents === 1 ? `${cents} cent` : `${cents} cents`;
	
	// Price is zero.
	if (priceInUSD === 0)
		retSSML = 'zero';
	else if (dollars === 0)
		retSSML = strCentsPart;
	else if (cents === 0)
		retSSML = strDollarsPart;
	else
		retSSML = `${strDollarsPart} and ${strCentsPart}`;
		
	return retSSML;
}

/**
 * This promise gets one cryptocurrency price using the Cryptocompare API.
 *
 * @param {String} cryptoSymbol - The symbol for the desired cryptocurrency.
 * @param {String} targetCurrency - The currency to translate the price
 * 	into (e.g. - USD).
 *
 * @return {Promise<Object>} - The result will be an object with one field
 * 	for every target currency, with the field name equal to that currency's
 * 	symbol.  (E.g. - for "USD" the result object would be { USD: <price> }).
 */
function getCryptocomparePrice_promise(cryptoSymbol, targetCurrency='USD') {
	let errPrefix = '(getCryptocomparePrice_promise) ';
	
	return new Promise(function(resolve, reject) {
		try	{
			if (misc_shared_lib.isEmptySafeString(cryptoSymbol))
				throw new Error(errPrefix + `The cryptoSymbol parameter is empty.`);
			if (misc_shared_lib.isEmptySafeString(targetCurrency))
				throw new Error(errPrefix + `The targetCurrency parameter is empty.`);
				
			// Get our API key from the environment.
			let apiKey = common_routines.getEnvironmentVarOrError('CRYPTOCOMPARE_API_KEY');
			
			if (misc_shared_lib.isEmptySafeString(apiKey))
				throw new Error(errPrefix + `The Cryptocompare API key is empty.`);
			
			const urlPath = `/data/price?fsym=${cryptoSymbol}&tsyms=${targetCurrency}&api_key=${apiKey}`;
			const hostName = `min-api.cryptocompare.com`;
			const fullUrl = `https://${hostName}${urlPath}`;
			
			console.log(errPrefix + 'Using URL: ' + fullUrl);
			
			// Make the request to the designated external server.
			const httpsRequest = https.request(fullUrl,
				function(extRequest)
				{
					console.log('(httpsRequest) In request handler.');
					
					// Process the response from the external server.
					let dataBody = "";
					
					// The data may come to us in pieces.  The 'on' event handler will accumulate them for us.
					let iNumSlices = 0;
					extRequest.on('data', function(dataSlice) {
						iNumSlices++;
						console.log('(httpsRequest:on) Received slice # ' + iNumSlices +'.');
						dataBody += dataSlice;
					});
					
					//  When we have received all the data from the external server, finish the request.
					extRequest.on('end', function() {
						// SUCCESS: Return the result to AWS.
						console.log('(httpsRequest:end) Success.  Data body length: ' + dataBody.length +'.');
						console.log('(httpsRequest:end) Content: ');
						
						let buffer = Buffer.from(dataBody, "binary");
						
						// Check for GZip compressed data.
						if (extRequest.headers['content-encoding'] && extRequest.headers['content-encoding'] == 'gzip') {
							// Decompress the data.
						
							zlib.gunzip(buffer, (err, buffer) => {
								if (err) {
									// Reject the promise with the error.
									reject(err);
									return;
								} else {
									console.log(errPrefix + buffer.toString('utf8'));
								}
							});
						} else {
							try {
								console.log(errPrefix + dataBody);
								let parsedDataBodyObj = JSON.parse(dataBody);
								resolve(parsedDataBodyObj);
							} catch(err) {
								// Log the error.
								console.info(errPrefix + `err object from JSON.parse() attempt:`);
								console.dir(err, {depth: null, colors: true});
							
								reject(`Unable to get prices at this time.  Response received from prices server: ${dataBody}`);
							}
						}
					});
				});
			httpsRequest.on('error', function(err)
			{
				// FAILURE: Return the error.
				reject(err);
			});
			
			// Write the GET data to the HTTPS request object.
			httpsRequest.write('');
			httpsRequest.end();		}
		catch(err) {
			// Convert the error to a promise rejection.
			let errMsg =
				errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
			
			reject(errMsg + ' - try/catch');
		}
	});
}

/**
 * This function tries to find a CryptocurrencyPriceDetails
 * 	object in the cache that is not stale and is denominated
 * 	in the desired target currency.
 *
 * @param {Date} dtNow - The date to use as the current date/time
 * 	for any date sensitive calculations.
 * @param {String} cryptoSymbol - The symbol for the desired cryptocurrency.
 * @param {String} targetCurrency - The currency to translate the price
 * 	into (e.g. - USD).
 *
 * @return {null|CryptocurrencyPriceDetails} - Returns a
 * 	CryptocurrencyPriceDetails object from the cache if a
 * 	usable object could be found, NULL if not.
 */
function checkPriceCache(dtNow, cryptoSymbol, targetCurrency) {
	let errPrefix = `(checkPriceCache) `;
	
	if (!(dtNow instanceof Date))
		throw new Error(errPrefix + `The value in the dtNow parameter is not a Date object.`);
	if (misc_shared_lib.isEmptySafeString(cryptoSymbol))
		throw new Error(errPrefix + `The cryptoSymbol parameter is empty.`);
	if (misc_shared_lib.isEmptySafeString(targetCurrency))
		throw new Error(errPrefix + `The targetCurrency parameter is empty.`);
	
	// Do we have a cached price object for the desired symbol?
	const cachedPriceObj = g_CryptocurrencyPriceCacheManager.instance.getPriceObj(cryptoSymbol);
	
	if (!cachedPriceObj)
		// Nothing in the cache.
		return null;
		
	if (!(cachedPriceObj instanceof CryptocurrencyPriceDetails))
		throw new Error(errPrefix + `The cached price object was not NULL, but it is not a CryptocurrencyPriceDetails object either.`);
		
	// Yes.  Calculate the freshness value.
	const diffTime = dtNow - cachedPriceObj.dtFetched;
	
	// We should never have a negative time difference value
	//  since the date fetched field value should always be
	//  older than the current date/time.
	if (diffTime < 0)
		throw new Error(errPrefix + `The time delta value for the last price fetch is negative.`);
	
	// If the cached price object is not in the desired target currency
	//  or it is stale, set the flag to fetch a new price.
	if (cachedPriceObj.denominatedInCurrency !== targetCurrency ||
		diffTime > CACHE_INTERVAL_MILLISECONDS ) {
		// The object we retrieved from the cache is not usable.
		return null;
	} else {
		// Return the object we found in the cache.
		return cachedPriceObj;
	}
}

/**
 * This promise wraps the getCryptocomparePrice_promise() call to
 * 	provided optional caching capability.
 *
 * @param {Object} req - A valid Express request object.
 * @param {Object} res - A valid Express result object.
 * @param {Date} dtNow - The date to use as the current date/time
 * 	for any date sensitive calculations.
 * @param {String} cryptoSymbol - The symbol for the desired cryptocurrency.
 * @param {String} targetCurrency - The currency to translate the price
 * 	into (e.g. - USD).
 * @param {Boolean} [bForceNewFetch] - If TRUE, then the price cache
 * 	will be ignored and a new price will be retrieved.  If FALSE, then
 * 	the price cache will be checked before fetching a new price.
 *
 * @return {Promise<CryptocurrencyPriceDetails>} - The result will be
 * 	a CryptocurrencyPriceDetails object.
 */
function getCryptocomparePriceWithCaching_promise(req, res, dtNow, cryptoSymbol, targetCurrency='USD', bForceNewFetch=false) {
	let errPrefix = '(getCryptocomparePriceWithCaching_promise) ';
	
	return new Promise(function(resolve, reject) {
		try	{
			if (!req)
				throw new Error('The Express request object is unassigned.');
        	if (!res)
				throw new Error('The Express result object is unassigned.');
			if (!(dtNow instanceof Date))
				throw new Error(errPrefix + `The value in the dtNow parameter is not a Date object.`);
			if (misc_shared_lib.isEmptySafeString(cryptoSymbol))
				throw new Error(errPrefix + `The cryptoSymbol parameter is empty.`);
			if (misc_shared_lib.isEmptySafeString(targetCurrency))
				throw new Error(errPrefix + `The targetCurrency parameter is empty.`);
			if (typeof bForceNewFetch !== 'boolean')
				throw new Error(errPrefix + `The value in the bForceNewFetch parameter is not boolean.`);
				
			// Get our API key from the environment.
			let apiKey = common_routines.getEnvironmentVarOrError('CRYPTOCOMPARE_API_KEY');
			
			if (misc_shared_lib.isEmptySafeString(apiKey))
				throw new Error(errPrefix + `The Cryptocompare API key is empty.`);

			let bFetchNewPrice = false;
			let cachedPriceObj = null;
			
			// Is flag set to ignore the cache?
			if (bForceNewFetch)
				// Force a price lookup.
				bFetchNewPrice = true;
			else
				// ---------------- CHECK THE PRICE CACHE -------------------
				cachedPriceObj = checkPriceCache(dtNow, cryptoSymbol, targetCurrency);
			
			// If we have a valid cached price object and the force a new
			//  price fetch is not set, then resolve the promise with it.
			if (cachedPriceObj && !bFetchNewPrice) {
				resolve(cachedPriceObj);
				return;
			}
			
			// ------------------ FETCH NEW PRICE ----------------
			
			// Pass the call on to the actual price fetching promise.
			getCryptocomparePrice_promise(cryptoSymbol, targetCurrency)
			.then(result => {
				// TODO: The processing of the result object is directly
				//  tied to the format of the Cryptocompare API.  Make this
				//  API agnostic later on.
				if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
					throw new Error(errPrefix + `The result of the getCryptocomparePrice_promise() call is not a valid object.`);
					
				// Check for an error from the Cryptocompare API.
				const responseType = result["Response"];
				const responseMsg = result["Message"];
				
				const strCoinPair = `asset symbol "${cryptoSymbol}" denominated in: "${targetCurrency}"`;
				
				if (typeof responseMsg !== 'undefined') {
					if (responseType === "Error") {
						if (typeof responseMsg === 'string') {
							// Create a friendlier error messages for known errors.
							if (responseMsg.indexOf('market does not exist for this coin pair') >= 0) {
								// The cryptocompare API doesn't have any date for our
								// 	asset-symbol/target-currency pair.
								const errMsg = `The Cryptocompare API does not have any price data for ${strCoinPair}.`;
								
								returnStandardErrorObj(req, res, errMsg, true);
								throw new Error(errPrefix + errMsg);
							}
						}
					
						// It's an error message we are not handling directly yet.  Throw it.
						if (typeof	responseMsg === 'string')
							throw new Error(errPrefix + `[CRYPTOCOMPARE API ERROR: ${result["Message"]}.`);
						else {
							// We don't see a message. Log the error object and throw a generic message..
							console.info(errPrefix + `Cryptocompare API result object:`);
							console.dir(result, {depth: null, colors: true});
							
							throw new Error(errPrefix + `The Cryptocompare API returned an error without a message we understand when requesting price data for ${strCoinPair}.`);
						}
					}
				}
					
				if (!(targetCurrency in result))
					throw new Error(errPrefix + `The result of the getCryptocomparePrice_promise() call  does not contain the target currency name as a property.`);
					
				const price = result[targetCurrency];
				
				if (typeof price !== 'number')
					throw new Error(errPrefix + `The value of the "${targetCurrency}" price property in tn the result object returned by getCryptocomparePrice_promise() call is not a number.`);
					
				// We have a valid price.  Return the object.
				
				// Update the cache.
				const cryptoPriceDetailsObj =
					new CryptocurrencyPriceDetails(cryptoSymbol, price, targetCurrency, ID_API_CRYPTOCOMPARE_PRICE, dtNow);
				g_CryptocurrencyPriceCacheManager.instance.setPriceObj(cryptoSymbol, cryptoPriceDetailsObj);
				
				// Resolve the promise with the new price.
				resolve(cryptoPriceDetailsObj);
				return;
			})
			.catch(err => {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
				
				reject(errMsg + ' - promise');
				return;
			});
		}
		catch(err) {
			// Convert the error to a promise rejection.
			let errMsg =
				errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
			
			reject(errMsg + ' - try/catch');
		}
	});
}


/**
 * This promise resolves to the SSML text that contains the latest
 *  price quotes for the NEO and GAS tokens.
 *
 * @param {Boolean} bSayGoodbye - If TRUE, a goodbye phrase will be
 * 	appended to the output.  If FALSE, then just the price quote
 * 	phrase will be returned.
 *
 * @return {Promise<String>} - The promise resolves to a string that
 *  contains the SSML text for saying the current Neo and Gas]
 *  prices to the user.
 */
function getNeoAndGasPriceSSML_promise(bSayGoodbye=false) {
	let errPrefix = '(getNeoAndGasPriceSSML_promise) ';
	
	return new Promise(function(resolve, reject) {
		try	{
			let neoPriceJsonObj = null;
			let gasPriceJsonObj = null;
			let neoPrice = null;
			let gasPrice = null;
			let neoPriceSSML = null;
			let gasPriceSSML = null;
			let retSSML = null;
			
			if (typeof bSayGoodbye !== 'boolean')
				throw new Error(errPrefix + `The value in the bSayGoodbye parameter is not boolean.`);
			
			// Get price quotes in USD.
			const targetCurrency = 'USD';
			
			// Get the current price for Neo.
			getCryptocomparePriceWithCaching_promise(req, res, ASSET_SYMBOL_NEO_TOKEN, targetCurrency)
			.then(result => {
				if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
					throw new Error(errPrefix + `The result of the getCryptocomparePriceWithCaching_promise("NEO") call is not a valid object.`);
					
				neoPriceJsonObj = result;
				neoPrice = price_shared_lib.getPriceByCurrencyFromResultObj(neoPriceJsonObj, targetCurrency);
				neoPriceSSML = getUsdPriceSSML(neoPrice);
				
				// Get the current price for GAS.
				return getCryptocomparePrice_promise(ASSET_SYMBOL_SMART_CONTRACT_CURRENCY, targetCurrency);
			})
			.then(result => {
				if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
					throw new Error(errPrefix + `The result of the getCryptocomparePrice_promise("GAS") call is not a valid object.`);
					
				gasPriceJsonObj = result;
				gasPrice = price_shared_lib.getPriceByCurrencyFromResultObj(gasPriceJsonObj, targetCurrency);
				gasPriceSSML = getUsdPriceSSML(gasPrice);
				
				// Build the SSML text that speak both prices.
				retSSML =
					`The current price for Neo is ${neoPriceSSML}, and the price for Gas is ${gasPriceSSML}.`;
					
				if (bSayGoodbye)
					retSSML += ` Goodbye.`;
					
				console.info(errPrefix + `Returning SSML for quoting the current price for Neo and Gas: ${retSSML}`);
				
				resolve(retSSML);
			})
			.catch(err => {
				// The prices server may not be available at the moment.  Don't
				//  reject the promise. Instead, return error text to the user.
				resolve(`Prices are unavailable at the moment.  Please try again later.  Usually things are back to normal in about 10 minutes or so.`);
			
				/*
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
				
				reject(errMsg + ' - promise');
				 */
			});
		}
		catch(err) {
			// Convert the error to a promise rejection.
			let errMsg =
				errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
			
			reject(errMsg + ' - try/catch');
		}
	});
}

/**
 * Get the prices for an array of cryptocurrency symbols.
 * @param {Object} req - A valid Express request object.
 * @param {Object} res - A valid Express result object.
 * @param {Array<String>} aryAssetSymbols - An array of asset symbols
 * 	to get prices for.
 * @param {String} denominatedInCurrency - The currency the resulting
 * 	prices of the asset symbols should be denominated in.
 *
 * @return {Promise<Array<CryptocurrencyPriceDetails>>} - Resolves
 * 	to an array of CryptocurrencyPriceDetails objects, one for
 * 	each cryptocurrency asset symbol given to us.
 */
function getArrayOfCryptocurrencyPrices_promise(req, res, aryAssetSymbols, denominatedInCurrency) {
	let errPrefix = '(getArrayOfCryptocurrencyPrices_promise) ';
	
	return new Promise(function(resolve, reject) {
		try	{
			if (!misc_shared_lib.isNonNullObjectAndNotArray(req))
				throw new Error(errPrefix + `The Express request parameter does not contain a valid object.`);
			if (!misc_shared_lib.isNonNullObjectAndNotArray(res))
				throw new Error(errPrefix + `The Express result parameter does not contain a valid object.`);
			
			if (misc_shared_lib.isEmptySafeString(aryAssetSymbols))
				throw new Error(errPrefix + `The aryAssetSymbols parameter is empty.`);
				
			// Use a common date for the reference date for this operation.
			const dtNow = new Date();
				
			let aryCryptoCompareApiResults = null;
			let aryCryptocurrencyPriceDetailsObjs = [];
			
			// Save the current date.  It will be used as the date the
			//  price was fetched from the API.
			const dtFetched = new Date();
				
			// Build an array of Cryptocompare API calls.
			let aryCryptoCompareApiRequests = [];
			
			for (let ndx = 0; ndx < aryAssetSymbols.length; ndx++)	{
				const assetSymbol = aryAssetSymbols[ndx];
				
				if (misc_shared_lib.isEmptySafeString(assetSymbol))
					throw new Error(errPrefix + `The assetSymbol found at index(${ndx}) is invalid.`);
					
				// Build the Cryptocompare API call.
				const apiCall = getCryptocomparePriceWithCaching_promise(req, res, dtNow, assetSymbol, denominatedInCurrency);
				aryCryptoCompareApiRequests.push(apiCall);
			}
			
			// Make the API calls.
			Promise.all(aryCryptoCompareApiRequests)
			.then(result => {
				// We should have gotten back an array of successful results.
				if (!Array.isArray(result))
					throw new Error(errPrefix + `The result of the bulk Cryptocompare API request call is not an array.`);
					
				// One for each request.
				if (result.length !== aryCryptoCompareApiRequests.length)
					throw new Error(errPrefix + `The length of the array returned by the bulk Cryptocompare API request call does not match the number of requests made.`);
					
				const aryCryptoCompareApiResults = result;

				// Extract the prices from each result while building an array of
				//	CryptocurrencyPriceDetails objects.
				for (let ndx = 0; ndx < aryCryptoCompareApiResults.length; ndx++) {
					const cryptocurrencyPriceDetailsObj = aryCryptoCompareApiResults[ndx];
					
					if (!(cryptocurrencyPriceDetailsObj instanceof CryptocurrencyPriceDetails))
						throw new Error(errPrefix + `The value in the cryptocurrencyPriceDetailsObj parameter is not a CryptocurrencyPriceDetails object.`);
				
					const currentAssetPrice = cryptocurrencyPriceDetailsObj.assetPrice;
					
					if (typeof currentAssetPrice !== 'number')
						throw new Error(errPrefix + `The value in the currentAssetPrice parameter is not number.`);
					if (0 >= currentAssetPrice)
						throw new Error(errPrefix + `The element at index(${ndx}) has an invalid price. `);
						
					// Build a new CryptocurrencyPriceDetails object and accumulate it.
					const priceDetailsObj =
						new CryptocurrencyPriceDetails(
							aryAssetSymbols[ndx],
							currentAssetPrice,
							denominatedInCurrency,
							ID_API_CRYPTOCOMPARE_PRICE,
							dtFetched);
					aryCryptocurrencyPriceDetailsObjs.push(priceDetailsObj);
				}
				
				// Resolve the promise with the results array.
				resolve(aryCryptocurrencyPriceDetailsObjs);
			})
			.catch(err => {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
				
				reject(errMsg + ' - promise');
			});
		}
		catch(err) {
			// Convert the error to a promise rejection.
			let errMsg =
				errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
			
			reject(errMsg + ' - try/catch');
		}
	});
}

module.exports = {
	getArrayOfCryptocurrencyPrices_promise: getArrayOfCryptocurrencyPrices_promise,
	// getCryptocomparePrice_promise: getCryptocomparePrice_promise,
	getCryptocomparePriceWithCaching_promise: getCryptocomparePriceWithCaching_promise,
	getNeoAndGasPriceSSML_promise: getNeoAndGasPriceSSML_promise
}
