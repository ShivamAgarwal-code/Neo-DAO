/**
 * This file contains code for validating interface contracts between objects and the code that uses them.
 */
const common_routines = require('../common/common-routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

/**
 * This array will contain the name of all the interface contracts that have been created
 * 	so far.
 *
 * @type {Array}
 */
const g_AryInterfaceNames = new Array();

/**
 * This object holds the definition for a single contract interface element.
 *
 * @param {string} elementName - The property name of the element in an object.
 * @param {string|null} elementTypeAsStr - The element type as a string.  Should be the
 * 	same value that a call to myTypeDetect returns.  If it set to NULL,
 * 	then only existence of the property named will be checked for, and the type
 * 	of its value will be ignored.
 *
 * @constructor
 */
function InterfaceElement(elementName, elementTypeAsStr) {
	var self = this;
	let methodName = self.constructor.name + '::' + 'constructor';
	let errPrefix = '(' + methodName + ') ';
	
	if (misc_shared_lib.isEmptySafeString(elementName))
		throw new Error(errPrefix + 'The elementName parameter is empty.');
	
	if (elementTypeAsStr !== null && misc_shared_lib.isEmptySafeString(elementTypeAsStr))
		throw new Error(errPrefix + 'The elementTypeAsStr parameter not NULL, but is empty or undefined.');
	
	/** @property {string} - The property name of the element in an object. */
	this.elementName = elementName;
	
	/** @property {string} - The element type as a string.  Should be the
 	 * 		same value that a call to myTypeDetect() returns. */
	this.elementTypeAsStr = elementTypeAsStr;
}

/**
 * Given an array of interface elements that describe a particular Javascript interface contract,
 * 	build an object that can be used to validate other objects as supporting that interface contract
 * 	or not.
 *
 * @param {string} interfaceName - A descriptive name to give this interface.
 * @param {Array<InterfaceElement>} aryInterfaceElements - An array of InterfaceElement objects.
 *
 * @constructor
 */
function InterfaceContract(interfaceName, aryInterfaceElements) {
	var self = this;
	let methodName = self.constructor.name + '::' + 'constructor';
	let errPrefix = '(' + methodName + ') ';
	
	if (misc_shared_lib.isEmptySafeString(interfaceName))
		throw new Error(errPrefix + 'The interfaceName parameter is empty.');
		
	if (g_AryInterfaceNames.includes(interfaceName))
		throw new Error(
			errPrefix
			+ 'The interfaceName parameter contains a name that has already been used: "'
			+ interfaceName
			+ '".');

	if (!Array.isArray(aryInterfaceElements))
		throw new Error(errPrefix + ' The parameter that should contain the array of interface elements does not contain an array.');
	
	/** @property {string} - The name given to describe this interface. */
	this.interfaceName = interfaceName;
	
	/** @property {Array} - An array that contains the set of InterfaceElements that define
	 * 		a particular interface contract.
	 *
	 * @private
	 */
	this._aryInterfaceElements = new Array();
	
	
	/**
	 * Validate the given object as supporting the interface contract defined at construction time.
	 *
	 * @param {Object} obj - The object to validate.
	 */
	this.validateInterface = function(obj) {
		let methodName = self.constructor.name + '::' + 'validateInterface';
		let errPrefix = '(' + methodName + ') ';
		
		// The object parameter must be an object and not an Array (n.b. - the typeof operator
		//	returns 'object' for arrays, that's why we need the isArray() function).
		if (!misc_shared_lib.isNonNullObjectAndNotArray(obj))
			throw new Error(errPrefix + ' The parameter that should contain the object to validate is invalid.');
			
		let objConstructorName = misc_shared_lib.getConstructorName(obj);
		
		if (!objConstructorName)
			objConstructorName = 'unknown';

		// Redefine the error prefix to show our interface name and the obj parameter's type.
		errPrefix =
			'( METHOD: "'
				+ methodName
				+ '", INTERFACE NAME: "'
				+ self.interfaceName
			 	+ '", OBJECT TYPE: "'
			 	+ objConstructorName
			 	+ '"'
			 	+ ') ';
			
		for (let ndx = 0; ndx < self._aryInterfaceElements.length; ndx++)
		{
			let interfaceElementObj = self._aryInterfaceElements[ndx];
			
			if (!obj.hasOwnProperty(interfaceElementObj.elementName))
				throw new Error(
					errPrefix
					+ 'The object is missing the interface element named: "'
					+ interfaceElementObj.elementName + '"');
				
			// If elementTypeAsStr is NULL, then we don't validate the property type.
			if (interfaceElementObj.elementTypeAsStr !== null) {
				let typeDetected = misc_shared_lib.myTypeDetect(obj[interfaceElementObj.elementName]);
				
				if (typeDetected != interfaceElementObj.elementTypeAsStr)
					throw new Error(
						errPrefix
						+ ' The object an interface element named: "' + interfaceElementObj.elementName + '"'
						+ ' but it is the wrong type.  Required type: "' + interfaceElementObj.elementTypeAsStr + '"'
						+ ', type detected: "' + typeDetected + '"');
			}
		}
	}
	
	// ------------------------------- CONSTRUCTOR CODE -----------------
	// Copy the interface elements to our internal array.
	for (let ndx = 0; ndx < aryInterfaceElements.length; ndx++) {
		let interfaceElementObj = aryInterfaceElements[ndx];
		
		if (!(interfaceElementObj instanceof InterfaceElement))
			throw new Error(
				errPrefix
				+ 'The value in the interfaceElementObj parameter is not an InterfaceElement object.  Type detected: '
				+ misc_shared_lib.myTypeDetect(interfaceElementObj));
			
		this._aryInterfaceElements.push(interfaceElementObj);
	}
}

module.exports = {
	InterfaceElement: InterfaceElement,
	InterfaceContract: InterfaceContract
}