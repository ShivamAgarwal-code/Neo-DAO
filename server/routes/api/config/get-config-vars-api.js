// This route returns the global configuration values for this application.

const express = require('express');
const router = express.Router();

const fs = require('fs');
const http_status_codes = require('http-status-codes');
const common_routines = require('../../../common/common-routines');
const misc_shared_lib = require('../../../public/javascripts/misc/misc-shared-lib');
const {returnStandardSuccessJsonObj} = require("../../../common/common-routines");
const { g_GlobalNamespaces } = require('../../../public/javascripts/global-namespace.js');

const ROUTE_PATH = g_GlobalNamespaces.instance.urlGetServerConfigVars;

// ----------------------- ROUTE ENTRY POINT ------------------
router.post(ROUTE_PATH, function(req, res, next) {
   	let errPrefix = `"(${ROUTE_PATH}) `;
	
    try
    {
    	// The reference date to use for any date sensitive calculations.
    	const dtNow = new Date();
    	
    	const retPayloadObj = {
			// neodao_script_hash: common_routines.getEnvironmentVarOrError("NEODAO_SCRIPT_HASH"),
			// gastoken_script_hash: common_routines.getEnvironmentVarOrError("GASTOKEN_SCRIPT_HASH")
    	};
    	
    	// Return a standard success result with the result of the price lookup call.
    	returnStandardSuccessJsonObj(req, res, retPayloadObj);
    	return;
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