const express = require('express');
const router = express.Router();

const http_status_codes = require('http-status-codes');
const common_routines = require('../../common/common-routines');
const misc_shared_lib = require('../../public/javascripts/misc/misc-shared-lib');
const fs = require('fs');
const { g_CryptoSymbolAndDescription } = require('../../data/assets/cryptocurrency-symbol-and-descriptions.js');
const { g_GlobalNamespaces } = require('../../public/javascripts/global-namespace.js');

const ROUTE_PATH = g_GlobalNamespaces.instance.urlGetCryptoSymblsAndDesc;

// ----------------------- ROUTE ENTRY POINT ------------------
router.post(ROUTE_PATH, function(req, res, next) {
   	let errPrefix = `"(${ROUTE_PATH}) `;
	
    try
    {
    	// Return the cryptocurrency symbol and description array content.
		res.status(http_status_codes.OK).send(g_CryptoSymbolAndDescription.instance);
	}
    catch (err)
    {
		let errMsg =
			errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
			
        console.log(`'[ERROR: ${errPrefix}] Error during request -> ${errMsg}.`);
        
        // Do not send an error response if we already returned one.
		if (!res.locals.isResponseAlreadySent)
        	res.status(http_status_codes.INTERNAL_SERVER_ERROR).send('An error occurred while processing the request.');
        return;
    } // try/catch
});

module.exports = router;