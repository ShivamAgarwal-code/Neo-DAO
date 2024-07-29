/**
 * This file contains common code that is shared between the server and client code.
 */

// The number of milliseconds in a day.
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
 
// ---------------- BEGIN:  GOOGLE CLOSURE CLONED CODE -------------

// The functions below were extracted from the Google Closure library,
//  which is included in this project.  See it's license file for details.

/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 *
 * WARNING!!: Only use this function on a server you control (trusted site).
 * 	See the notes on goog.TRUSTED_SITE for details.
 */
function nowDateTime()
{
	if (Date.now)
		return Date.now();
		
	 // Unary plus operator converts its operand to a number which in
	 // the case of a date is done by calling getTime().
	 return + new Date();
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
function getRandomString() {
  const x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
		 Math.abs(Math.floor(Math.random() * x) ^ nowDateTime()).toString(36);
};

/**
 * (author: Robert Oschler)
 *
 * This method quadruples up on the Google Closure getRandomString() method to
 * 	create a longer unique ID since the random strings returned by that function
 * 	are quite short.
 *
 * TODO: WARNING - switch over to a browserified version of the UUID Node.js
 * 	package when there is time!  That library creates a better unique ID
 * 	then this function.
 */
function getSimplifiedUuid()
{
	// console.warn('Using simplified version of unique ID creation function.');
	
	return getRandomString() + getRandomString() + getRandomString() + getRandomString();
}

/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
function makeStringSafe(obj) {
	if (typeof obj == 'undefined' || obj == null)
		return '';
		
	return String(obj);
}

/**
 * Checks if a string is empty or contains only whitespaces.
 *
 * @param {*} varToCheck - The variable to inspect.
 *
 * @return {boolean} - Returns TRUE if the given variable is
 *  not a string, empty, unassigned, or whitespace only.
 */
function isEmptyOrWhitespaceString(varToCheck) {
	if (typeof varToCheck !== 'string')
		return true;
	if (varToCheck === null || typeof varToCheck === 'undefined')
		return true;
	return /^[\s\xa0]*$/.test(varToCheck);
}

/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} Whether {@code str} is null, undefined, empty, or
 *     whitespace only.
 */
function isEmptySafeString (str) {
	return isEmptyOrWhitespaceString(makeStringSafe(str));
}

// ---------------- BEGIN:  GOOGLE CLOSURE CLONED CODE -------------

/**
 * Given a field value that is supposed to be a numeric value, make sure it is
 * 	and if it's not, show an error message to the user.
 *
 * @param fieldValue - The value to inspect.
 *
 * @param errPrompt - The error message to use if an error is thrown.
 *
 * @return {Number|null} - Returns the value as a number if it can be interpreted as one,
 * 	otherwise an error will be thrown using the given error prompt.
 */
function checkFieldForNumber(fieldValue, errPrompt)
{
	let errPrefix = '(' + arguments.callee.name + ') ';

	if (typeof fieldValue == 'undefined' || fieldValue == null)
		throw new Error(errPrefix + 'The field value parameter is unassigned.');

	if (isEmptySafeString(errPrompt))
		throw new Error(errPrefix + "The error prompt is empty.");

	if (typeof fieldValue == 'number')
		return fieldValue;
		
	try
	{
		var theNumber = parseFloat(fieldValue);
		
		// Check for NaN
		if (isNaN(theNumber))
			throw new Error(errPrefix + 'The field value is not a number.');
			
		return theNumber;
	}
	catch(err)
	{
		// Not a number.  Throw an error.
		throw new Error(errPrompt);
	}
	
	console.error(errPrefix + 'We should never reach this code location.');
}

/**
 * This method takes a JSON string, parses it into an object that is the same type as
 * 	the object of type passed in the objOfType parameter.  The newly created object is
 * 	then validate and returned.
 *
 * @param {String} strJson - The PlayerDetails object in JSON format.
 * @param objOfType - The type name of the object to create.  It must have a parameterless
 * 	constructor.
 *
 * @return {Object} - A new validated object of the same type as the objOfType parameter.
 */
function parseJsonStringToObjectOfType (strJson, objOfType)
{
	let errPrefix = '(parseJsonStringToObjectOfType) ';
	
	try {
		if (isEmptySafeString(strJson))
			throw new Error(errPrefix + 'The JSON string is empty.');
			
		if (typeof objOfType == 'undefined' || objOfType ==  null)
			throw new Error(errPrefix + 'The object of type parameter is unassigned.');
			
		var obj = JSON.parse(strJson);
		
		var newObjOfType = new objOfType();
		
		// Convert the plain Javascript object to a Game Details object.
		for (var prop in obj)
			newObjOfType[prop] = obj[prop];
		
		return newObjOfType;
	}
	catch(err)
	{
		// Most errors are due to constructor of the target object type throwing and
		//  error.
		let typeName = objOfType.name;
		let errMsg = errPrefix + 'Parse failed.  Did the target type constructor throw an error?: ' + typeName;
		
		errMsg += '\n Exception details: ' + err.message;
		
		throw new Error(errMsg);
	}
}

/**
 * Add a myPadLeft method to the String class that pads a string with a given pad value, but
 *  only if it is needed.
 *
 * @param {String} padValue - The value to prepend to the source string.  E.g. - "00" for time values.
 *
 * @return {string} - The modified string.
 */
String.prototype.myPadLeft = function(padValue) {
	if (typeof padValue == 'undefined' || padValue == null)
		throw new Error('(padLeft) The pad value is unassigned.');
		
	// Prefix enough of the pad value to the source string to meet
	//  the length of the pad value (if needed).
	return String(padValue + this).slice(-padValue.length);
}

/**
 * Converts a raw seconds value into a HH:MM:ss string.
 *
 * @param {Number} secondsRaw - The seconds count.
 *
 * @return {String} - The seconds value converted to a HH:MM:ss formatted string.
 */
function secondsToHoursMinutesSecondsString(secondsRaw)
{
	let errPrefix = '(secondsToHoursMinutesSecondsString) ';
	
	if (typeof secondsRaw == 'undefined' || secondsRaw == null)
		throw new Error (errPrefix + 'The raw seconds parameter is unassigned.');
	
	// Force the seconds parameter value to an integer.
	let seconds = parseInt(secondsRaw, 10);

	// Calculate the number of days.
	let days = Math.floor(seconds / (3600*24));
	seconds  -= days * 3600 * 24;
	
	// Calculate the number of days.
	let hours   = Math.floor(seconds / 3600);
	seconds  -= hours * 3600;
	
	// Calculate the number of days.
	let minutes = Math.floor(seconds / 60);
	seconds  -= minutes * 60;
	
	// Build full time string and return it.
	let padValue = "00";
	
	let retStr =
		hours.toString().myPadLeft(padValue)
		+ ':'
		+ minutes.toString().myPadLeft(padValue)
		+ ':'
		+ seconds.toString().myPadLeft(padValue);
		
	return retStr;
}

/**
 * This method returns TRUE if the strOrBool parameter is equal to boolean TRUE
 * 	or a string that can be converted to TRUE.
 *
 * @param strOrBool - The value to inspect.
 *
 * @return {boolean}
 */
function isTrueOrStrTrue(strOrBool)
{
	if (typeof strOrBool == 'undefined' || strOrBool == null)
		return false;
		
	if (typeof strOrBool == 'boolean' && strOrBool == true)
		return true;

	if (typeof strOrBool == 'string' && strOrBool.toLowerCase() == "true")
		return true;
		
	return false;
}

/**
 * This method returns FALSE if the strOrBool parameter is equal to boolean FALSE
 * 	or a string that can be converted to FALSE.
 *
 * @param strOrBool - The value to inspect.
 *
 * @return {boolean}
 */
function isFalseOrStrFalse(strOrBool)
{
	if (typeof strOrBool == 'undefined' || strOrBool == null)
		return false;
		
	if (typeof strOrBool == 'boolean' && strOrBool == false)
		return true;

	if (typeof strOrBool == 'string' && strOrBool.toLowerCase() == "false")
		return true;
		
	return false;
}

/**
 * This method tries to parse the given string as a number.
 *
 * @param {string} intAsStr - A string that allegedly contains a number.
 *
 * @return {number|null} - Returns an integer if the string contains a
 * 	valid integer, or NULL if it does not.
 */
function parseIntOrNull(intAsStr) {
	let retValue = null;
    
    if (!isEmptySafeString(intAsStr))
            retValue = parseInt(intAsStr);

	return retValue;
}

/**
 * Simple helper function to conform error objects that may also be plain strings
 * 	to a string error message.
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
 * Builds an error prefix using the given function's caller and it's name as
 * 	found in the arguments.callee.name parameter at the time it called us.
 *
 * @param {Function} func - A function.
 * @param {string} argumentsCalleeName - The arguments.callee.name value.
 *
 * @return {string}
 */
function buildErrPrefixFromCalleeAndCaller(func, argumentsCalleeName) {
	let errPrefix = '(buildErrPrefixFromCalleeAndCaller) ';
	
	if (!func)
		throw new Error(errPrefix + 'The function given as the input parameter is unassigned.');
		
	if (isEmptySafeString(argumentsCalleeName))
		throw new Error(errPrefix + 'The arguments callee name is empty.');
		
	return '(' + func.caller + '::' + argumentsCalleeName + ') ';
}

/**
 * Use this construct to wrap promises intended for use with Promise.all()
 * 	so that Promise.all() does not fail fast (i.e. - fail immediately when
 * 	ANY promise fails).  Instead, you can iterate the values array returned
 * 	by Promise.all() and see the result of all the promises.
 *
 * If the wrapped promise succeeded the "error" property of the result object
 * 	will be FALSE and the result object will be returned.  If promise was
 * 	rejected the "error" property will be TRUE and the Error object
 * 	caught by the promise's catch block will be returned.  Use the
 * 	"instanceof Error" to make sure the error object is indeed an Error
 * 	object in the case of an error.
 *
 * @param {Promise} promiseToWrap
 *
 * @return {Promise<T | {error: boolean, err: Error}>}
 */
const toResultWrapperObject = (promiseToWrap) =>
{
	return new Promise(function(resolve, reject) {
		promiseToWrap
		.then(result => {
			let retObj = { error: false, resultObj: result };
			resolve(retObj);
		})
		.catch(err => {
			let retObj = { error: true, errorObj: err };
			resolve(retObj);
		});
	});
}

/**
 * This function takes an array of promises, decorates them with toResultWrapperObject,
 * 	and executes the decorated promises with Promise.all().  This fixes the
 * 	"fail-fast" problem with Promise.all().  See the notes on toResultWrapperObject.
 *
 *
 * @param {Array} aryPromises - An array of promises to execute.
 *
 * @return {Promise<any>}
 */
function promiseAllWithResultObjects_promise(aryPromises) {
	return new Promise(function(resolve, reject) {
		try {
			let errPrefix = '(promiseAllWithResultObjects) ';
			
			if (!Array.isArray(aryPromises))
				throw new Error(errPrefix + 'The array of promises is not an array.');
				
			if (aryPromises.length < 1)
				throw new Error(errPrefix + 'The array of promises is empty.');
				
			return Promise.all(aryPromises.map(toResultWrapperObject))
			.then(aryValues => {
				// Resolve the promise with the values array.
				resolve(aryValues);
			})
			// Decorate all the promises with toResultWrapperObject and pass that decorated
			//  array to Promise.all().
			.catch(err =>
			{
				reject(conformErrorObjectMsg(err));
			});
		}
		catch(err)
		{
			reject(conformErrorObjectMsg(err));
		}
	});
}

/**
 * This is a utility object that is returned by a Promise THEN block when
 * 	it wants to tell the next THEN block in a promise chain NOT to validate
 * 	the result of the previous block because the block was basically skipped.
 *
 * @constructor
 */
function PromiseThenBlockSkippedResult() {
	// This object's is the content itself.
}

/**
 * Simple function that returns TRUE if the "process" variable has been globally
 * 	defined and is not NULL, otherwise FALSE is returned.
 *
 * @return {boolean}
 */
function isProcessGlobalVarPresent() {
	if (typeof process == 'undefined' || process == null)
		return false;
	return true;
}

/**
 * This promise waits the specified number of milliseconds before resolving.
 *
 * @param {number} delayMs - The number of milliseconds to wait.
 */
function delayMS_promise(delayMs) {
	let errPrefix = '(delayMS_promise) ';
	
	if (!delayMs || delayMs < 100)
		throw new Error(errPrefix + 'The delay in milliseconds parameter is invalid.');
	
	return function(dummy) {
		return new Promise(resolve => setTimeout(() => resolve(dummy), delayMs));
	};
}

/**
 * Converts a Buffer object to an array of bytes32.
 *
 * @param {Buffer} buf - A buffer object to convert.
 * @return {Array<byte>}
 */
function bufferToByteArray(buf) {
	let methodName = 'bufferToByteArray';
	let errPrefix = '(' + methodName + ') ';
	
	if (!(buf instanceof Buffer))
		throw new Error(errPrefix + 'The input parameter buf does not contain a Buffer object.');
		
	let aryBytes = new Array();
	
	for (let i = 0; i < buf.length; i++)
		aryBytes.push(buf[i]);
		
	return aryBytes;
}


/**
 * This function pulls out the value of a property with the given name from the given
 * 	object.
 *
 * @param {Object} obj - An object returned by a Web3 method call.
 * @param {string} propName - The name of the desired property.
 *
 * @return {*} - Returns the value of the property that has the given property name
 * 	from the object.
 */
function extractPropertyFromObj(obj, propName) {
	let methodName = 'extractPropertyFromObj';
	let errPrefix = '(' + methodName + ') ';
	
	if (!obj)
		throw new Error(errPrefix + 'The obj parameter is invalid.');
	
	if (isEmptySafeString(propName))
		throw new Error(errPrefix + 'The propName parameter is empty.');
		
	if (!obj.hasOwnProperty(propName))
		throw new Error(errPrefix + 'The object does not have a property named: ' + propName);
		
	return obj[propName];
}

/**
 * Given an object an a property name, return the value of the desired property or throw
 * 	an error if the object does not have an object with the given name.
 *
 * @param {Object} obj - The object to inspect.
 * @param {string} propName - The name of the desired property.
 * @param {string{ [errPrefix] - The error prefix to use if an error is thrown.
 * 	Optional parameter.  If not given the name of this function will be used for
 * 	the error prefix.
 *
 * @return {*} - Returns the value of the given property or throws an error the object
 * 	has no property with the given name.
 *
 * WARNING: This function will NOT work objects that do not inherit from the Javascript
 * 	Object prototype (e.g. - like the Express request object).
 */
function hasOwnPropertyOrError(obj, propName, errPrefix = null) {
	if (!errPrefix)
		errPrefix = '(hasOwnPropertyOrError) ';
	
	if (typeof obj != 'object')
		throw new Error(errPrefix + 'The value in the  parameter is not an object.');
	
	if (isEmptySafeString(propName))
		throw new Error(errPrefix + 'The propName parameter is empty.');
		
	if (!obj.hasOwnProperty(propName))
		throw new Error(errPrefix + 'The object given does not have a property named: ' + propName);
		
	return obj[propName];
}

/**
 * Given an alleged object.  This function return it's constructor name if it has one.  Otherwise
 * 	returns NULL.
 *
 * @param {Object} obj - The object whose constructor name is desired.
 *
 * @return {string|null}
 */
function getConstructorName(obj) {
	let errPrefix = '(getConstructorName) ';
	
	if (typeof obj === 'undefined' || obj == null)
		throw new Error(errPrefix + 'The obj parameter is NULL or undefined.');
	
	let retName = null;
	
	if (typeof obj === 'object') {
		// For some reason neither the instance base or static version of hasOwnProperty() works with
		//	the "constructor" as a property name.  Check its type instead.
		if (typeof obj.constructor === 'function') {
			// Can't use hasOwnProperty() because obj.constructor does not inherit from type Objec.t
			//	Use the static version of that method.
			if (Object.prototype.hasOwnProperty.call(obj.constructor, 'name'))
				retName = obj.constructor.name;
		}
	}

	return retName;
}

/**
 * Simple attempt at returning the type of object along with the ones 'typeof' handles.
 *
 * @param objOrOther - An object or some other type.
 *
 * @return {*} - Returns the type of the object if it is not to complex of an object, except
 * 	for undefined or NULL values.  In that case, 'undefined' and 'null' are returned
 * 	respectively.
 */
function myTypeDetect(objOrOther) {
	let errPrefix = '(myTypeDetect) ';

	if (typeof objOrOther === 'undefined')
		return 'undefined';
	else if (objOrOther === null)
		return 'null';
	else if (typeof objOrOther === 'function')
		return 'function';
	else if (typeof objOrOther === 'string')
		return 'string';
	else if (Array.isArray(objOrOther))
		return 'array';
	else if (Number.isInteger(objOrOther))
		return 'integer';
	else if (typeof objOrOther === 'number')
		return('number');
	else {
		// Object type test.
		return getConstructorName(objOrOther);
	}
}

/**
 * This function searches an object for a property that has that value and
 * 	returns the first property name it finds with that value, or NULL if
 * 	none could be found.
 *
 * @param {Object} obj - The object to inspect.
 * @param value - The value to search for.
 *
 * @return {*}
 */
function objectValueToKey(obj, value) {
	let errPrefix = '(objectValueToKey) ';
	
	if (typeof obj != 'object')
		throw new Error(errPrefix + 'The object parameter is not an object.');
		
	if (typeof value == 'undefined')
		throw new Error(errPrefix + 'The value parameter is undefined.');
	
	// See if EnumDialogActions has the given actions for dialog label as a value.
	for (let propKey in obj)
	{
		if (obj[propKey] == value)
			return propKey;
	}
	
	return null;
}

/**
 * This function is used to return the label in an string enum that is associated
 * 	with the given value.
 *
 * @param {Object} enumObj - The enum of strings to search through for the given
 * 	string value.
 *
 * @param {string} strEnumValue - The string value to search for.
 *
 * @return {string|null} - Returns the property name of the property that
 * 	contains the given value, or NULL if there is no property in the given
 * 	object with the desired name.
 */
function enumOfStringValueToKey(enumObj, strEnumValue) {
	let errPrefix = '(enumOfStringValueToKey) ';
	
	if (typeof enumObj != 'object')
		throw new Error(errPrefix + 'The enum object parameter is not an object.');
		
	if (typeof strEnumValue != 'string')
		throw new Error(errPrefix + 'The enum string value parameter is not a string.');
		
	return objectValueToKey(enumObj, strEnumValue);
}

/**
 * This function is used to return the label in an string enum that is associated
 * 	with the given value.
 *
 * @param {Object} enumObj - The enum of strings to search through for the given
 * 	string value.
 *
 * @param {string} strEnumValue - The string value to search for.
 *
 * @return {boolean} - Returns TRUE if the given string value is one of the values
 * 	contained in the enum object.  Otherwise FALSE is returned.
 */
function isValidEnumValue(enumObj, strEnumValue) {
	let errPrefix = '(isValidEnumValue) ';
	
	let testKey = enumOfStringValueToKey(enumObj, strEnumValue);
	
	return (testKey !== null)
}

/**
 * This function returns TRUE if and only if the given object is not NULL or
 * 	'undefined', is not NULL, and is of type 'object'.  Anything else returns
 * 	FALSE
 *
 * @param obj - The alleged object to inspect.
 *
 * @return {boolean}
 */
function isNonNullObjectAndNotArray(obj) {
	let errPrefix = '(isNonNullObjectAndNotArray) ';
	
	if (typeof obj === 'undefined' || obj == null)
		return false;
		
	if (Array.isArray(obj))
		return false;
		
	return (typeof obj === 'object');
}

/**
 * This empty object is passed by code that needs to construct an object that normally
 * 	takes parameters in its constructor, without those parameters being available.  In
 * 	other words, it needs the object turn off all constructor parameter checks temporarily.
 * 	This is used frequently by code that reconstitutes objects from storage, etc.
 *
 * @constructor
 */
function ReconstituteConstructorNeeded() {

}

/**
 * Simple function to count the number of properties in an object or an associative
 * 	array.
 *
 * @param {Object} obj - The object or associative array whose properties should be counted.
 *
 * @return {number} - The numbe of properties in the object or associative array.
 */
function countObjectProperties(obj) {
	let errPrefix = '(countObjectProperties) ';
	
	if (typeof obj !== 'object')
		throw new Error(errPrefix + 'The object parameter does not contain an object.');
		
	if (obj === null)
		return 0;
	
	return Object.keys(obj).length;
}

/**
 * This function returns TRUE if we are running in the context of Node.JS, FALSE if not.
 *
 * @return {boolean}
 */
function isNodeJsEnvironment() {
	return (typeof process !== 'undefined') &&
		(process.release.name.search(/node|io.js/) !== -1);
}

/**
 * Helper function that checks if an item is defined and not NULL.
 *
 * @param item - The item to test.
 * @returns {boolean}
 */
function isDefinedAndNotNull(item)
{
    return (typeof item != 'undefined' && item != null);
}

/**
 * Transfer the properties from one object to the other.
 *
 * @param {Object} srcObj - The source object.
 * @param {Object} destObj - The destination object
 */
function transferObjProperties(srcObj, destObj) {
	let errPrefix = '(transferObjProperties) ';
	
	if (!isNonNullObjectAndNotArray(srcObj))
		throw new Error(errPrefix + 'The srcObj is invalid.');
	
	if (!isNonNullObjectAndNotArray(destObj))
		throw new Error(errPrefix + 'The destObj is invalid.');
		
	for (let key in srcObj)
		destObj[key] = srcObj[key];
}

/**
 * This function takes an array of elements and makes sure there is
 * 	exactly one element of the array and that it is of the
 * 	specified object type.
 *
 * @param {string} caller - A string that describes the one that
 * 	called this method, used for error messages.
 * @param {Array} aryElements - The source array.
 * @param {string} mustBeInstanceOf - The name of the object type the lone
 * 	arra element must be an instance of.
 *
 * @return {Object|null} - Returns the sole element that is of the specified
 * 	object type if one exists, NULL if the array is empty, or throws an
 * 	error otherwise.  NOTE: Duplicate elements are considered an error.
 */
function arrayToExclusiveObjectOfInstance(caller, aryElements, mustBeInstanceOf) {
	let errPrefix = '(isArrayExclusiveElement) ';
	
	if (isEmptySafeString(caller))
		throw new Error(errPrefix + 'The caller parameter is empty.');
		
	// TODO: contest hack. Having mustBeInstanceOf in the error prefix
	//	will spit out a ton of code instead of the object name.
	//	the ".constructor.name" technique doesn't work.  Fix this later.
	// errPrefix = caller + ' - ' + mustBeInstanceOf + ' objects check, ';
	errPrefix = caller + ' - "instanceof" objects check, ';
	
	// Must be an array.
	if (!Array.isArray(aryElements))
		throw new Error(errPrefix + 'Not an array.');

	// Empty array.  Return NULL.
	if (aryElements.length < 1)
		return null;
		
	// There should only be exactly one element.
	if (aryElements.length > 1)
		throw new Error(errPrefix + 'Duplicate elements.');

	// Must be an instance of the given object type.
	if (!(aryElements[0] instanceof mustBeInstanceOf))
		throw new Error(errPrefix + 'Not an instance of: ' + mustBeInstanceOf);
		
	// Return the validated array's first object.
	return aryElements[0];
}


/**
 * Given an array of NVP elements, get the value of the element with the
 * 	given field name.
 *
 * @param {Array<Object>} aryNvpElements - The array of NVP elements.
 * @param {string} fldName - The name of the desired NVP element.
 * @param {boolean} bErrorIfNotFound - If TRUE, then if no array element is
 * 	found with the given field name, an error will be thrown. Otherwise
 * 	NULL will be returned.
 *
 * @return {*|null} - Returns the value belonging to the NVP element with
 * 	the given field name if found.  If not found, then if bErrorIfNotFound
 * 	is TRUE an error will be thrown, if bErrorIfNotFound is FALSE, then
 * 	null will be returned.
 */
function nvpGetFieldInArray(aryNvpElements, fldName, bErrorIfNotFound = false) {
	let errPrefix = '(nvpGetFieldInArray) ';
	
	if (!Array.isArray(aryNvpElements))
		throw new Error(errPrefix + 'The aryNvpElements parameter value is not an array.');
	
	if (isEmptySafeString(fldName))
		throw new Error(errPrefix + 'The fldName parameter is empty.');

	if (typeof bErrorIfNotFound !== 'boolean')
		throw new Error(errPrefix + 'The value in the bErrorIfNotFound parameter is not boolean.');
	
	for (let ndx = 0; ndx < aryNvpElements.length; ndx++)
	{
		if (aryNvpElements[ndx].name == fldName)
			return aryNvpElements[ndx].value;
	}
	
	// Could not find an NVP element with the given name.
	if (bErrorIfNotFound)
		throw new Error(errPrefix + 'No element exists with field name: ' + fldName);
		
	return null;
}

/**
 * Given an array of NVP elements, set the element with fldName to
 * 	fldValue.  If no such element exists, create one with the
 * 	given field name and value.
 *
 * @param {Array<Object>} aryNvpElements - The array of NVP elements.
 * @param {string} fldName - The name of the desired NVP element.
 * @param {*} fldValue - The value to set the desired NVP element's
 * 	field value field to.
 */
function nvpSetFieldInArrayToValue(aryNvpElements, fldName, fldValue) {
	let errPrefix = '(nvpSetFieldInArrayToValue) ';
	let bIsPropFound = false;
	
	if (!Array.isArray(aryNvpElements))
		throw new Error(errPrefix + 'The aryNvpElements parameter value is not an array.');
	
	if (isEmptySafeString(fldName))
		throw new Error(errPrefix + 'The fldName parameter is empty.');
		
	if (typeof fldValue === 'undefined')
		throw new Error(errPrefix + 'The fldValue parameter is "undefined".  NULL is OK, "undefined" is not.');
	
	if (aryNvpElements && aryNvpElements.length > 0) {
		// Find the NVP element with the given name.
		for (let ndx = 0; ndx < aryNvpElements.length; ndx++) {
			let nvp = aryNvpElements[ndx];
			
			if (nvp.name == fldName) {
				// Set it to the given field value.
				nvp.value = fldValue;
				bIsPropFound = true;
				break;
			}
		}
	}
	
	if (!bIsPropFound) {
		// If the matching NVP element was not found then create a new element.
		aryNvpElements.push({ name: fldName, value: fldValue });
	}
}

/**
 * This function tries to parse the value in strNum as an integer.
 *
 * @param {string} strNum - The string to parse.
 *
 * @return {number|null}
 */
function tryParseInt(strNum) {
     let retValue = null;
     
     if (typeof strNum !== 'string')
     	throw new Error(errPrefix + 'The value in the strNum parameter is not string.');
     
     if (strNum != null && strNum.length > 0) {
		 if (!isNaN(strNum))
			 retValue = parseInt(strNum);
     }
     
     return retValue;
}

/**
 * Given a PIN code in string or number form, convert it to a string
 * 	and pad it with leading zeroes.
 *
 * @param {string|number} pinCodeIN - The PIN code to left pad with zereos.
 *
 * @return {string} - The PIN code padded with leading zeroes, if they were
 * 	required.  Otherwise, the PIN code is returned as the same value, but
 * 	in string format regardless of its original format.
 */
function padFourDigitNumericPinCode(pinCodeIN) {
	let errPrefix = '(padFourDigitPinCode) ';
	
	let pinCodeAsNum = pinCodeIN;
	
	// The PIN code given must be a number OR a non-empty string.  If
	//	it is a string, we try to parse it as a number.
	if (typeof pinCodeIN === 'string') {
		if (isEmptySafeString(pinCodeIN))
			throw new Error(errPrefix + 'The pinCodeIN parameter is empty.');
			
		let pinCodeConv = tryParseInt(pinCodeIN);
		
		if (pinCodeConv === null)
			throw new Error(errPrefix + 'The pinCodeIN parameter can not be converted to a number: ' + pinCodeIN);
			
		pinCodeAsNum = pinCodeConv;
	}

	// Range check.
	if (pinCodeAsNum < 0)
		throw new Error(errPrefix + 'The PIN code is negative: ' + pinCodeAsNum);
	if (pinCodeAsNum > 9999)
		throw new Error(errPrefix + 'The PIN code is greater than 9999: ' + pinCodeAsNum);
	
	let maxSize = 4;
	let strPadNum = "000000000" + pinCodeAsNum;
	let strPrimaryPinCode = strPadNum.substr(strPadNum.length - maxSize);
	
	if (strPrimaryPinCode.length > maxSize)
		throw new Error(errPrefix + 'The padded PIN code is longer than 4 digits.');
    
    return strPrimaryPinCode;
}

/**
 * Generate a validation 4-digit PIN code by randomly generating an integer
 * 	between 0 and 9999.
 *
 * @return {string} - Returns a string containing only numbers that is
 * 	of length 4.
 *
 */
function generateValidationPinCode() {
	let errPrefix = '(generateValidationPinCode) ';
	
	const maxPinCode = 9999;
	let retVal = Math.floor(Math.random() * maxPinCode) + 1;
 
	if (retVal < 0)
		throw new Error(errPrefix + 'The generated validation PIN code is negative.');
		
	if (retVal > maxPinCode)
		throw new Error(errPrefix + 'The generated validation PIN code is greater than: ' +maxPinCode.toString());
		
	// Left pad it with zeroes.
	let strRetVal = padFourDigitNumericPinCode(retVal);
	
	return strRetVal;
}

/**
 * Simple object to hold a pair of ascii code numbers
 *  and the characters that they belong to.
 *
 * @param {String} c_1
 * @param {String} c_2
 *
 * @constructor
 */
function CharPairDiagnose(c_1, c_2) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	this.c_1 = null;
	this.c_2 = null;
	this.n_1 = null;
	this.n_2 = null;

	if (c_1 !== null)
	{
		if (typeof c_1 !== 'string')
			throw new Error(errPrefix + `The value in the c_1 parameter is not string.`);
		if (c_1.length !== 1)
			throw new Error(errPrefix + `The string in c_1 is not exactly one character long.`);
		
		this.c_1 = c_1;
		this.n_1 = c_1.charCodeAt(0);
	}
	
	if (c_2 !== null) {
		if (typeof c_2 !== 'string')
			throw new Error(errPrefix + `The value in the c_2 parameter is not string.`);
		if (c_2.length !== 1)
			throw new Error(errPrefix + `The string in c_2 is not exactly one character long.`);
			
		this.c_2 = c_2;
		this.n_2 = c_2.charCodeAt(0);
	}
}

/**
 * Given two strings, returns an array of CharPairDiagnose objects
 * 	where each CharPairDiagnose contains the ascii codes for the
 * 	strings at one particular column.  If one string is longer
 * 	than the other, you will find Null in the numeric field for
 * 	that string in the CharPairDiagnose object for the shorter string,
 * 	and NULL for the character field too.
 *
 * @param {String} str_1
 * @param {String} str_2
 *
 * @return {Array<CharPairDiagnose>}
 */
function stringPairToNumberPairArray(str_1, str_2) {
	let errPrefix = `(stringPairToNumberPairArray) `;
	
	if (isEmptySafeString(str_1))
		throw new Error(errPrefix + `The str_1 parameter is empty.`);
	
	if (isEmptySafeString(str_2))
		throw new Error(errPrefix + `The str_2 parameter is empty.`);
		
	if (typeof str_1 !== 'string')
		throw new Error(errPrefix + `The value in the str_1 parameter is not a string.`);
		
	if (typeof str_2 !== 'string')
		throw new Error(errPrefix + `The value in the str_2 parameter is not a string.`);
		
	let retAryAsciiCharPair = new Array();
	let ndx = 0;
	let maxLen = Math.max(str_1.length, str_2.length);
	
	while (ndx < maxLen) {
		let c_1 = null;
		let c_2 = null;

		if (ndx < str_1.length)
			c_1 = str_1[ndx];
		if (ndx < str_2.length)
			c_2 = str_2[ndx];
		
		retAryAsciiCharPair.push(new CharPairDiagnose(c_1, c_2))
		ndx++;
	}
	
	return retAryAsciiCharPair;
}

/**
 * Get a random element from an array.
 *
 * @param {Array<any>} srcArray - The array to select a random element
 * 	from.  Throws an error if the array is empty.
 *
 * @return {*} - Returns an element from the given array, selected at
 * 	random.
 */
function getRandomArrayElement(srcArray) {
	let errPrefix = `(getRandomArrayElement) `;

	if (!Array.isArray(srcArray))
		throw new Error(errPrefix + `The srcArray parameter value is not an array.`);
		
	if (srcArray.length < 0)
		throw new Error(errPrefix + `The source array is empty.`);
		
	let retStr;
	
	if (srcArray.length === 1)
		retStr = srcArray[0];
	else
		retStr = srcArray[Math.floor(Math.random() * srcArray.length)];
		
	return retStr.trim();
}

/**
 * Add a disjunct operator to the Set prototype.  Returns the
 * 	elements that are in the "this" object set that are not in
 * 	the comparison set.
 *
 * TODO: Implement union, subset, and intersection later.
 *
 * @param {Set} comparisonSet - The set to compare "this" object
 * 	against.
 *
 * @return {Set<any>} - Returns the set of elements in "this"
 * 	object that are not in the comparisonSet object.
 *
 */
Set.prototype.disjunct = function(comparisonSet)
{
    // creating new set to store disjunct
    let disjunctSet = new Set();
  
    // Check all values.
    for(let elem of this) {
        // If the element is not in comparisonSet then add it to disjunctSet.
        if(!comparisonSet.has(elem))
            disjunctSet.add(elem);
    }
  
    // Return the disjunct set.
    return disjunctSet;
}

/**
 * This function takes care of the messy details of checking to see if a
 * 	current date is far enough away from a past date to satisfied a desired
 * 	wait interval.
 *
 * @param {Number} waitInterval_ms - The number of milliseconds that must
 * 	have transpired between the reference date/time and the current date/time
 * 	to consider the wait interval as having been satisfied.
 * @param {Date|null|undefined} dtPast - The date/time in the past to use as
 * 	the reference date/time.
 * @param {Date} dtCurrent - The current date/time to compare against the
 * 	reference date/time.
 * @param {Boolean} bAcceptUndefinedPastDate - If TRUE, and the past
 * 	date/time is NULL or UNDEFINED, then the wait interval will consider
 * 	as having been immediately satisfied and TRUE will be returned.
 * 	If FALSE, and the past date/time is NULL or UNDEFINED, then the wait
 * 	interval will be considered as not being satisfied and FALSE will be
 * 	returned.
 * @return {boolean}
 */
function isDateTimeIntervalSatisfied_ms(waitInterval_ms, dtPast, dtCurrent, bAcceptUndefinedPastDate=false) {
	let errPrefix = `(isDateTimeIntervalSatisfied_ms) `;
	
	let bIsIntervalSatisfied = false;
	
	if (typeof waitInterval_ms !== 'number')
		throw new Error(errPrefix + `The value in the dtInterval_mes parameter is not a number.`);
	if (waitInterval_ms < 0)
		throw new Error(errPrefix + `The wait interval is negative.`);
	if (waitInterval_ms === 0)
		throw new Error(errPrefix + `The wait interval is zero.`);
		
	const bDtPastIsNullOrUndefined = (typeof dtPast === 'undefined' || dtPast === null);
	
	if (dtPast instanceof Date) {
		// The past date/time object MUST be less than the current date/time object.
		if (dtCurrent < dtPast)
			throw new Error(errPrefix + `The current date is older than the past date.`);
	} else {
		// Not a Date object.  It must be NULL or UNDEFINED then.
		if (!bDtPastIsNullOrUndefined)
			throw new Error(errPrefix + `The value in the dtPast parameter is not a Date object but it is not NULL or "undefined" either.`);
	}
	
	if (!(dtCurrent instanceof Date))
		throw new Error(errPrefix + `The value in the dtCurrent parameter is not a Date object.`);
		
	if (typeof bAcceptUndefinedPastDate !== 'boolean')
		throw new Error(errPrefix + `The value in the bAcceptUndefinedPastDate parameter is not boolean.`);
	
	// Is dtPast NULL or undefined?
	if (bDtPastIsNullOrUndefined) {
		// Yes.  Then the result is purely dependent on the bAcceptUndefinedPastDate flag.
		bIsIntervalSatisfied = bAcceptUndefinedPastDate;
	} else {
		// Calculate the number of milliseconds between the past date and the reference date.
		const diffMS =
			dtCurrent.getTime() - dtPast.getTime();
			
		// Is the wait interval satisfied?
		bIsIntervalSatisfied = diffMS >= waitInterval_ms;
	}
	
	return bIsIntervalSatisfied;
}

/**
 * This function takes care of the messy details of checking to see if a
 * 	current date is far enough away from a past date to satisfied a desired
 * 	wait interval.
 *
 * @param {Number} waitInterval_secs - The number of SECONDS that must
 * 	have transpired between the reference date/time and the current date/time
 * 	to consider the wait interval as having been satisfied.
 * @param {Date|null|undefined} dtPast - The date/time in the past to use as
 * 	the reference date/time.
 * @param {Date} dtCurrent - The current date/time to compare against the
 * 	reference date/time.
 * @param {Boolean} bAcceptUndefinedPastDate - If TRUE, and the past
 * 	date/time is NULL or UNDEFINED, then the wait interval will consider
 * 	as having been immediately satisfied and TRUE will be returned.
 * 	If FALSE, and the past date/time is NULL or UNDEFINED, then the wait
 * 	interval will be considered as not being satisfied and FALSE will be
 * 	returned.
 * @return {boolean}
 */
function isDateTimeIntervalSatisfied_secs(waitInterval_secs, dtPast, dtCurrent, bAcceptUndefinedPastDate=false) {
	let errPrefix = `(isDateTimeIntervalSatisfied_secs) `;

	// Convert the wait interval to milliseconds.
	let waitInterval_ms = Math.trunc(waitInterval_secs * 1000);
	
	// Pass the call on to isDateTimeIntervalSatisfied_ms();
	return isDateTimeIntervalSatisfied_ms(waitInterval_ms, dtPast, dtCurrent, bAcceptUndefinedPastDate);
}

/**
 * Return the number of hours between two dates.
 *
 * @param {Date} date_1 - The older date to use in the comparison.
 * @param {Date} date_2 - The newer date to use in the comparison.
 *
 * @return {number}
 */
function numHoursBetweenDates(date_1, date_2) {
	let errPrefix = `(numHoursBetweenDates) `;
	
	if (!(date_1 instanceof Date))
		throw new Error(errPrefix + `The value in the date_1 parameter is not a Date object.`);	
		
	if (!(date_2 instanceof Date))
		throw new Error(errPrefix + `The value in the date_2 parameter is not a Date object.`);
	
	if (date_2 < date_1)
		throw new Error(errPrefix + `The second date is less than the first date.`);
		
	let numHours = Math.abs(date_1 - date_2) / 36e5;
	
	return numHours
}

/**
 * This function returns a promise that sleeps for the desired number
 * 	of milliseconds.
 *
 * @param {Number} durationMS - The number of milliseconds to sleep.
 *
 * @return {Promise<Number>} - The promise resolves the number of
 * 	milliseconds given in the durationMS parameter.
 */
async function sleep_promise(durationMS) {
	let errPrefix = `(sleep_promise) `;
	
	if (typeof durationMS !== 'number')
		throw new Error(errPrefix + `The value in the durationMS parameter is not number.`);
	if (durationMS < 0)
		throw new Error(errPrefix + `The durationMS parameter is negative.`);
	if (durationMS === 0)
		throw new Error(errPrefix + `The durationMS parameter is zero.`);
		
	return new Promise(function(resolve, reject) {
		setInterval(() => {
			// Resolve the promise with value of the durationMS parameter.
			resolve(durationMS);
		},
		durationMS);
	});
}

/**
 * Return the text of the currently selected option in a select box.
 *
 * @param {String} idOfSelectBox - The ID of the desired select box.
 *
 * @return {String} - Returns the text of the currently selected
 * 	option.
 */
function getSelectedOptionText(idOfSelectBox) {
	let errPrefix = `(getSelectedOptionText) `;
	
	if (misc_shared_lib.isEmptySafeString(idOfSelectBox))
		throw new Error(errPrefix + `The idOfSelectBox parameter is empty.`);
		
	return $('#' + idOfSelectBox).find(":selected").text();
}

/**
 * Return the value of the currently selected option in a select box.
 *
 * @param {String} idOfSelectBox - The ID of the desired select box.
 *
 * @return {String} - Returns the text of the currently selected
 * 	option.
 */
function getSelectedOptionValue(idOfSelectBox) {
	let errPrefix = `(getSelectedOptionValue) `;
	
	if (misc_shared_lib.isEmptySafeString(idOfSelectBox))
		throw new Error(errPrefix + `The idOfSelectBox parameter is empty.`);
		
	return $('#' + idOfSelectBox).find(":selected").val();
}

/**
 * Given a date, a format specifier, and the delimiter to use between
 * 	parts of the date, create a human friendly date string.
 *
 * @param {Date} dt - A DateTime object to format.
 * @param {Array<Object>} aryFieldSpecifiers- A an array of objects that
 * 	specifies how to format the date/time value.
 * @param {String} [partsDelim] - The string to insert between the
 * 	parts of the date/time value.
 * @param {String} [isoCode] - The ISO code that specifies what
 * 	language to use when formatting the date.
 *
 * @return {String} - Returns a human friendly string that represents
 * 	the given DateTime value as per the format specified.
 *
 * @private
 */
function _assembleDateTimeParts(dt, aryFieldSpecifiers, partsDelim = '-', isoCode='en') {
	let errPrefix = `(_assembleDateTimeParts) `;
	
	if (!(dt instanceof Date))
		throw new Error(errPrefix + `The value in the dt parameter is not a DateTime object.`);
	if (!Array.isArray(aryFieldSpecifiers))
		throw new Error(errPrefix + `The aryFieldSpecifiers parameter value is not an array.`);
	if (aryFieldSpecifiers.length < 1)
		throw new Error(errPrefix + `The aryFieldSpecifiers array is empty.`);
	if (isEmptySafeString(partsDelim))
		throw new Error(errPrefix + `The partsDelim parameter is empty.`);
	if (isEmptySafeString(isoCode))
		throw new Error(errPrefix + `The isoCode parameter is empty.`);
	
	let strDate = '';
	
	for (let ndx = 0; ndx < aryFieldSpecifiers.length; ndx++) {
		const fldSpecifier = aryFieldSpecifiers[ndx];
		
		if (isEmptySafeString(fldSpecifier))
			throw new Error(errPrefix + `The field specifier at index(${ndx}) is invalid.`);
			
		// Build the format specifier.
		const theFormat = new Intl.DateTimeFormat(isoCode, fldSpecifier);
		const theFormattedFld = theFormat.format(dt);
		
		// Accumulate it.
		if (ndx > 0)
			strDate += partsDelim;
			
		strDate += theFormattedFld;
	}
	
	return strDate;
}

/**
 * Given a Date/Time object, return it in dd_mmstr_yyyy format
 * 	(e.g. - "01-Jan-1888")
 *
 * @param {DateTime} dt - A DateTime object to format.
 * @param {String} [partsDelim] - The string to insert between the
 * 	parts of the date/time value.
 * @param {String} [isoCode] - The ISO code that specifies what
 * 	language to use when formatting the date.
 *
 * @return {String} - Returns the date in formatted form.
 */
function formatDateTime_dd_mmstr_yyyy(dt, partsDelim = '-', isoCode='en') {
	let errPrefix = `(formatDateTime_dd_mmstr_yyyy) `;
	
	if (!(dt instanceof Date))
		throw new Error(errPrefix + `The value in the DateT parameter is not a Date object.`);
		
	const aryFieldFmts = [{day: 'numeric'}, {month: 'short'}, {year: 'numeric'}];
	return _assembleDateTimeParts(dt, aryFieldFmts, partsDelim, isoCode);
}

/**
 * Given a jQuery selector, return TRUE if it selects
 * 	at least one HTML element, FALSE if nto.
 *
 * @param {String} jQuerySelector - A jQuery
 * 	selector (e.g. - specific element, or class
 * 	name, etc.).
 */
function isValidJQuerySelector(jQuerySelector) {
	let errPrefix = `(isValidJQuerySelector) `;
	
	if (isEmptySafeString(jQuerySelector))
		throw new Error(errPrefix + `The jQuerySelector parameter is empty.`);
		
	// Make sure it is a valid element.
	const testElem = $(jQuerySelector);
	
	// The object returned by jQuery uses numbered properties, but it is not
	//  an array.
	if (!testElem || typeof testElem[0] === 'undefined')
		return false;

	return true;
}

/**
 * Given a parent jQuery selector that selects a desired parent
 * 	element, return the elements from the children of that
 * 	parent element that match the given child selector.
 * @param {String} parentSelector - A valid jQuery selector
 * 	that selects the desired parent element.
 * @param {String} childSelector - A valid jQuery selector
 * 	that is used to search the parent elements tree of
 * 	children.
 * @param {Boolean} [bErrorIfNoneFound] - If TRUE, then,
 * 	if no children could be found for the given parent
 * 	selector, an error will be thrown.  If FALSE, then
 * 	the result of the jQuery selection call will be
 * 	returned.
 *
 * @return {Boolean} - Returns the children of the given parent
 * 	that match the childSelector parameter or NULL if
 * 	no matching elements were found.
 */
function getChildOfJQuerySelector(parentSelector, childSelector, bErrorIfNoneFound=true) {
	let errPrefix = `(getChildOfJQuerySelector) `;
	
	if (misc_shared_lib.isEmptySafeString(parentSelector))
		throw new Error(errPrefix + `The parentSelector parameter is empty.`);
	if (misc_shared_lib.isEmptySafeString(childSelector))
		throw new Error(errPrefix + `The childSelector parameter is empty.`);
	if (typeof bErrorIfNoneFound !== 'boolean')
		throw new Error(errPrefix + `The value in the bErrorIfNoneFound parameter is not boolean.`);
		
	if (!isValidJQuerySelector(parentSelector))
		throw new Error(errPrefix + `The parent selector does not select any DOM elements.`);
		
	const matchingChildren = $(parentSelector).children().find(childSelector);
	
	if (!matchingChildren || typeof matchingChildren[0] === "undefined") {
		// No matching elements found.  Are we throwing an error?
		if (bErrorIfNoneFound)
			throw new Error(errPrefix + `The parent("${parentSelector}") and child("${childSelector}") selector pair did not match any DOM elements.`);
		else
			return null;
	}
	
	return matchingChildren;
}

/**
 * Given a parent jQuery selector that selects a desired parent
 * 	element, return TRUE if the childSelector succeeds on the
 * 	children of that parent element.  (i.e. - the given
 * 	selector pair selects a valid child of the parent,
 * 	anywhere in the tree of children belonging to the
 * 	parent).
 * @param {String} parentSelector - A valid jQuery selector
 * 	that selects the desired parent element.
 * @param childSelector - A valid jQuery selector
 * 	that is used to search the parent elements tree of
 * 	children.
 *
 * @return {Boolean} - Returns TRUE if the child selector
 * 	selects a valid child element from the parent elements
 * 	tree of children, FALSE if not.
 */
function isValidChildOfJQuerySelector(parentSelector, childSelector) {
	let errPrefix = `(isValidChildOfJQuerySelector) `;
	
	if (misc_shared_lib.isEmptySafeString(parentSelector))
		throw new Error(errPrefix + `The parentSelector parameter is empty.`);
	if (misc_shared_lib.isEmptySafeString(childSelector))
		throw new Error(errPrefix + `The childSelector parameter is empty.`);
		
	if (!isValidJQuerySelector(parentSelector))
		throw new Error(errPrefix + `The parent selector does not select any DOM elements.`);
		
	const matchingChildren = getChildOfJQuerySelector(parentSelector, childSelector, false);
	
	if (!matchingChildren || typeof matchingChildren[0] === 'undefined')
		return false;

	return true;
}

/**
 * Parse a given string into an integer.
 *
 * @param {String} str - A string that should contain a number.
 *
 * @return {Number|null} - Returns a number or a NULL
 * 	if the string could not be parsed into an integers.
 *
function tryParseInt(str) {
	const errPrefix = `(tryParseInt) `;
	
	if (typeof str !== 'string')
		throw new Error(errPrefix + `The value in the str parameter is not a string.`);
	
	if (misc_shared_lib.isEmptySafeString(str))
		throw new Error(errPrefix + `The str parameter is empty.`);
		
	let retVal = null;

	try {
		retVal = parseIntOrNull()
	}
	
}
*/

/**
 * Given a number or a string, if it is a string, try parsing it as
 * 	an integer.  If it is a number, make sure it is an integer.  If
 * 	either attempt fails, return NULL.
 *
 * @param {String|Number} strOrNumber - A string or a number.
 *
 * @return {Number|null} - Returns an integer or a NULL.
 */
function parseIntIfNeededOrNull(strOrNumber) {
	const errPrefix = `(parseIntIfNeededOrNull) `;
	
	if (strOrNumber === null || typeof strOrNumber === 'undefined')
		return null;
	
	if (typeof strOrNumber === 'number') {
		// Is it an integer?
		if (strOrNumber === Math.trunc(strOrNumber))
			// Yes.  Return it.
			return strOrNumber;
		else
			// No.  Return NULL.
			return null;
	} else {
		// Try to parse it as an integer.
		return parseIntOrNull(strOrNumber);
	}
}


/**
 * Given an element of any type, apply a function to every part of
 * 	it recursively and return a new object built from that operation.
 *
 * @param {*} srcElem - A source element of any type.
 * @param {Function} funcToApply - The function to apply to every
 * 	part of the source element.
 *
 * @return {null|*} - Returns a new object, array, or simple type
 * 	that has had the apply function applied to every part of it.
 * 	NOTE: If the source element is of type "undefined" it will
 * 	be conformed to NULL.
 */
function applyFuncRecursively(srcElem, funcToApply) {
	let errPrefix = `(applyFuncRecursively) `;
	
	if (typeof funcToApply !== 'function')
		throw new Error(errPrefix + `The value in the funcToApply parameter is not a function.`);
	
	if (srcElem === null || typeof srcElem === 'undefined')
		return null;
		
	// This function returns TRUE if the element is an array or an
	//  object, otherwise it returns FALSE.
	function isArrayOrObject(elem) {
		return (Array.isArray(elem) || typeof elem === 'object');
	}
		
	let retVal = null;
	
	if (Array.isArray(srcElem)) {
		// >>>>> ELEMENT TYPE: Array.
		retVal = [];
		
		for (let ndx = 0; ndx < srcElem.length; ndx++) {
			let elem = srcElem[ndx];
			
			// Is it an array or an object?
			if (isArrayOrObject(elem))
				// Recurse.
				retVal[ndx] = applyFuncRecursively(elem, funcToApply);
			else
				// Copy the value into our return object, after applying the
				//	funcToApply function.
				retVal[ndx] = funcToApply(elem);
		}
	} else if (typeof srcElem === 'object') {
		// >>>>> ELEMENT TYPE: Object
		
		retVal = {};
		
		// Iterate the properties of the object.
		for (let propKey in srcElem)
		{
			const propValue = srcElem[propKey];
			
			// Is it an array or an object?
			if (isArrayOrObject(propValue))
				// Recurse.
				retVal[propKey] = applyFuncRecursively(propValue, funcToApply);
			else
				// Copy the value into our return object, after applying the
				//	funcToApply function.
				retVal[propKey]= funcToApply(propValue);
		}
	} else {
		// >>>>> ELEMENT TYPE: Simple
		
		// Copy the value into our return object, after applying the
		//	funcToApply function.
		retVal = funcToApply(srcElem);
	}
	
	return retVal;
}

// Regular expression when used with the toString() method on a number will
//  limit the number to two decimal places without rounding or truncating
//  the number.
const REG_EXP_LIMIT_TWO_DECIMAL_PLACES = /^-?\d+(?:\.\d{0,2})?/;

/**
 * Given a number, return a number that is limited to at most two
 * 	decimal placed.
 *
 * @param {Number} numVal - The number to modify.
 *
 * @return {*}
 */
function truncateToDecimalPlaces(numVal) {
	let errPrefix = "(truncateToDecimalPlaces) ";
	
	if (typeof numVal !== 'number')
		throw new Error(errPrefix + `The value in the numVal parameter is not a number.`);
		
	let retVal = numVal.toString().match(REG_EXP_LIMIT_TWO_DECIMAL_PLACES)[0];
	
	return retVal;
}

/**
 * Get today's date with the option to add a certain number
 * 	of days to it.
 *
 * @param {Number} [addDays] - Days to add to today's date,
 * 	may be negative.
 *
 * @return {Date} - Returns today's date with the optionally
 * 	specified number of days added to it.
 */
function getToday(addDays=null) {
	const errPrefix = `(getToday) `;
	
	if (addDays) {
		if (typeof addDays !== 'number')
			throw new Error(errPrefix + `The value in the addDays parameter is not NULL, yet it is not a number either.`);
	}
	
	let retDate = new Date();
	
	if (addDays)
		return new Date(retDate.setDate(retDate.getDate() + addDays));
	else
		return retDate;
}

/**
 * Simple function to prepend the pound character to a
 * 	DOM element ID and return the prepended string.
 *
 * NOTE: The element ID is NOT validated as being a
 * 	member of the current DOM tree.
 *
 * @param {String} elemId - A DOM element ID.
 *
 * @return {string}
 */
function makeJQuerySelectorFromId(elemId) {
	let errPrefix = `(makeJQuerySelectorFromId) `;
	
	if (misc_shared_lib.isEmptySafeString(elemId))
		throw new Error(errPrefix + `The elemId parameter is empty.`);
		
	if (elemId[0] === '#')
		throw new Error(errPrefix + `Element ID already starts with a "#" character.`);
		
	return `#${elemId}`;
}

/**
 * Validate the width and height values for a screen element.
 * 	A dimension must be a number that is greater than 0.
 *
 * @param {String} theCaller - the name of the function
 * 	that called us.  It will be used in the error
 * 	message thrown if bThrowError is TRUE and
 * 	either dimension is invalid.
 * @param {Number} width - The width to use for a screen element.
 * @param {Number} height - The height to use for a screen element.
 * @param {Boolean} bThrowError - If TRUE, then if either
 * 	dimension is invalid, an error will be thrown.  Otherwise
 * 	FALSE will be returned.
 *
 * @return {Boolean} - If both dimensions are valid, then
 *  TRUE will be returned.  If either dimension is invalid,
 *  then an error will be thrown if bThrowError is TRUE,
 *  otherwise FALSE will be returned if bThrowError is
 *  FALSE.
 */
function validateWidthAndHeight(theCaller, width, height, bThrowError=true) {
	let methodName = 'validateWidthAndHeight';
	let errPrefix = `(${methodName}) `;
	
	if (misc_shared_lib.isEmptySafeString(theCaller))
		throw new Error(errPrefix + `The theCaller parameter is empty.`);
		
	errPrefix = `(${theCaller}::${methodName}) `
	
	// Validate one of the dimensions.  If the dimension
	//  is invalid, return an error phrase that completes
	//  the sentence "The <dimension name> is: ". Otherwise
	//  return TRUE.
	function isValidDimension(dimension) {
		if (typeof dimension !== 'number' || isNaN(dimension))
			return 'not a number';
		
		// Convert to integer so the following checks work correctly.
		const intDimension = Math.trunc(dimension);

		if (intDimension < 0)
			return 'negative';
		if (intDimension === 0)
			return 'zero';
			
		// All checks passed.
		return true;
	}
	
	// Validate the width dimension.
	let errMsgOrTrue = isValidDimension(width);
	
	if (errMsgOrTrue !== true) {
		// Invalid width.  Throw an error?
		if (bThrowError)
			throw new Error(errPrefix + `Invalid dimension.  The WIDTH is: ${errMsgOrTrue}.`);
		else
			// No. Return FALSE.
			return false;
	}
	
	// Validate the height dimension.
	errMsgOrTrue = isValidDimension(height);
	
	if (errMsgOrTrue !== true) {
		// Invalid height.  Throw an error?
		if (bThrowError)
			throw new Error(errPrefix + `Invalid dimension.  The HEIGHT is: ${errMsgOrTrue}.`);
		else
			// No. Return FALSE.
			return false;
	}
	
	// Both dimensions validated.
	return true;
}

/**
 * NOTE: This code is from the open source Alpaca forms library.
 *
 * Replaces each substring of this string that matches the given regular expression with the given replacement.
 *
 * @param {String} text - Source string being replaced.
 * @param {String} replace - Regular expression for replacing.
 * @param {String} with_this - Replacement text
 *
 * @returns {String} Returns a new string will substitutions
 *  of "text" with "replace" made.
 */
function replaceAllOccurrences(text, replace, with_this) {
	return text.replace(new RegExp(replace, 'g'), with_this);
}

/**
 * This function splits a word by spaces and then returns all the words in the
 *  sentence in an array, after trimming each word.  Empty words are not
 *  added to the result array.
 *
 * @param {string} str - The string to split.
 * @param {string} [strDelim] - The string to use as the delimiter for splitting
 * 	the target string.  If not specified, then a SPACE character will be used
 * 	as the delimiter
 *
 * @return {Array<string>} - Returns an array of strings created by splitting
 * 	the string using the given delimiter and trimming each element along
 * 	the way.
 */
function splitAndTrim(str, strDelim=' ')
{
	let errPrefix = '(splitAndTrim) ';

	if (typeof str !== 'string')
		throw new Error(`${errPrefix}The value in the str parameter is not string.`);

	let aryRetStrings = new Array();

	if (misc_shared_lib.isEmptySafeString(strDelim))
		throw new Error(errPrefix + 'The delimiter string is empty or invalid.');

	str.split(strDelim).map(
		function(word)
		{
			if (!misc_shared_lib.isEmptySafeString(word))
				aryRetStrings.push(word.trim());
		});

	return aryRetStrings;
}

// Use this code on both client and server side.  Are we on the server side?
if (typeof module == 'undefined' || typeof module.exports == 'undefined')
{
	// No, make it part of the global Javascript namespace.
	window.misc_shared_lib = {};
	window.misc_shared_lib.applyFuncRecursively = applyFuncRecursively;
	window.misc_shared_lib.arrayToExclusiveObjectOfInstance = arrayToExclusiveObjectOfInstance;
	window.misc_shared_lib.buildErrPrefixFromCalleeAndCaller = buildErrPrefixFromCalleeAndCaller;
	window.misc_shared_lib.bufferToByteArray = bufferToByteArray;
	window.misc_shared_lib.checkFieldForNumber = checkFieldForNumber;
	window.misc_shared_lib.conformErrorObjectMsg = conformErrorObjectMsg;
	window.misc_shared_lib.countObjectProperties = countObjectProperties;
	window.misc_shared_lib.delayMS_promise = delayMS_promise;
	window.misc_shared_lib.enumOfStringValueToKey = enumOfStringValueToKey;
	window.misc_shared_lib.extractPropertyFromObj = extractPropertyFromObj;
	window.misc_shared_lib.formatDateTime_dd_mmstr_yyyy = formatDateTime_dd_mmstr_yyyy;
	window.misc_shared_lib.generateValidationPinCode = generateValidationPinCode;
	window.misc_shared_lib.getChildOfJQuerySelector = getChildOfJQuerySelector;
	window.misc_shared_lib.getConstructorName = getConstructorName;
	window.misc_shared_lib.getRandomString = getRandomString;
	window.misc_shared_lib.getRandomArrayElement = getRandomArrayElement;
	window.misc_shared_lib.getSelectedOptionText = getSelectedOptionText;
	window.misc_shared_lib.getSelectedOptionValue = getSelectedOptionValue;
	window.misc_shared_lib.getSimplifiedUuid = getSimplifiedUuid;
	window.misc_shared_lib.getToday = getToday;
	window.misc_shared_lib.hasOwnPropertyOrError = hasOwnPropertyOrError;
	window.misc_shared_lib.isDateTimeIntervalSatisfied_secs = isDateTimeIntervalSatisfied_secs;
	window.misc_shared_lib.isDateTimeIntervalSatisfied_ms = isDateTimeIntervalSatisfied_ms;
	window.misc_shared_lib.isDefinedAndNotNull = isDefinedAndNotNull;
	window.misc_shared_lib.isEmptyOrWhitespaceString = isEmptyOrWhitespaceString;
	window.misc_shared_lib.isEmptySafeString = isEmptySafeString;
	window.misc_shared_lib.isFalseOrStrFalse = isFalseOrStrFalse;
	window.misc_shared_lib.isNodeJsEnvironment = isNodeJsEnvironment;
	window.misc_shared_lib.isNonNullObjectAndNotArray = isNonNullObjectAndNotArray;
	window.misc_shared_lib.isProcessGlobalVarPresent = isProcessGlobalVarPresent;
	window.misc_shared_lib.isTrueOrStrTrue = isTrueOrStrTrue;
	window.misc_shared_lib.isValidEnumValue = isValidEnumValue;
	window.misc_shared_lib.isValidChildOfJQuerySelector = isValidChildOfJQuerySelector;
	window.misc_shared_lib.isValidJQuerySelector = isValidJQuerySelector;
	window.misc_shared_lib.makeJQuerySelectorFromId = makeJQuerySelectorFromId;
	window.misc_shared_lib.makeStringSafe = makeStringSafe;
	window.misc_shared_lib.myTypeDetect = myTypeDetect;
	window.misc_shared_lib.nowDateTime = nowDateTime;
	window.misc_shared_lib.numHoursBetweenDates = numHoursBetweenDates;
	window.misc_shared_lib.nvpGetFieldInArray = nvpGetFieldInArray;
	window.misc_shared_lib.nvpSetFieldInArrayToValue = nvpSetFieldInArrayToValue;
	window.misc_shared_lib.objectValueToKey = objectValueToKey;
	window.misc_shared_lib.padFourDigitNumericPinCode = padFourDigitNumericPinCode;
	window.misc_shared_lib.parseJsonStringToObjectOfType = parseJsonStringToObjectOfType;
	window.misc_shared_lib.parseIntOrNull = parseIntOrNull;
	window.misc_shared_lib.parseIntIfNeededOrNull = parseIntIfNeededOrNull;
	window.misc_shared_lib.promiseAllWithResultObjects_promise = promiseAllWithResultObjects_promise;
	window.misc_shared_lib.PromiseThenBlockSkippedResult = PromiseThenBlockSkippedResult;
	window.misc_shared_lib.ReconstituteConstructorNeeded = ReconstituteConstructorNeeded;
	window.misc_shared_lib.replaceAllOccurrences = replaceAllOccurrences;
	window.misc_shared_lib.secondsToHoursMinutesSecondsString = secondsToHoursMinutesSecondsString;
	window.misc_shared_lib.sleep_promise = sleep_promise;
	window.misc_shared_lib.splitAndTrim = splitAndTrim;
	window.misc_shared_lib.stringPairToNumberPairArray = stringPairToNumberPairArray;
	window.misc_shared_lib.transferObjProperties = transferObjProperties;
	window.misc_shared_lib.truncateToDecimalPlaces = truncateToDecimalPlaces;
	window.misc_shared_lib.tryParseInt = tryParseInt;
	window.misc_shared_lib.validateWidthAndHeight = validateWidthAndHeight;
}
else
{
	// Yes.  Export the code so it works with require().
    module.exports =
		{
			applyFuncRecursively: applyFuncRecursively,
			arrayToExclusiveObjectOfInstance: arrayToExclusiveObjectOfInstance,
			buildErrPrefixFromCalleeAndCaller: buildErrPrefixFromCalleeAndCaller,
			bufferToByteArray: bufferToByteArray,
			checkFieldForNumber: checkFieldForNumber,
			conformErrorObjectMsg: conformErrorObjectMsg,
			countObjectProperties: countObjectProperties,
			delayMS_promise: delayMS_promise,
			enumOfStringValueToKey: enumOfStringValueToKey,
			extractPropertyFromObj: extractPropertyFromObj,
			formatDateTime_dd_mmstr_yyyy: formatDateTime_dd_mmstr_yyyy,
			generateValidationPinCode: generateValidationPinCode,
			getChildOfJQuerySelector: getChildOfJQuerySelector,
			getConstructorName: getConstructorName,
			getRandomArrayElement: getRandomArrayElement,
			getRandomString: getRandomString,
			getSelectedOptionText: getSelectedOptionText,
			getSelectedOptionValue: getSelectedOptionValue,
			getSimplifiedUuid: getSimplifiedUuid,
			getToday: getToday,
			hasOwnPropertyOrError: hasOwnPropertyOrError,
			isDateTimeIntervalSatisfied_ms: isDateTimeIntervalSatisfied_ms,
			isDateTimeIntervalSatisfied_secs: isDateTimeIntervalSatisfied_secs,
			isDefinedAndNotNull: isDefinedAndNotNull,
			isEmptyOrWhitespaceString: isEmptyOrWhitespaceString,
			isEmptySafeString: isEmptySafeString,
			isFalseOrStrFalse: isFalseOrStrFalse,
			isNodeJsEnvironment: isNodeJsEnvironment,
			isNonNullObjectAndNotArray: isNonNullObjectAndNotArray,
			isProcessGlobalVarPresent: isProcessGlobalVarPresent,
			isTrueOrStrTrue: isTrueOrStrTrue,
			isValidEnumValue: isValidEnumValue,
			isValidChildOfJQuerySelector: isValidChildOfJQuerySelector,
			isValidJQuerySelector: isValidJQuerySelector,
			makeJQuerySelectorFromId: makeJQuerySelectorFromId,
			makeStringSafe: makeStringSafe,
			myTypeDetect: myTypeDetect,
			nowDateTime: nowDateTime,
			numHoursBetweenDates: numHoursBetweenDates,
			nvpGetFieldInArray: nvpGetFieldInArray,
			nvpSetFieldInArrayToValue: nvpSetFieldInArrayToValue,
			objectValueToKey: objectValueToKey,
			padFourDigitNumericPinCode: padFourDigitNumericPinCode,
			parseIntIfNeededOrNull: parseIntIfNeededOrNull,
			parseIntOrNull: parseIntOrNull,
			parseJsonStringToObjectOfType: parseJsonStringToObjectOfType,
			promiseAllWithResultObjects_promise: promiseAllWithResultObjects_promise,
			PromiseThenBlockSkippedResult: PromiseThenBlockSkippedResult,
			replaceAllOccurrences: replaceAllOccurrences,
			sleep_promise: sleep_promise,
			splitAndTrim: splitAndTrim,
			stringPairToNumberPairArray: stringPairToNumberPairArray,
			truncateToDecimalPlaces: truncateToDecimalPlaces,
			tryParseInt: tryParseInt,
			ReconstituteConstructorNeeded: ReconstituteConstructorNeeded,
			secondsToHoursMinutesSecondsString: secondsToHoursMinutesSecondsString,
			transferObjProperties: transferObjProperties,
			validateWidthAndHeight: validateWidthAndHeight
		};
}
