// This module contains an object that the wraps the HTTPS request object
//  so that most exceptions are caught and dealt with appropriately.

const {v4: uuidV4} = require('uuid');

const https = require('https');

const common_routines = require('../common/common-routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

// Set this to TRUE for verbose logging in this module.
const g_HttpsRequestWrapperVerbose = false;

/**
 * This is the object that is the result of a call to the
 * 	httpsRequestWrapper_jsonobjresult_promise() function.
 *
 * @constructor
 */
function HttpsRequestWrapperResult() {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {Boolean} - If TRUE, then an error occurred during the
	* 	HTTPS request and the error details will be contained in this
	*  	object (if any were available).  If FALSE, then the result
	*  	object obtained from the call will be found in the
	*  	jsonResultObj property.	  */
	this.isError = false;
	
	/** @property {Object} - If the HTTPS call succeeded, this will
	* 	contain the JSON result object from the call.  */
	this.jsonResultObj = null;
	
	/** @property {String} - The contents of the dataBody string
	* 	that accumulates the slices of data received during an
	* 	HTTPS request.  It may be NULL if the request never
	* 	received any data.
	*
	* 	NOTE: We include this in case the dataBody element contains
	* 	an error response document from the request target. */
	this.dataBody = null;
	
	/** @property {String} - If an error occurred, any error message(s)
	*   that were available at the time the error occurred will be found
	*   here.  */
	this.errorDetails = '(no error details available)'
	
	/** @property {String} - An indication of where in the HTTPS
	* 	wrapper request the error occurred (e.g. - in the "end"
	* 	event handler, etc.) */
	this.errorContext = '(no error context set)';
}

function HttpsRequestDetails(theFullUrl) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {String} - The URL for the request. */
	this.url = theFullUrl;
	
	/** @property {String} - The HTTP request type.  (e.g. -
	* 	GET, POST, etc.  */
	this.requestType = null;
	
}

/**
 * This promise wraps the details for an HTTPS GET request in an
 *  with proper exception handling so the event handlers can't crash the
 *  app with an unhandled exception.  It then executes the request.
 *
 * @param {String} theFullUrl - The full URL for the request.
 *
 * @return {Promise<Object>} - The promise resolves to an
 * HttpsRequestWrapperResult object that will contain either
 * 	the JSON object returned from the request target if the
 * 	call succeeded or the details of the error that occurred
 * 	if an error occurred.
 */
function httpsRequestWrapper_GET_jsonobjresult_promise(theFullUrl) {
	let errPrefix = '(httpsRequestWrapper_GET_jsonobjresult_promise) ';
	
	if (misc_shared_lib.isEmptySafeString(theFullUrl))
		throw new Error(errPrefix + `The theFullUrl parameter is empty.`);
	
	return new Promise(function(resolve, reject) {
		let httpsReqWrapJsonResultObj = new HttpsRequestWrapperResult();
		
		try	{
			// Process the response from the external server.
			let dataBody = "";
			
			// The data may come to us in pieces.  The 'on' event handler will accumulate them for us.
			let iNumSlices = 0;
			
			// Create an HttpsRequestDetails object to hold the request details.
			const httpsRequestDetailsObj = new HttpsRequestDetails();
			
			
			const httpsRequest = https.request(theFullUrl,
				function(extRequest)
				{
					// EVENT HANDLER: on-data
					extRequest.on('data', function(dataSlice) {
						iNumSlices++;
						
						try {
							if (g_HttpsRequestWrapperVerbose) {
								console.log('(httpsRequest:on) Received slice # ' + iNumSlices +'.');
							}
							
							dataBody += dataSlice;
						}
						catch(err) {
							// Return a result object with error details.
							const errMsg =
								errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
								
							// Show the dataBody element in case there's an error document in there.
							console.info(errPrefix + `httpsRequestWrapper::dataBody object:`);
							console.dir(dataBody, {depth: null, colors: true});
							
							httpsReqWrapJsonResultObj.isError = true;
							httpsReqWrapJsonResultObj.errorContext = 'httpsRequestWrapper::on-data';
							httpsReqWrapJsonResultObj.errorDetails = errMsg;
		
							// Resolve the promise with the result object.
							resolve(httpsReqWrapJsonResultObj);
							
							// reject(errMsg + ' - try/catch -> in httpsRequestWrapper "data" event handler.');
						}
					});
					
					// EVENT HANDLER: on-data
					//  When we have received all the data from the external server, finish the request.
					extRequest.on('end', function() {
						try {
							// SUCCESS.
							if (g_HttpsRequestWrapperVerbose) {
								console.log(errPrefix + `::httpsRequestWrapper::end, Success.  Data body length: ${dataBody.length}.`);
								console.log(errPrefix + `::httpsRequestWrapper::end, Content: `);
								console.log(dataBody);
							}
							
							let parsedDataBodyObj = JSON.parse(dataBody);
							
							httpsReqWrapJsonResultObj.isError = false;
							httpsReqWrapJsonResultObj.jsonResultObj = parsedDataBodyObj;
							httpsReqWrapJsonResultObj.dataBody = dataBody;
							
							resolve(httpsReqWrapJsonResultObj);
						}
						catch(err) {
							// Return a result object with error details.
							const errMsg =
								errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
								
							// Show the dataBody element in case there's an error document in there.
							console.info(errPrefix + `httpsRequestWrapper::dataBody object:`);
							console.dir(dataBody, {depth: null, colors: true});
							
							httpsReqWrapJsonResultObj.isError = true;
							httpsReqWrapJsonResultObj.errorContext = 'httpsRequestWrapper::on-end';
							httpsReqWrapJsonResultObj.errorDetails = errMsg;
		
							// Resolve the promise with the result object.
							resolve(httpsReqWrapJsonResultObj);
							
							// reject(errMsg + ' - try/catch -> in httpsRequestWrapper "end" event handler.');
						}
					});
				});
				
			httpsRequest.on('error', function(err)
			{
				// Return a result object with error details.
				const errMsg =
					errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
					
				httpsReqWrapJsonResultObj.isError = true;
				httpsReqWrapJsonResultObj.errorContext = 'httpsRequestWrapper::on-error';
				httpsReqWrapJsonResultObj.errorDetails = errMsg;

				// Resolve the promise with the result object.
				resolve(httpsReqWrapJsonResultObj);
			});
			
			// Write the POST data to the HTTPS request object.
			httpsRequest.write('');
			httpsRequest.end();
		}
		catch(err) {
			// Convert the error to a promise rejection.
			let errMsg =
				errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
			
			httpsReqWrapJsonResultObj.isError = true;
			httpsReqWrapJsonResultObj.errorContext = 'httpsRequestWrapper::outer-try-catch';
			httpsReqWrapJsonResultObj.errorDetails = errMsg;

			// Resolve the promise with the result object.
			resolve(httpsReqWrapJsonResultObj);
			
			// reject(errMsg + ' - try/catch');
		}
	});
}

module.exports = {
	httpsRequestWrapper_GET_jsonobjresult_promise: httpsRequestWrapper_GET_jsonobjresult_promise,
	HttpsRequestWrapperResult: HttpsRequestWrapperResult
}