// This file contains functions that are shared by multiple pages that need to
//  talk to our back-end server via various API calls.

/**
 * This promise contacts our server and requests the latest
 * 	asset price denominated in the desired target currency.
 *
 * @param {String} assetSymbol - The asset symbol to get the
 * 	latest price for.
 * @param {String} targetCurrency - The desired target currency.
 * @param {null|Function} [funcPostFetch] - Optional
 * 	function to execute after the update occurs.
 *
 * @return {Promise<Object>} - A plain JSON object is returned
 * 	that contains the data from a server side CryptocurrencyPriceDetails
 * 	object.
 */
function fetchSelectedAssetPrice_promise(assetSymbol, targetCurrency, funcPostFetch=null) {
	let errPrefix = '(fetchSelectedAssetPrice_promise) ';
	
	return new Promise(function(resolve, reject) {
		try	{
			if (misc_shared_lib.isEmptySafeString(assetSymbol))
				throw new Error(errPrefix + `The assetSymbol parameter is empty.`);
			
			if (misc_shared_lib.isEmptySafeString(targetCurrency))
				throw new Error(errPrefix + `The targetCurrency parameter is empty.`);
				
			if (funcPostFetch !== null) {
				if (typeof funcPostFetch !== 'function')
					throw new Error(errPrefix + `The value in the funcPostFetch parameter is not NULL, yet it is not a function either.`);
			}
			
			const theUrl = g_GlobalNamespaces.instance.urlGetCryptoCurrencyPrice;
				`${theUrl}?asset_symbol=${assetSymbol}&target_currency=${targetCurrency}`;
				
			const postDataObj =
				{
					asset_symbol: assetSymbol,
					target_currency: targetCurrency
				}
				
			xhrPost_promise(g_GlobalNamespaces.instance.urlGetCryptoCurrencyPrice, postDataObj)
			.then(progressEvent => {
			
				let response = progressEvent.target.response;
				
				// If an error occurs and the error message carries the flag to show it to the user
				//  then the checkServerReturnForError() method will do so.
				if (!checkServerReturnForError('Retrieving current price.', response)) {
					if (!misc_shared_lib.isNonNullObjectAndNotArray(response)) {
						console.info(errPrefix + `Error during price fetch attempt.  "response" object:`);
						console.dir(response, {depth: null, colors: true});
						
						throw new Error(errPrefix + `The server response is not a valid object.`);
					}
					
					const rawCryptoPriceDetailsObj = response.message;
					if (typeof rawCryptoPriceDetailsObj === 'undefined')
						throw new Error(errPrefix + `The price response object from the fetch cryptocurrency API call is invalid (top level objects).`);
					
					const resultAssetSymbol = rawCryptoPriceDetailsObj.assetSymbol;
					const resultAssetPrice = rawCryptoPriceDetailsObj.assetPrice;
					const resultDenominatedInCurrency = rawCryptoPriceDetailsObj.denominatedInCurrency;
					
					if (!resultAssetSymbol || !resultAssetPrice || !resultDenominatedInCurrency)
						throw new Error(errPrefix + `The price response object from the fetch cryptocurrency API call has one or more invalid fields.`);

					// Do we have a post-fetch function?
					if (funcPostFetch)
						// Yes, call it.
						funcPostFetch(rawCryptoPriceDetailsObj);

					// Resolve the promise with the received RAW cryptocurrency price details object.
					resolve(rawCryptoPriceDetailsObj);
				}
			})
			.catch(err => {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + conformErrorObjectMsg(err);
				
				reject(errMsg + ' - promise');
			});
		}
		catch(err) {
			// Convert the error to a promise rejection.
			let errMsg =
				errPrefix + conformErrorObjectMsg(err);
			
			reject(errMsg + ' - try/catch');
		}
	});
}
