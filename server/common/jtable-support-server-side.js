/**
 * This file contains code to support the user of the jTable table component.
 */

const http_status_codes_lib = require('http-status-codes');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

/**
 * Use this method to return a success result to the jTable component.
 *
 * @param {Object|Array} jsonObjOrObjAry - The result object to send back to
 * 	jTable.  May also be an array of objects instead of just a single object.
 */
function buildJTableResultObj_success( jsonObjOrObjAry ) {
	
	let resultObj = new Object();
	
	resultObj.Result = "OK";
	
	// Object arrays are handled slightly differently.
	if (Array.isArray(jsonObjOrObjAry)){
		// Array.
		resultObj.Records = jsonObjOrObjAry;
		resultObj.TotalRecordCount = jsonObjOrObjAry.length;
	}
	else {
		// Single object.
		resultObj.Record = jsonObjOrObjAry;
	}
	
	return resultObj;
}

/**
 * Use this method to return an error result to the jTable component.
 *
 * @param {string} errorMsg - The error message to give the jTable component.
 */
function buildJTableResultObj_failure( errorMsg ) {
	
	let resultObj = new Object();
	
	resultObj.Result = "ERROR";
	resultObj.Message = errorMsg;
	
	return resultObj;
}

/**
 * This method provides unified handling for all the routes that handle jTable requests.
 *
 * @param {string} caller - The string to show with any error or log messages.
 * @param {Function} funcDoJTableRequest - The function that does the actual work of the
 * 	jTable request.  It has no input parameters and must return the value that should be
 * 	passed back to the jTable request.
 * @param {Object} req - A valid Express request object.
 * @param {Object} res - A valid Express result object.
 */
function handleJTableRequest( caller, funcDoJTableRequest, req, res) {
	let errPrefix = '(' + caller + ') ';
	
    try {
		if (misc_shared_lib.isEmptySafeString(caller))
			throw new Error(errPrefix + 'The caller parameter is empty.');
			
		if (!(typeof funcDoJTableRequest == 'function'))
			throw new Error(errPrefix + 'The value given for parameter that contains a function to execute the jTable request is invalid.');
        
        if (!req)
			throw new Error('The Express request object is unassigned.');
        
        if (!res)
			throw new Error('The Express result object is unassigned.');

        let jTableResultObj = funcDoJTableRequest(req);
        
        let resultObjToReturn = buildJTableResultObj_success(jTableResultObj);
        res.status(http_status_codes_lib.OK).send(resultObjToReturn);
    }
    catch (err)
    {
        let errMsg = misc_shared_lib.conformErrorObjectMsg(err);
        console.log('[ERROR: handleJTableRequest] Error -> ' + errMsg);
        
        // Send back a jTable compatible error object in JSON format.
	    let resultObj = buildJTableResultObj_failure(errMsg);
	    res.status(http_status_codes_lib.OK).send(resultObj);
        return;
    }	
}

/**
 * This method provides unified handling for all the routes that handle jTable requests.
 * 	This version expects the asyncFuncDoJTableRequest parameter to be an async
 * 	function that it will call to get the underlying data for the jTable.
 *
 * @param {string} caller - The string to show with any error or log messages.
 * @param {Promise} asyncFuncDoJTableRequest - The async function that does the actual
 * 	work of the jTable request.  It has no input parameters and must return the value
 * 	that should be passed back to the jTable request.
 * @param {Object} req - A valid Express request object.
 * @param {Object} res - A valid Express result object.
 */
async function asyncHandleJTableRequest(caller, asyncFuncDoJTableRequest, req, res) {
	let errPrefix = '(' + caller + ') ';
	
    try {
		if (misc_shared_lib.isEmptySafeString(caller))
			throw new Error(errPrefix + 'The caller parameter is empty.');
			
		if (!(asyncFuncDoJTableRequest instanceof Promise))
			throw new Error(errPrefix + 'The value given for parameter that contains a function to execute the jTable request is not a Promise.');
        
        if (!req)
			throw new Error('The Express request object is unassigned.');
        
        if (!res)
			throw new Error('The Express result object is unassigned.');

		let bIsError = false;
		
        let jTableResultObj =
        	await asyncFuncDoJTableRequest
				.catch (err =>
				{
					bIsError = true;
					let errMsg = misc_shared_lib.conformErrorObjectMsg(err);
					console.log(`[ERROR: ${errPrefix}] Error -> ${errMsg}.`);
					
					// Send back a jTable compatible error object in JSON format.
					let resultObj = buildJTableResultObj_failure(errMsg);
					res.status(http_status_codes_lib.OK).send(resultObj);
					return;
				});
				
		// Did an error occur?
        if (bIsError) {
        	// Yes.  Just return.  The catch block for the async operation
        	//  should have returned a failure result to the client.
        	return;
		} else {
        	// No.  Return the result embedded in a jTable compatible result
        	// 	object with a success status.
        	const resultObjToReturn = buildJTableResultObj_success(jTableResultObj);
        	res.status(http_status_codes_lib.OK).send(resultObjToReturn);
		}
    }
    catch (err)
    {
        let errMsg = misc_shared_lib.conformErrorObjectMsg(err);
        console.log(`[ERROR: ${errPrefix}] Error -> ${errMsg}.`);
        
        // Send back a jTable compatible error object in JSON format.
	    let resultObj = buildJTableResultObj_failure(errMsg);
	    res.status(http_status_codes_lib.OK).send(resultObj);
        return;
    }
}

module.exports = {
	asyncHandleJTableRequest: asyncHandleJTableRequest,
	buildJTableResultObj_failure: buildJTableResultObj_failure,
	buildJTableResultObj_success: buildJTableResultObj_success,
	handleJTableRequest: handleJTableRequest
}