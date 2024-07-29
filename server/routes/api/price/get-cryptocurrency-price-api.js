// This route returns the price for a given cryptocurrency symbol
//  in the desired denominated currency.  (e.g. - NEO denominated
//  by USD.  Prices are cached.

// This file contains the code for the route that renders the CREATE OFFER page.

const express = require('express');
const router = express.Router();

const fs = require('fs');
const http_status_codes = require('http-status-codes');
const common_routines = require('../../../common/common-routines');
const misc_shared_lib = require('../../../public/javascripts/misc/misc-shared-lib');
const {returnStandardSuccessJsonObj} = require("../../../common/common-routines");
const {CryptocurrencyPriceDetails} = require("../../../common/cryptocurency-price-details");
const { g_GlobalNamespaces } = require('../../../public/javascripts/global-namespace.js');
const {getCryptocomparePriceWithCaching_promise} = require('../../../services/cryptocompare');

const ROUTE_PATH = g_GlobalNamespaces.instance.urlGetCryptoCurrencyPrice;

// ----------------------- ROUTE ENTRY POINT ------------------
router.post(ROUTE_PATH, function(req, res, next) {
   	let errPrefix = `"(${ROUTE_PATH}) `;
	
    try
    {
    	// Get the price for the desired symbol and target currency (i.e. - the currency
    	//  the price quote is denominated in).
    	const assetSymbol = common_routines.getRawFieldFromPostData(req, 'asset_symbol');
    	const targetCurrency = common_routines.getRawFieldFromPostData(req, 'target_currency');
    	
    	if (misc_shared_lib.isEmptySafeString(assetSymbol))
    		throw new Error(errPrefix + `The asset symbol parameter is missing.`);
    	if (misc_shared_lib.isEmptySafeString(targetCurrency))
    		throw new Error(errPrefix + `The target currency parameter is missing.`);
    		
    	// The reference date to use for any date sensitive calculations.
    	const dtNow = new Date();
    		
		getCryptocomparePriceWithCaching_promise(
			req,
			res,
			dtNow,
			assetSymbol,
			targetCurrency)
		.then(result => {
		    // The result should be a JSON object.
		    if (!(result instanceof CryptocurrencyPriceDetails))
				throw new Error(errPrefix + `The result of the cached price lookup call is not a price details object.`);
				 	
    		// Return a standard success result with the result of the price lookup call.
    		returnStandardSuccessJsonObj(req, res, result);
    		return;
		})
		.catch(err => {
		    const errMsg =
		        errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
		    
		    console.log(errMsg);
		    
		    // Do not send an error response if we already returned one.
		    if (!res.locals.isResponseAlreadySent)
        		res.status(http_status_codes.INTERNAL_SERVER_ERROR).send('An error occurred while retrieving the desired asset symbol price.');
        	return;
		});
	}
    catch (err)
    {
		let errMsg =
			errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
			
        console.log(`'[ERROR: ${errPrefix}] Error during request -> ${errMsg}.`);
	    if (!res.locals.isResponseAlreadySent)
        	res.status(http_status_codes.INTERNAL_SERVER_ERROR).send('An error occurred while processing the request.');
        return;
    } // try/catch
});

module.exports = router;