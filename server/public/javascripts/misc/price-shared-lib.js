// This file contains some utility functions to make working with
//	price related objects and data easier.

// BigInteger values are created by taking a float and
//  multiplying it by 10^8, then truncating the
//  result.
const BIGINTEGER_MULTIPLIER = Math.pow(10, 8);

// The prediction market smart contract uses NEO GAS as its native currency.
//  This is its asset symbol.
const ASSET_SYMBOL_SMART_CONTRACT_CURRENCY = 'GAS';

// The asset symbol for NEO tokens.
const ASSET_SYMBOL_NEO_TOKEN = 'NEO';

/**
 * Helper function that gets the price from a Cryptocompare API
 * 	call result object, based on the desired target currency.
 *
 * NOTE: This function does NOT do any kind of currency conversion,
 * 	it merely look for a field in the result object that has the
 * 	given target currency symbol as its field name.
 *
 * @param {Object} resultObj - A result object from a Cryptocompare
 * 	price API call.
 * @param {String} targetCurrSymbol - The symbol for the desired
 * 	currency.  There must be a field name in the result object
 * 	with this name or this function will throw an error.
 *
 * @return {Number} - Returns the price in numeric fractional
 * 	format.
 */
function getPriceByCurrencyFromResultObj(resultObj, targetCurrSymbol='USD') {
	let errPrefix = `(getPriceByCurrencyFromResultObj) `;
	
	if (!misc_shared_lib.isNonNullObjectAndNotArray(resultObj))
		throw new Error(errPrefix + `The resultObj is not a valid object.`);
	if (misc_shared_lib.isEmptySafeString(targetCurrSymbol))
		throw new Error(errPrefix + `The targetCurrSymbol parameter is empty.`);
		
	if (!(targetCurrSymbol in resultObj))
		throw new Error(errPrefix + `The Cryptocompare result object does not have a field named(target currency): ${targetCurrSymbol}.`);
		
	return resultObj[targetCurrSymbol];
}

/**
 * This helper function checks to see if the given value is
 * 	a valid price.  If it is, the price will be returned.
 * 	A valid price must be a floating point or
 * 	integer number.
 *
 * @param {String|Number} priceStrOrNumber - The value to validate.
 * @param {Boolean} [bConvertIfString] - If TRUE, then if the
 * 	value is a string, it will be converted to a number before
 * 	validating it.  If FALSE, it won't.
 * @param {Boolean} [bErrorIfNotValid] - If TRUE, then an error
 * 	will be thrown if the value is not a valid price.  If FALSE,
 * 	then NULL will be returned.
 *
 * @return {null|Number} - Returns the original price if it is a
 *  valid price.  If the value was a string and conversion was
 *  allowed, it will be the value in numeric format.  All other
 *  pathways result in either an error being thrown or NULL
 *  being returned, depending on the bConvertIfString and
 *  bErrorIfNotValid settings.
 */
function validatePrice(priceStrOrNumber, bConvertIfString= false, bErrorIfNotValid=true) {
	const errPrefix = `(validatePrice) `;
	
	if (priceStrOrNumber === null)
		throw new Error(errPrefix + `The priceStrOrNumber parameter is NULL.`);
	if (priceStrOrNumber === 'undefined')
		throw new Error(errPrefix + `The priceStrOrNumber parameter is undefined.`);
	if (typeof bConvertIfString !== 'boolean')
		throw new Error(errPrefix + `The value in the bConvertIfString parameter is not boolean.`);
	if (typeof bErrorIfNotValid !== 'boolean')
		throw new Error(errPrefix + `The value in the bErrorIfNotValid parameter is not boolean.`);
		
	// Throw an error if that is desired, return NULL if not.
	function handleError(errMsg) {
		if (bErrorIfNotValid)
			throw new Error(errPrefix + `${errMsg}`);
		return null;
	}
	
	let retVal = priceStrOrNumber;
	
	if (typeof priceStrOrNumber === 'string') {
		// Conversion allowed?
		if (bConvertIfString) {
			// Yes.  Attempt it.  If the conversion fails,
			//  then retVal will be NULL.
			retVal = misc_shared_lib.parseIntIfNeededOrNull(priceStrOrNumber);
			
			if (retVal === null)
				return handleError(`The value can not be converted to a number.  Value received: ${priceStrOrNumber}.`);
		} else {
			// Numbers in string format are not allowed.
			return handleError(`The value is a string and strings are not allowed because the bConvertIfString parameter is FALSE.  Value received: ${priceStrOrNumber}.`);
		}
	}
	
	if (typeof retVal !== 'number')
		return handleError(`The value is not a number.`);
	// Check for NaN value.
	if (isNaN(retVal))
		return handleError(`The value is a number but it is "Nan", which is an invalid value for a price.`)

	return retVal;
}

/**
 * Convert a float to a BigInteger value by multiplying by the
 * 	BigInteger multiplier and then truncating it.
 *
 * @param {Number} theFloat - The float to convert.
 *
 * @return {Number} - Returns the BigInteger encoding of the
 * 	given float.
 */
function convertFloatToBigInteger(theFloat) {
	let errPrefix = `(convertFloatToBigInteger) `;
	
	if (typeof theFloat !== 'number')
		throw new Error(errPrefix + `The value in the theFloat parameter is not a number.`);
		
	let retVal = theFloat * BIGINTEGER_MULTIPLIER;
	
	retVal = Math.trunc(retVal);
	return retVal;
}

// Use this code on both client and server side.  Are we on the server side?
if (typeof module == 'undefined' || typeof module.exports == 'undefined')
{
	// No, make it part of the global Javascript namespace.
	window.price_shared_lib = {};
	window.price_shared_lib.BIGINTEGER_MULTIPLIER = BIGINTEGER_MULTIPLIER;
	window.price_shared_lib.convertFloatToBigInteger = convertFloatToBigInteger;
	window.price_shared_lib.getPriceByCurrencyFromResultObj = getPriceByCurrencyFromResultObj;
	window.price_shared_lib.validatePrice = validatePrice;
}
else
{
	// Yes.  Export the code so it works with require().
    module.exports =
		{
			BIGINTEGER_MULTIPLIER: BIGINTEGER_MULTIPLIER,
			ASSET_SYMBOL_NEO_TOKEN: ASSET_SYMBOL_NEO_TOKEN,
			ASSET_SYMBOL_SMART_CONTRACT_CURRENCY: ASSET_SYMBOL_SMART_CONTRACT_CURRENCY,
			convertFloatToBigInteger: convertFloatToBigInteger,
			getPriceByCurrencyFromResultObj: getPriceByCurrencyFromResultObj,
			validatePrice: validatePrice
		};
}
