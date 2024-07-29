// Some miscellaneous Javascript routines.

// A simple error message to show the user on the client side code when an error occurs.
const ERROR_MESSAGE_CONTACT_TECH_SUPPORT = 'Please contact Android Technologies technical support.';

// Get the URL parameters passed to us and return an associative array
//  made from them.
function getUrlArguments()
{
    var args = [], argLabelsExtracted;

    // Get all the argument parameters after the '?' symbol in the URL.
    var argLabels = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

    // Iterate all the argument parameter name-value pairs.
    for (var i = 0; i < argLabels.length; i++)
    {
        // Split about the current name-value pair.
        argLabelsExtracted = argLabels[i].split('=');

        // Add the name to our associative array for the URL parameters.
        args.push(argLabelsExtracted[0]);

        // Set value for the recently added name.
        args[argLabelsExtracted[0]] = argLabelsExtracted[1];
    } // for (var i = 0; i < argLabels.length; i++)

    // Return the results.
    return args;
}

// Trigger a bookmark operation if allowed by the current browser
//  using the given URL, with the given title to be displayed in
//  the browser Favorites list.  ONLY WORKS IN INTERNET EXPLORER!
function addBookmark(url, title)
{
    if (window.external)
    {
        window.external.AddFavorite(url, title);
    } else {
        alert("Your browser does not allow bookmarks to be added from Javascript.");
    }
}

/**
 * This function returns TRUE if the given string is of type STRING and is not
 *  empty.
 *
 * @param str - The value to test.
 *
 * @return {boolean}
 */
function isNonEmptyString(str) {
    if (typeof str !== 'string')
        return false;
        
    if (!str)
        return false;
        
    if (str.length < 1)
        return false;
        
    return true;
}

/**
 * This function removes the extra quotes the HTML5 FileReader object adds when you
 *  call it's read-as-text method.
 *
 * @param {string} str - A string that came from an HTML5 read-as-text operation.
 *
 * @return {*} - Returns the string without the unwanted double quotes.
 */
function fixFileReaderQuoting(str) {
    if (!isNonEmptyString(str))
        // Empty string or not a string.  Just return NULL.
        return null;
        
    var retStr = "";
    
    var ndx = 0;
    
    while (ndx < str.length) {
        var c = str.charAt(ndx);
        
        var bIsNextCharADoubleQuote = false;
        
        // Is the next character a double quote?
        if (ndx + 1 < str.length)
            // Only keep a double quote if it's followed by another double quote (double-double quotes).
            bIsNextCharADoubleQuote = (str.charAt(ndx + 1) == '"');

        // Is current character a double quote?
        if (c == '"') {
            // Is it followed by another double quote.?
            if (bIsNextCharADoubleQuote) {
                // Yes.  Keep it and skip over the next one.
                retStr += c;
                ndx += 2;
			}
			else {
                // Skip it.  It was added by the HTML5 FileReader object.
                ndx++;
			}
        }
        else
        {
            retStr += c;
            ndx++;
        }
	}
    
    return retStr;
}

/**
 * This function finds the first occurrence of the character "c" and returns the remainder
 *  of the given string found after that character.
 *
 * @param {string} str - The string to inspect.
 * @param {string} c - The character to search for.
 *
 * @return {string} - Returns the trimmed content of the string that exists after the
 *  first occurrence of the given character to find.
 */
function returnRemainderAfterFirstCharOccurrence(str, c) {
    let errPrefix = '(returnRemainderAfterFirstCharOccurrence) ';
    var ndx = str.indexOf(c);
    
    if (!isNonEmptyString(str))
        throw new Error(errPrefix + 'The string is empty or is invalid.');
        
    if (!isNonEmptyString(c))
        throw new Error(errPrefix + 'The character to search for is empty or is invalid.');
    
    if (ndx < 0)
        throw new Error(errPrefix + 'Unable to find the desired character in the given string: ' + c);
        
    var retStr = str.substr(ndx + 1);
    
    return retStr.trim();
}

/**
 * This function returns TRUE if the checkbox with the given ID is checked, FALSE if not. It
 *  will throw an error if no DOM element exists with the given ID.
 *
 * @param {string} idOfCheckBox - The ID of the desired checkbox.
 *
 * @return {boolean}
 *
 */
function isCheckBoxChecked_jquery(idOfCheckBox) {
    let errPrefix = '(isCheckBoxChecked) ';
    
    if (!isNonEmptyString(idOfCheckBox))
        throw new Error(errPrefix + 'The ID of the desired checkbox is empty.');
        
    var idFull = '#' + idOfCheckBox;
    
    var aryElements = $(idFull);
    
    if (aryElements.length < 1)
        throw new Error(errPrefix + 'Unable to find a checkbox with the desired ID: ' + idFull);
        
    return $(idFull).is(':checked');
}

/**
 * This function returns TRUE if the given array actually does have an element
 *  at the location indicated by the given array key.
 *
 * @param {Array} ary - An array to inspect.
 * @param {string} idOfElem - The ID of the element to evaluate.
 *
 * @return {boolean} - Returns TRUE if there is an element in the array with the
 *  given ID (key).  Note, the element CAN be NULL.
 */

function isExistingArrayElement(ary, idOfElem) {
    let errPrefix = "(isExistingArrayElement) ";
    
    if (!Array.isArray(ary) || ary == null)
        throw new Error(errPrefix + 'The array parameter is not an array.');
        
    if (!isNonEmptyString(idOfElem))
        throw new Error(errPrefix + 'The element ID is empty.');
        
    // Can not use the "if (!elem)" test on boolean values because a value of
    //  of FALSE does NOT indicate that there is NO element with the provided
    //  ID.
    if (typeof ary[idOfElem] == 'boolean')
        // Element exists.
        return true;
        
    return (typeof ary[idOfElem] != 'undefined')
}

/**
 * Simple helper function to conform error objects that may also be plain strings
 * 	to a string error message.  Copied from misc_shared.js because we don't want
 * 	to use something browserify just yet.
 *
 * @param {Object|string|null} err - The error object, or error message, or NULL.
 *
 * @return {string} - Returns the err value itself if it's a string.  If err is
 *  an object and it has a 'message property, it will return the err.message
 *  property value.  Otherwise the default empty value is returned.
 */
function conformErrorObjectMsg(err)
{
	let errMsg = '(none)';
	
	if (typeof err == 'string')
		errMsg = err;
	else
	{
		if (err && err.hasOwnProperty('message'))
			errMsg = err.message;
		else
		    errMsg = 'Error object has no "message" property and is not a string.';
	}
	
	return errMsg;
}

/**
 * Performs a client side page redirect to the given URL.
 *
 * @param {string} url - The URL to redirect to.
 */
function redirectClientSide(url) {
	let errPrefix = '(redirectClientSide) ';
    
    if (!url || url.length < 1)
        throw new Error('The URL parameter is empty.');
        
    window.location.replace(url);
}

/**
 * Show a status message to the user.  For now this is an alert box.
 *
 * @param {string} message - The message to show the user.
 */
function showStatusMessageToUser(message) {
    if (!message || message.length < 1)
        throw new Error('The message parameter is empty.');
        
    alert(message);
}

/**
 * This function handles generic server responses and takes the appropriate action
 * 	depending on whether or not an error occurred.
 *
 * @param {Object} progressEvent - A progress event returned from an AJAX call,
 * 	expected to contain one of our server's standard error or success response
 * 	objects.
 *
 * @return {boolean} - Returns TRUE if the server response indicates a successful
 * 	operation, FALSE if an error occurred.
 */
function handleGenericServerResponse(progressEvent) {
	let errPrefix = '(handleGenericServerResponse) ';

	if (!progressEvent)
		throw new Error(errPrefix + 'The response from the server is unassigned.');
		
	let response = progressEvent.currentTarget.response;
	
	// Check for an error response object.
	if (response.is_error) {
		console.error(response.message);
		
		// Is the error shown to the user?
		if (response.is_error_shown_to_user)
			// Do so.
			showErrorToUser(response.message);
			
		return false;
	}
	else {
		// Success.  Show the response message to the user
		showStatusMessageToUser(response.message);
		
		return true;
	}
}

/**
 * Empty out an array, using the method that posts on Stack Overflow said is the fastest.
 *
 * @param {Array} ary - An array to wipe clean.
 */
function clearArray(ary) {
	let errPrefix = '(clearArray) ';
	
	if (!ary)
		throw new Error('The array parameter is unassigned.');
		
	if (!Array.isArray(ary))
		throw new Error('The value in the array parameter is not an array.');
	
	ary.length = 0;
}










