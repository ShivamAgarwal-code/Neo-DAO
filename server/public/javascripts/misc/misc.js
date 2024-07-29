// Some miscellaneous Javascript routines.

EnumMouseButtons = {
	left: 1,
	middle : 2,
	right : 3,
}

// Detect Chrome browser.
var g_isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

/**
 * Helper function to handle all cases of a variable being essentially empty.
 *  INCLUDING it containing nothing but whitespace.
 *
 * @param {string} str - The string to test.
 *
 * @return {boolean}
 */
function isEmptyString(str)
{
	return (typeof str == 'undefined' || str == null || str.trim().length < 1);
}


/**
 * Get the URL parameters passed to us and return an associative array made from them.
 *
 * @return {Array}
 */
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

/**
 * Trigger a bookmark operation if allowed by the current browser
 *  using the given URL, with the given title to be displayed in
 *  the browser Favorites list.  ONLY WORKS IN INTERNET EXPLORER!
 *
 * @param url
 * @param title
 */
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
 * Given an element that has a value property that may have text in it, select
 *  all the text.
 *
 * @param elemWithText - The element to inspect.
 */
function selectAllText(elemWithText)
{
	if (typeof elemWithText == 'undefined' || elemWithText == null)
		throw new Error("(selectAllText) The element with text parameter is unassigned.");

	// Is the user running mobile Safari?
	if (isMobileSafari())
		elemWithText.setSelectionRange(0, elemWithText.value.length);
	else
		elemWithText.select();
}

/**
 * This function returns true if the browser user agent property indicates the user is running
 *  the mobile Safari browser.
 *
 * @return {Boolean}
 */
function isMobileSafari() {
	var bIsUserAgentPresent = /(iPod|iPad|iPhone).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent);

	return bIsUserAgentPresent;
};

/**
 * Register Handlebars helpers for logical operators.
 *
 * @param {Object} handlebars - An instance of the handlebars library.
 *
 * Usage example in a JADE view, where a Javascript variable someValue is
 * 	tested to see if it iss greater than 0:
 *
 * {{ #if (gt someValue 0) }}
 * 		p someValue is greater than 0
 * {{ else }}
 * 		p someValue is not greater than 0
 * {{ /if }}
 */
function registerHandlebarsHelpers(handlebars)
{
	if (handlebars == null)
		throw new Error("(registerHandlebarHelpers) The Handlebars object is unassigne.d");

	handlebars.registerHelper('eq', function(a, b) {
		return (a === b);
	});
	handlebars.registerHelper('gt', function(a, b) {
		return (a > b);
	});
	handlebars.registerHelper('gte', function(a, b) {
		return (a >= b);
	});
	handlebars.registerHelper('lt', function(a, b) {
		return (a < b);
	});
	handlebars.registerHelper('lte', function(a, b) {
		return (a <= b);
	});
	handlebars.registerHelper('ne', function(a, b) {
		return (a !== b);
	});
}

/**
 * This function sets the top and left position of the DOM element with the
 * 	given ID to the top and left values given.  If top and/or left is not
 * 	given, then they default to 0.
 *
 *
 * @param {String} elementId - The uuid of the element to position.
 * @param {Number} [top] - The top coordinate value.
 * @param {Number} [left] - The left coordinate value.
 */
function setPositionOfDomElement(elementId, top, left)
{
	let errPrefix = '(setPositionOfDomElement) ';

	if (misc_shared_lib.isEmptySafeString(elementId))
		throw new Error(errPrefix + "The element ID is empty.");

	if (typeof top == 'undefined' || top == null)
		top = 0;

	if (typeof left == 'undefined' || left == null)
		left = 0;

	$('#' + elementId).css({'top' : top + 'px'});
	$('#' + elementId).css({'left' : left + 'px'});
}

/**
 * This function sets the top and left position of the DOM element with the
 * 	given ID to the top and left values given.  If top and/or left is not
 * 	given, then they default to 0.
 *
 * @param {String} overlayingElemId - The ID of the element to position.
 * @param {String} elemToOverlapId - The ID of the element we should
 * 	position the element over.
 * @param {Boolean} [bCenterIt] - If TRUE, then the overlay element will
 * 	be centered over the source element.  If FALSE, it will not.
 */
function setPositionOfDomElementOverElement(overlayingElemId, elemToOverlapId, bCenterIt=false)
{
	let errPrefix = '(setPositionOfDomElement) ';

	if (misc_shared_lib.isEmptySafeString(overlayingElemId))
		throw new Error(errPrefix + "The element ID is empty.");

	if (misc_shared_lib.isEmptySafeString(elemToOverlapId))
		throw new Error(errPrefix + "The ID of the element to overlap is empty.");

	if (typeof bCenterIt !== 'boolean')
		throw new Error(errPrefix + `The value in the bCenterIt parameter is not boolean.`);

	const jQuerySelector_overlaying_elem = '#' + overlayingElemId;

	if (!isValidJQuerySelector(jQuerySelector_overlaying_elem))
		throw new Error(errPrefix + `Invalid jQuery selector for the overlaying element: ${jQuerySelector_overlaying_elem}.`);

	const jQuerySelector_overlapped_elem = '#' + elemToOverlapId;

	if (!isValidJQuerySelector(jQuerySelector_overlapped_elem))
		throw new Error(errPrefix + `Invalid jQuery selector for the overlapped element: ${jQuerySelector_overlapped_elem}.`);

	let overlayTop = 0;
	let overlayLeft = 0;

	if (bCenterIt) {
		const overlayingElemHeight = $(jQuerySelector_overlaying_elem).height();
		const overlayingElemWidth = $(jQuerySelector_overlaying_elem).width();

		const overlappedElemHeight = $(jQuerySelector_overlapped_elem).height();
		const overlappedElemWidth = $(jQuerySelector_overlapped_elem).width();
		const overlappedElemTop = $(jQuerySelector_overlapped_elem).first().offset().top;
		const overlappedElemLeft = $(jQuerySelector_overlapped_elem).first().offset().left;

		let overlayTopOfs = (overlappedElemHeight - overlayingElemHeight) / 2;

		if (overlayTopOfs < 0)
			overlayTopOfs = 0;

		let overlayLeftOfs = (overlappedElemWidth - overlayingElemWidth) / 2;

		if (overlayLeftOfs < 0)
			overlayLeftOfs = 0;

		overlayTop = overlappedElemTop + overlayTopOfs;
		overlayLeft = overlappedElemLeft + overlayLeftOfs;
	} else {
		overlayTop = $(jQuerySelector_overlapped_elem).first().offset().top;
		overlayLeft = $(jQuerySelector_overlapped_elem).first().offset().left;
	}

	setPositionOfDomElement(overlayingElemId, overlayTop, overlayLeft);
}

/**
 * Using known CSS class names and class attribute manipulation, show a floating
 *  div.
 *
 * @param {String} idOfFloatingDivElem - The ID of the div that is the add bookmark mini-form.
 * @param {String|null} [elementToPositionAtId] - The element to position the add bookmark mini-form over.
 * 	Optional.
 * @param {Boolean} [bCenterIt] - If TRUE, then the overlay element will
 * 	be centered over the source element.  If FALSE, it will not.
 */
function showFloatingFormDiv(idOfFloatingDivElem, elementToPositionAtId, bCenterIt=false)
{
	const errPrefix = `(showFloatingFormDiv) `;

	if (typeof idOfFloatingDivElem == 'undefined' || idOfFloatingDivElem == null)
		throw new Error(`${errPrefix}The ID of the floating div element is unassigned.`);

	// If the ID of the element to position the mini-form is not empty, move the
	//  mini-form to overlap it.
	if (!misc_shared_lib.isEmptySafeString(elementToPositionAtId))
		setPositionOfDomElementOverElement(idOfFloatingDivElem, elementToPositionAtId, bCenterIt);

	// Show the floating form element div with the given ID.
	const jQuerySelector = `#${idOfFloatingDivElem}`;
	$(jQuerySelector).removeClass("hide-float-form-div");
	$(jQuerySelector).addClass("show-float-form-div");
}

/**
 * Using known CSS class names and class attribute manipulation, hide a floating
 *  div.
 *
 * @param {String} idOfFloatingDivElem - idOfFloatingDivElem
 */
function hideFloatingFormDiv(idOfFloatingDivElem)
{
	if (typeof idOfFloatingDivElem == 'undefined' || idOfFloatingDivElem == null)
		throw new Error("(hideFloatingFormDiv) The ID of the floating div element is unassigned.");

	const jQuerySelector = `#${idOfFloatingDivElem}`;

	// Hide the floating form element div with the given ID.
	$(jQuerySelector).removeClass("show-float-form-div");
	$(jQuerySelector).addClass("hide-float-form-div");
}

/**
 * Changes the caption of a button using jQuery.
 *
 * @param {String} buttonId - The DOM element ID of the button to change.
 * @param {String} newText - The new text to use for the button caption.
 */
function changeButtonText(buttonId, newText)
{
	let errPrefix = "(changeButtonText) ";

	if (misc_shared_lib.isEmptySafeString(buttonId))
		throw new Error(errPrefix + "The button ID is empty.");

	if (misc_shared_lib.isEmptySafeString(newText))
		newText = "";

	$('#' + buttonId).text(newText);
}

/**
 * Gets the current caption of a button using jQuery.
 *
 * @param {String} buttonId - The DOM element ID of the desired button.
 */
function getButtonText(buttonId)
{
	let errPrefix = "(getButtonText) ";

	if (misc_shared_lib.isEmptySafeString(buttonId))
		throw new Error(errPrefix + "The button ID is empty.");

	return $('#' + buttonId).text();
}

/**
 * Get a cookie value.
 *
 * @param {string} cookieName - The name of the cookie.
 *
 * @return {*}
 */
function getCookieValue(cookieName)
{
	var retVal = '';

	// If we are running in Chrome, then cookies will be in jStorage.
	if (g_isChrome)
		retVal = $.jStorage.get(cookieName)
	else {
		// If cookies are available, use them.  Otherwise, return NULL.
		if (typeof Cookies !== 'undefined' && Cookies !== null)
			// retVal = $.cookies.get(cookieName);
			retVal = Cookies.get(cookieName);
		else
			retVal = null;
	}

	if (retVal)
		// Remove any double-quotes added to the stored string value and undo
		//  the URI encoding.
		return removeDoubleQuotesAsBookends(decodeURIComponent(retVal));
	else
		// Convert to null.
		return null;
}

/**
 * Set a cookie.
 *
 * @param {string} cookieName - The cookie name.
 * @param cookieValue - The cookie value.
 */
function setCookieValue(cookieName, cookieValue)
{
	// Make the cookie value safe for storage.
	var encodedCookieValue = encodeURIComponent(cookieValue);

	if (g_isChrome)
		$.jStorage.set(cookieName, encodedCookieValue)
	else {
		// If cookies are available, use them.  Otherwise, don't.
		if (typeof Cookies !== 'undefined' && Cookies !== null)
			//  $.cookies.set(cookieName, encodedCookieValue);
			Cookies.set(cookieName, encodedCookieValue);
	}
}

/**
 * Little helper function to load a DOM element from a cookie variable with the same
 * 	name as the DOM element ID.
 *
 * @param {string} elemId - The ID of the DOM element to load.
 */
function loadDomElementToCookie(elemId) {
	let cookieVal = getCookieValue(elemId);
	$('#' + elemId).val(cookieVal);
}

/**
 * Little helper function to save a DOM element to a cookie variable with the same
 * 	name as the DOM element ID.
 *
 * @param {string} elemId - The ID of the DOM element to save.
 */
function saveDomElementToCookie(elemId) {
	setCookieValue(elemId, $('#' + elemId).val());
}


/**
 * Removes double-quotes that surround a string but only if they exist as a pair
 * 	at the very start and end of the string.  (i.e. - If there is a double-quote
 * 	at the start and only the start, or at the end and only the end, they will
 * 	NOT be removed).
 *
 * @param {String} str - The string to modify.
 * @return {String} Returns a string with any bookending double-quotes removed from it,
 * 	or the original string if they didn't exist.
 */
function removeDoubleQuotesAsBookends(str){
	var slen = str.length;
	var retStr = str;

	if (retStr.length >= 2)
	{
		if ( (retStr.charAt(0) == '"') && (retStr.charAt(slen - 1) == '"') )
		{
			if (slen == 2)
				// There is nothing left of the string after we remove the double-quotes.
				return '';

			return retStr.substring(1, slen - 1);
		}
	}

	return retStr;
}

/**
 * This method returns TRUE if the given Jquery selector returns at least one
 * 	DOM element, otherwise FALSE.
 *
 * @param selector - A jQuery select.
 *
 * @return {boolean} - TRUE if the selector selects at least one DOM element, FALSE
 * 	if it doesn't.
 */
function isValidJQuerySelector(selector)
{
	if (typeof selector == 'undefined' || selector == null || selector.length < 1)
		return false;
	return true;
}

/**
 * Copy the content of the element to the clipboard.
 *
 * @param {String} elemId - The ID of a valid element.
 * @param {Boolean} [bIsTextElement] - If TRUE, the content to copy
 * 	to the clipboard will be taken from the element's value
 * 	property, otherwise the innerHTML property will be used as the
 * 	source for the copy.  The default is TRUE.
 *
 * @return {String} - returns the content copied to the clipboard.
 */
function copyToClipboard(elemId, bIsTextElement) {
	let errPrefix = '(copyToClipboard) ';

	if (misc_shared_lib.isEmptySafeString(elemId))
		throw new Error(errPrefix + "The element ID parameter is empty.");

	if (!isValidJQuerySelector(elemId))
		throw new Error(errPrefix + "Invalid element ID, jQuery could not find any elements with this ID: " + elemId);

	// Default value for bIsTextElement
	if (typeof bIsTextElement != 'Boolean')
		bIsTextElement = true;

	// Add a hidden INPUT element to the document.
	var hiddenElem = document.createElement("input");

	// Get the inner HTML of the desired element and assign it to the "value" attribute
	//  of the hidden element.
	var theSrcContent = null;

	if (bIsTextElement)
		theSrcContent = document.getElementById(elemId).value;
	else
		theSrcContent = document.getElementById(elemId).innerHTML;

	hiddenElem.setAttribute("value", theSrcContent);

	// Now add the hidden element we created to the document body.
	document.body.appendChild(hiddenElem);

	// Select the content in our hidden element.
	hiddenElem.select();

	// Finally, copy that content into the clipboard.
	document.execCommand("copy");

	// Remove the hidden element from the document now that we're done.
	document.body.removeChild(hiddenElem);

	// Return the copied content.
	return theSrcContent;
}

/**
 * This method returns a promise that makes a client side XHR call using the
 * 	given parameters.
 *
 * @param {String} url - The URL to call.
 * @param {String} method - The send method, GET Or POST.
 * @params [String] paramsObj - Optional parameters string for POST requests.
 * @params {Object} [additionalHeadersAsObj] - Optional object with properties
 * 	for any additional headers required by the call.  Note, if provided
 * 	make sure you pass something for paramsObj parameter, even if it's
 * 	NULL, to preserver the parameter order!
 *
 * 	NOTE: If a parameters object is provided, the header to specify the content
 * 		type as JSON will be automatically added.
 *
 * @return {Promise<any>} - Returns a promise that executes the desired
 * 	XHR request.
 */
function xhrSend_promise(url, method, paramsObj, additionalHeadersAsObj) {
	return new Promise(function (resolve, reject) {
		let errPrefix = '(xhrSend_promise) ';

		let xhr = new XMLHttpRequest();

		// console.log(errPrefix + 'Making XHR request to: ' + url);

		xhr.open(method, url);

		let bContentTypeWasSet = false;

		if (method == 'GET')
		{
			// Nothing to do.
		}
		else if (method == 'POST')
		{
			//Send the proper header information along with the request
			xhr.setRequestHeader('Content-type', 'application/json');
			bContentTypeWasSet = true;
		}
		else
			throw new Error (errPrefix + 'Invalid send method: ' + method);

		// Do we have any additional headers?
		if (typeof additionalHeadersAsObj === 'object' && additionalHeadersAsObj !== null) {

			// Yes.
			for (let key in additionalHeadersAsObj) {
				// Make sure we don't add more than one content type header field.
				if (key.toLowerCase() == 'content-type')
					throw new Error(errPrefix + 'Content type header field specified, but the content type was already set.');

				xhr.setRequestHeader(key, additionalHeadersAsObj[key]);
			}
		}

		// For now, we assume a JSON object as the response type.
		xhr.responseType = "json";

		// Resolve the promise by making it the event handler for a successful
		//  XHR request.
		xhr.onload = resolve;

		// Reject the promise by making it the event handler for an unsuccessful
		//  XHR request.
		xhr.onerror = reject;

		// Make the request.
		if (isEmptyString(paramsObj))
			xhr.send();
		else
			xhr.send(paramsObj);
	});
}

/**
 * This method returns a promise that makes a client side XHR GET request using the
 * 	given parameters.
 *
 * @param {String} url - The URL to call.
 *
 * @params {Object} [additionalHeadersAsObj] - Optional object with properties
 * 	for any additional headers required by the call.
 *
 * @return {Promise<any>} - Returns a promise that executes the desired
 * 	XHR GET request.
 */
function xhrGet_promise(url, additionalHeadersAsObj) {
	return xhrSend_promise(url, 'GET', null, additionalHeadersAsObj);
}

/**
 * This method returns a promise that makes a client side XHR POST request using the
 * 	given parameters.
 *
 * @param {String} url - The URL to call.
 * @param {null|Object} [postDataObj] - Optional object to send as the post data.
 * @params {null|Object} [additionalHeadersAsObj] - Optional object with properties
 * 	for any additional headers required by the call.  Note, if provided
 * 	make sure you pass something for paramsObj parameter, even if it's
 * 	NULL, to preserver the parameter order!
 *
 * @return {Promise<any>} - Returns a promise that executes the desired
 * 	XHR POST request.
 */
function xhrPost_promise(url, postDataObj=null, additionalHeadersAsObj=null) {
	if (postDataObj) {
		let params = JSON.stringify(postDataObj);

		return xhrSend_promise(url, 'POST', params, additionalHeadersAsObj);
	}
	else
		// No parameters object.  Pass NULL for it so that the additional headers
		//  parameter is in the right place.
		return xhrSend_promise(url, 'POST', null, additionalHeadersAsObj);
}

/**
 * This function disables a button.
 *
 * @param jquerySelector - The jQuery selector that defines what buttons to affect.
 */
function disableButton(jquerySelector)
{
	let errPrefix = '(disableButton) ';

	if (!jquerySelector)
		throw new Error(errPrefix + 'The jQuery selector is unassigned.');

	jquerySelector.prop('disabled', true);
}

/**
 * This function enables a button.
 *
 * @param jquerySelector - The jQuery selector that defines what buttons to affect.
 */
function enableButton(jquerySelector)
{
	let errPrefix = '(enableButton) ';

	if (!jquerySelector)
		throw new Error(errPrefix + 'The jQuery selector is unassigned.');

	jquerySelector.prop('disabled', false);
}

/**
 * This method can be used with our server API calls that return a standardized error/success
 * 	object.
 *
 * @param {string} operationDesc - A short description of the operation.
 * @param {Object} serverResult - The result object returned by the server to the client.
 * @param {Function} [funcDisplayErrorMessage] - Optional function you can pass to this
 * 	method that will be called instead of calling the alert() function when displaying
 * 	error messages that the server has indicated as user actionable, to the user.
 *
 * @return {boolean} - Returns TRUE if the server result indicated an error occurred, FALSE
 * 	if not (i.e. - SUCCESS).  If the server indicated that the error message should be
 * 	shown to the user, then that will be done.
 */
function checkServerReturnForError(operationDesc, serverResult, funcDisplayErrorMessage=null) {
	let errPrefix = '(checkServerReturnForError) ';

	if (!serverResult)
		throw new Error(errPrefix + 'The server result object is unassigned.');

	if (!serverResult.message || serverResult.message.length < 1)
		throw new Error(errPrefix + 'The server result is missing the message field.');

	if (typeof serverResult.is_error !== 'boolean')
		throw new Error(errPrefix + 'The server result is missing the is_error field.');

	if (typeof serverResult.is_error_shown_to_user !== 'boolean')
		throw new Error(errPrefix + 'The server result is missing the is_error_shown_to_user field.');

	// If we were given a user defined error display function, then validate it.
	if (funcDisplayErrorMessage) {
		if (typeof funcDisplayErrorMessage != 'function')
			throw new Error(errPrefix + 'A value was provided for the user defined error function parameter, but the value is not a valid function.');
	}

	if (serverResult.is_error) {
		console.error(serverResult.message);

		// Is the server telling us to show this error message to the user?
		if (serverResult.is_error_shown_to_user === true) {
			// Yes.  Do so.  Were we given a user defined display function for the error message?
			if (funcDisplayErrorMessage)
				// Yes.  Use it.
				funcDisplayErrorMessage(serverResult.message);
			else
				// No.  Just use the alert() function.
				alert(serverResult.message);
		}
	}

	return serverResult.is_error;
}

/**
 * Compare function for sorting the quiz summaries array by the quiz name field.
 */
function compareQuizSummaries(quizSum_1, quizSum_2) {
	if (quizSum_1.quiz_name == quizSum_2.quiz_name)
		return 0;
	if (quizSum_1.quiz_name < quizSum_2.quiz_name)
		return -1;
	return 1;
}

/**
 * Sorts a quiz summaries array by quiz name.  The sort is "in-place",
 * that is, it changes the order of the array elements.
 *
 */
function sortQuizSummariesArrayByQuizName(aryQuizSummaries) {
	let errPrefix = '(sortQuizSummariesArrayByQuizName) ';

	if (!Array.isArray(aryQuizSummaries))
		throw new Error(errPrefix + 'The aryQuizSummaries parameter value is not an array.');

	aryQuizSummaries.sort(compareQuizSummaries);
}

