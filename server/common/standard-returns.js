const common_routines = require('../common/common-routines');
const http_status_codes = require('http-status-codes');

/**
 * Simple helper function that returns a JSON object that indicates successfulConfirmation
 *  in a conformed format.
 *
 * @param {Object} req - An Express request object.
 * @param {Object} res - An Express response object.
 * @param {String} theMessage - A simple message to return with the object.
 * @param {Object} [objAuxArgs] - An optional object containing extra data to be returned to the client.
 */
function returnStandardSuccessJsonObj(req, res, theMessage, objAuxArgs) {
    let errPrefix = '(returnStandardSuccessJsonObj) ';
    
    if (typeof req == 'undefined' || req == null)
        throw new Error(errPrefix + 'The request object is unassigned.');
        
    if (typeof res == 'undefined' || res == null)
        throw new Error(errPrefix + 'The response object is unassigned.');
        
    if (!theMessage || theMessage.length < 1)
        throw new Error(errPrefix + 'The message is empty.');
        
    // If we have a value for the auxiliary object parameter, make sure it an object.
    if (objAuxArgs) {
    	if (typeof objAuxArgs != 'object')
    		throw new Error(errPrefix + ' The auxiliary object parameter does not contain a value of type "object"');
	}
    
    let retJsonObj = {
        is_error: false,
        is_error_shown_to_user: false,
        message: theMessage,
	}
	
	// If we have an auxiliary object, transfer it's properties to the JSON object we are returning.
	if (objAuxArgs)
		common_routines.transferAuxObjPropsToObj(objAuxArgs, retJsonObj);
    
    res.status(http_status_codes.OK).send(retJsonObj);
}

/**
 * Simple helper function that returns a JSON object that indicates an error occurred
 *  in a conformed format.
 *
 * @param {Object} req - An Express request object.
 * @param {Object} res - An Express response object.
 * @param {String} theErrorMessage - An error message to return with the object.
 * @param {boolean} [isErrorShownToUser] - Set this to TRUE if you want the error message
 * 	to be shown to the user if this error is something the user can or needs to handle.
 * 	Set it to FALSE if not.  If not given, the default of FALSE will be used (i.e. - not
 * 	shown to the user).
 * @param {Number} [httpStatusCode] - The HTTP error code to send back.  If one
 *  is not provided, an HTTP OK will be returned.
 * @param {Object} [objAuxArgs] - An optional object containing extra data to be returned to the client.
 *
 * NOTE: The response returned carries an HTTP OK status code.
 */
function returnStandardErrorObj(req, res, theErrorMessage, isErrorShownToUser, httpStatusCode, objAuxArgs)
{
    let errPrefix = '(returnStandardErrorObj) ';
    
    if (typeof req == 'undefined' || req == null)
        throw new Error(errPrefix + 'The request object is unassigned.');
        
    if (typeof res == 'undefined' || res == null)
        throw new Error(errPrefix + 'The response object is unassigned.');
        
    if (!theErrorMessage || theErrorMessage.length < 1)
        throw new Error(errPrefix + 'The error message is empty.');
        
    if (typeof httpStatusCode == 'undefined' || httpStatusCode == null)
        httpStatusCode = http_status_codes.OK;

	// If we have been given a value for the isErrorShownToUser parameter, it must be boolean and
	//  the HTTP status code to return parameter must be an HTTP OK.
    if (isErrorShownToUser) {
		if (typeof isErrorShownToUser != 'boolean')
        	throw new Error(errPrefix + 'An isErrorShownToUser parameter has been provided but it is not of type "boolean".');
        	
        // If we are showing an error to the user, then we should ONLY return an HTTP status code of
        //  of HTTP OK, otherwise the client will think it's a catastrophic error.
        if (httpStatusCode !== http_status_codes.OK)
        	throw new Error(errPrefix + 'The isErrorShownToUser flag is set to TRUE, but the HTTP status code to return is not that of HTTP OK.');
	}
	else {
		// The default value is FALSE.
    	isErrorShownToUser = false;
	}
    
    let errorObj = {
        is_error: true,
        is_error_shown_to_user: isErrorShownToUser,
        message: theErrorMessage
    }

		// If we have an auxiliary object, transfer it's properties to the JSON object we are returning.
	if (objAuxArgs)
		common_routines.transferAuxObjPropsToObj(objAuxArgs, errorObj);
    
    res.status(httpStatusCode).send(errorObj);
}

module.exports = {
	returnStandardErrorObj: returnStandardErrorObj,
	returnStandardSuccessJsonObj: returnStandardSuccessJsonObj
}