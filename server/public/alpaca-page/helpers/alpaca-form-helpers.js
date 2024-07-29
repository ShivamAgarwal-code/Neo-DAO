// ROS: This file contains some helpful functions to make working
//  with Alpaca forms more convenient.

/**
 * Get the field value an Alpaca "this" object reference
 * 	using the given field name.
 *
 * @param {Object} alpacaThisObj - The "this" object reference
 * 	from within an Alpaca form event handler or other function.
 * @param {String} fldName - The name of the desired field.
 * @param {Boolean} [bErrorIfNotFound] - If TRUE then an
 * 	error will be thrown if a child object does not exist with the
 * 	given field name.  If FALSE, then NULL will be returned.
 *
 * @return {null|*} - The Alpaca form data field that bears the given
 * 	field name is returned. If a child object or field with the given
 * 	field name could be found then NULL is returned or an
 * 	error is thrown depending on the value of the
 * 	bErrorIfNotFound parameter.
 *
 * @private
 */
function _getAlpacaFieldObj(alpacaThisObj, fldName, bErrorIfNotFound=true) {
	const errPrefix = `(getAlpacaFieldObj) `;
	
	if (!misc_shared_lib.isNonNullObjectAndNotArray(alpacaThisObj))
		throw new Error(errPrefix + `The alpacaThisObj is not a valid object.`);
	if (misc_shared_lib.isEmptySafeString(fldName))
		throw new Error(errPrefix + `The fldName parameter is empty.`);
		
	let topLevelObj = alpacaThisObj.getParent();
	
	// If we don't have a parent, then we are not being called from
	//  a validator function and the alpacaThisObject IS the top level
	//  object.
	if (!topLevelObj)
		topLevelObj = alpacaThisObj;
	
	if (!misc_shared_lib.isNonNullObjectAndNotArray(topLevelObj))
		throw new Error(errPrefix + `The top level form object is not a valid object.`);
		
	const theChild = topLevelObj.childrenByPropertyId[fldName];

	if (!misc_shared_lib.isNonNullObjectAndNotArray(theChild)) {
		if (bErrorIfNotFound)
			throw new Error(errPrefix + `The Alpaca form does not have a child element named: ${fldName}.`);
		else
			return null;
	}
	
	return theChild;
}

/**
 * Get the value from a field object from an Alpaca form.
 *
 * @param {Object} alpacaThisObj - The "this" object reference
 * 	from within an Alpaca form event handler or other function.
 * @param {String} fldName - The name of the desired field.
 *
 * @return {null|Object} - The Alpaca form data field that
 *  bears the given	field name is returned or
 *  NULL is returned if the field does not exist in the Alpaca
 *  form.
 */
function getAlpacaFieldValue(alpacaThisObj, fldName) {
	return _getAlpacaFieldObj(alpacaThisObj, fldName).getValue();
}

/**
 * Set the value to a field object in an Alpaca form.
 *
 * @param {Object} alpacaThisObj - The "this" object reference
 * 	from within an Alpaca form event handler or other function.
 * @param {String} fldName - The name of the desired field.
 * @param {*} fldValue - The value to set the field to.
 *
 * @return {null|Object} - The Alpaca form data field that bears
 * 	the given field name is returned or NULL is returned if the
 * 	field does not exist in the Alpaca form.
 */
function setAlpacaFieldValue(alpacaThisObj, fldName, fldValue) {
	return _getAlpacaFieldObj(alpacaThisObj, fldName, fldValue).setValue(fldValue);
}

/**
 * This is a helper function meant to be used inside the custom validation
 *  bocks you can create for Alpaca form fields.  It validates numeric fields.
 *
 * @param {object} alpacaFormObj - A valid Alpaca form object.
 * @param {function} funcValCallback - The post-validation
 *  callback function.
 * @param {string} fieldDesc - A short string describing the field.
 *  Used in error messages.
 * @param {number} lowerBound - The minimum value for the numeric field.
 * @param {number} upperBound - The maximum value for the numeric field.
 * @param {boolean} bZeroIsNotAllowed - If you want to have
 *  a specific error message for numeric fields that the user
 *  left with a zero value, set this to TRUE.  Otherwise,
 *  only the range bound validations will be done.
 */
function validateRangeBoundNumericField(alpacaFormObj, funcValCallback, fieldDesc, lowerBound, upperBound, bZeroIsNotAllowed=false) {
	const errPrefix = `(validateRangeBoundNumericField) `;

	// Validate the input parameters.
	if (!misc_shared_lib.isNonNullObjectAndNotArray(alpacaFormObj))
		throw new Error(`${errPrefix}The alpacaFormObj is not a valid object.`);

	if (typeof alpacaFormObj.getValue !== 'function')
		throw new Error(`${errPrefix}The Alpaca form object does not have a getValue() function.`);

	if (typeof funcValCallback !== 'function')
		throw new Error(`${errPrefix}The value in the funcValCallback parameter is not a function.`);

	if (misc_shared_lib.isEmptySafeString(fieldDesc))
		throw new Error(`${errPrefix}The fieldDesc parameter is empty.`);

	if (typeof lowerBound !== 'number')
		throw new Error(`${errPrefix}The value in the lowerBound parameter is not a number.`);

	if (typeof upperBound !== 'number')
		throw new Error(`${errPrefix}The value in the upperBound parameter is not a number.`);

	if (lowerBound > upperBound)
		throw new Error(`${errPrefix}The lower bound value(${lowerBound}) is greater than the upper bound value: ${upperBound}`);

	if (typeof bZeroIsNotAllowed !== 'boolean')
		throw new Error(`${errPrefix}The value in the bZeroIsNotAllowed parameter is not boolean.`);

	// Get this field's current value.
	let fldValue = alpacaFormObj.getValue();

	if (typeof fldValue !== 'number')
		throw new Error(`${errPrefix}The value in the ${fieldDesc} field is not a number.`);

	let validationErrMsg = '(unknown)';

	if (bZeroIsNotAllowed) {
		validationErrMsg = fldValue < 0 ? `The ${fieldDesc}} can not be negative.` : `The ${fieldDesc}} can not be 0.`;
		validationErrMsg += `It must be greater than 0.`;

		// Zero is not allowed.  Give a specific error message
		//  to help the user correct that condition.
		if (fldValue < 1) {
			funcValCallback({
				"status": false,
				"message": validationErrMsg
			});
			return;
		}
	}

	// Range based validation logic.
	if (fldValue < lowerBound) {
		// If the lower bound is zero, change the error message
		//  to one about negative values not being allowed.
		const subErrMsg = lowerBound === 0 ? ' can not be negative' : 'is too small';
		funcValCallback({
			"status": false,
			"message": `The ${fieldDesc}} ${subErrMsg}.`
		});
		return;
	}

	if (fldValue > upperBound) {
		funcValCallback({
			"status": false,
			"message": `The ${fieldDesc}} is too large.`
		});
		return;
	}

	// The field is valid.
	funcValCallback({
		"status": true
	});
}

/**
 * This is a helper function meant to be used inside the custom validation
 *  bocks you can create for Alpaca form fields.  It does basic validation
 *  of string fields.
 *
 * @param {object} alpacaFormObj - A valid Alpaca form object.
 * @param {function} funcValCallback - The post-validation
 *  callback function.
 * @param {string} fieldDesc - A short string describing the field.
 *  Used in error messages.
 * @param {number|null} minLength - The minimum length that the string
 *  value must have, AFTER trimming for whitespace. If you pass NULL,
 *  then no length check is made.  However, empty strings are stll
 *  not allowed.
 *
 */
function validateStringField_basic(alpacaFormObj, funcValCallback, fieldDesc, minLength=null) {
	const errPrefix = `(validatetringField_basic) `;

	// Validate the input parameters.
	if (!misc_shared_lib.isNonNullObjectAndNotArray(alpacaFormObj))
		throw new Error(`${errPrefix}The alpacaFormObj is not a valid object.`);

	if (typeof alpacaFormObj.getValue !== 'function')
		throw new Error(`${errPrefix}The Alpaca form object does not have a getValue() function.`);

	if (typeof funcValCallback !== 'function')
		throw new Error(`${errPrefix}The value in the funcValCallback parameter is not a function.`);

	if (misc_shared_lib.isEmptySafeString(fieldDesc))
		throw new Error(`${errPrefix}The fieldDesc parameter is empty.`);

	if (minLength !== null) {
		if (typeof minLength !== 'number')
			throw new Error(`${errPrefix}The value in the minLength parameter is not NULL, yet it is not a number either.`);
		if (minLength < 0)
			throw new Error(`${errPrefix}The value in the minLength parameter is negative.`);
	}

	// Get this field's current value.
	let fldValue = alpacaFormObj.getValue();

	if (typeof fldValue !== 'string')
		throw new Error(`${errPrefix}The value in the ${fieldDesc} field is not a string.`);

	let validationErrMsg = '(unknown)';

	if (misc_shared_lib.isEmptySafeString(fldValue)) {
		funcValCallback({
			"status": false,
			"message": `The ${fieldDesc} can not be empty.`
		});
		return;
	}

	// If a minLength value greater than 0 was provided, make
	//  sure the target string is at least that length, after
	//  trimming for whitespace.
	if (minLength && fldValue.trim().length < minLength) {
		funcValCallback({
			"status": false,
			"message": `The ${fieldDesc} field must be at least ${minLength} characters in length.`
		});
		return;
	}

	// The field is valid.
	funcValCallback({
		"status": true
	});
}

