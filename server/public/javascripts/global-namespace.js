/**
 * This file declares the "global" namespace and some commonly needed constants.
 */

let misc_shared_lib = null;

// Use this code on both client and server side.  Are we on the server side?
if (typeof module == 'undefined' || typeof module.exports == 'undefined')
{
	// No. misc_shared_lib is already in the client side global namespace.
	misc_shared_lib = window.misc_shared_lib;
} else {
	// Yes.  Require the misc_shared_lib module.
	misc_shared_lib = require('../../public/javascripts/misc/misc-shared-lib');
}

// The HTML element ID for the DIV we use to show floating popup dialogs.
const g_FloatingPopupDivId = 'floating-popup-div';

// Turn the above into a jQuery selector.
const g_FloatingPopupDiv_selector = '#' + g_FloatingPopupDivId;

// The DIV that contains the Select2 element with the
//  cryptocurrency symbols.
const g_CryptoSymbolSelect2DivId = 'crypto-symbol-select2-div';

// Make the above a selector.
const g_CryptoSymbolSelect2DivId_selector = '#' +  g_CryptoSymbolSelect2DivId;

// Current Neodao transaction fee percentage.
const g_SystemTransactionFeePercentage = 2;

// This variable should be kept updated by the various
//  web pages in the front end.
let g_CurrentAssetSymbol = '(no asset symbol selected yet)';

// All price quotes to be denominated in this currency.
// const g_PreferredTargetCurrency = 'USD';
const g_PreferredTargetCurrency = 'GAS';

// This is the currency we use for 'reference' since
//  getting desired elements like graphs denominated in
//  NEO gas is not possible at the time.  So we use USD
//  in those case.
const g_AlternateTargetCurrency = 'USD';

// Price related pages will need a cryptocurrency asset details object so the user can select the
//  cryptocurrency symbol they are interested in.  Those pages MUST call the
//	initializeCommonPriceElements_promise() method found in the g_GlobalNamespaces object.
let g_CryptoSymbolAndDescObj = null;

// Common HTML blocks.

// CONSTANTS

// The valid mode values for the list contrax "mode" parameter.
//  See listContraxByParticipantId() for details.
const g_AryListContraxModes = ['open', 'expired_paid', 'expired_unpaid'];

// The name of the cookie contains the user's default NeoLine
//  account.
const COOKIE_NAME_DEFAULT_NEOLINE_ACCOUNT_ADDRESS = 'default_neoline_account';

// The name of the cookie contains the label for the user's default NeoLine
//  account.
const COOKIE_NAME_DEFAULT_NEOLINE_ACCOUNT_LABEL = 'default_neoline_account_label';

/**
 * This object keeps the most commonly shared elements by the code
 * 	in a central place.
 *
 * @constructor
 */
function GlobalNamespaces()
{
	const self = this;

	/** @property {String} - URL to the app configuration file. */
	this.urlMyConfigJS = '/api-noauth/myconfig';

	// Back-end server API URLs.

	// -------------------- BEGIN: create-offer related API calls ------------

	/** @property {String} - URL to the API route that creates an offer. */
	this.urlCreateOffer = '/api/create-offer';

	/** @property {String} - URL to the API route that deletes an offer. */
	this.urlDeleteOffer = '/api/delete-offer';

	/** @property {String} - URL to the API route that lists the available offers. */
	this.urlListOffers = '/api/list-offer';

	/** @property {String} - URL to the API route that updates an offer. */
	this.urlUpdateOffer = '/api/update-offer';

	// -------------------- END  : create-offer related API calls ------------

	// -------------------- BEGIN: contrax-details related API calls ------------

	/** @property {String} - URL to the API route that creates an create a contrax details record (N/A). */
	this.urlCreateContrax = '/api/null';

	/** @property {String} - URL to the API route that deletes a contrax details record (N/A). */
	this.urlDeleteContrax = '/api/null';

	/** @property {String} - URL to the API route that lists the currently open option contracts
	 * 	for a user. */
	this.urlListContraxForUser = '/api/list-contrax-for-user';

	/** @property {String} - URL to the API route that updates an a contrax details record (N/A/). */
	this.urlUpdateontrax = '/api/null';

	// -------------------- END  : contrax-details related API calls ------------

	// -------------------- BEGIN: OTHER API CALLS ------------

	/** @property {String} - URL to the API route that returns the current
	 * 		list of cryptocurrency symbols we support along with their
	 * 		and descriptions. */
	this.urlGetCryptoSymblsAndDesc = '/api/get-cryptocurrency-asset-list';

	/** @property {String} - URL to the API route that returns the current
	 * 		list of cryptocurrency symbols we support along with their
	 * 		and descriptions. */
	this.urlGetCryptoCurrencyPrice = '/api/get-cryptocurrency-price';


	/** @property {String} - URL to the API route that returns the one
	 * 		or more configuration variables.  */
	this.urlGetServerConfigVars = '/api/get-config-vars'

	// -------------------- END  : OTHER API CALLS ------------

	// -------------------- BEGIN: OTHER GLOBAL ITEMS ------------

	/** @property {Object} - Upon construction, this variable will be filled
	 * 	in with the server configuration variables object received
	 * 	from the server. */
	this.serverConfigVars = {};

	// -------------------- END  : OTHER GLOBAL ITEMS ------------


	/**
	 * Validate the given value as being a valid list contrax mode value.
	 *
	 * @param {String} mode - The value to validate.
	 *
	 * @return {boolean} - Returns TRUE if "mode" is a valid list contrax
	 * 	mode value, FALSE if not.
	 */
	this.isValidListContraxMode = function(mode) {
		let methodName = self.constructor.name + '::' + `isValidListContraxMode`;
		let errPrefix = '(' + methodName + ') ';

		if (misc_shared_lib.isEmptySafeString(mode))
			throw new Error(errPrefix + `The mode parameter is empty.`);

		return g_AryListContraxModes.includes(mode);
	}

	/**
	 * This method initializes the frequently used price related
	 * 	elements.
	 *
	 * @param {Function} [funcOnAssetSymbolChanged] - Optional function that
	 * 	will be called whenever the currently selected option in
	 * 	the cryptocurrency select box is changed.
	 *
	 * @return {Promise<Boolean>} - This promise resolves to TRUE
	 * 	upon success, or rejects upon error.
	 */
	this.initializeCommonPriceElements_promise = function(funcOnAssetSymbolChanged=null) {
		let methodName = self.constructor.name + '::' + `initializeCommonPriceElements_promise`;
		let errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (funcOnAssetSymbolChanged) {
					if (typeof funcOnAssetSymbolChanged !== 'function')
						throw new Error(errPrefix + `The value in the funcOnAssetSymbolChanged parameter is not NULL, yet it is not a function either.`);
				}

				if (!misc_shared_lib.isValidJQuerySelector(g_CryptoSymbolSelect2DivId_selector))
					throw new Error(errPrefix + `Unable to find the host DIV for the cryptocurrency select box using element ID: ${g_CryptoSymbolSelect2DivId_selector}.`);

				// Create a CryptoCurrencySymbolAndDescListManager object for our use.
				//  Tell it to call our method that fetches the latest asset price
				//	whenever the user selects a new asset symbol.
				g_CryptoSymbolAndDescObj =
					new CryptoCurrencySymbolAndDescListManager(
						g_CryptoSymbolSelect2DivId_selector,
						funcOnAssetSymbolChanged
					);

				g_CryptoSymbolAndDescObj.initializeCryptoCurrencySymbolList_promise(funcOnAssetSymbolChanged)
					.then(result => {
						// The result should be the pre-selected asset symbol.
						if (typeof result !== 'string')
							throw new Error(errPrefix + `The result of the initializeCryptoCurrencySymbolList_promise() call is not a string.`);

						console.info(errPrefix + `The pre-selected asset symbol returned by initializeCryptoCurrencySymbolList_promise() is : ${result}.`);

						resolve(true);
					})
					.catch(err => {
						let errMsg =
							errPrefix + misc_shared_lib.conformErrorObjectMsg(err);

						console.error(errPrefix + `Error during document ready handler: ${errMsg}.`);
						reject(errMsg);
					});
			}
			catch(err) {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + conformErrorObjectMsg(err);

				console.error(errPrefix + `Error during document ready handler: ${errMsg}.`);
				reject(errMsg);
			}
		});
	}


	/**
	 * Initialize this object by requesting the server side configuration
	 * 	variables from the server.
	 *
	 * IMPORTANT!: Remember to call this method from an appropriate
	 * 	place in the document ready chain!
	 *
	 * @param {Boolean} bIsPriceRelatedPage - If TRUE, then our
	 * 	method that initializes the common price related elements
	 * 	will be automatically called.  If FALSE, then they won't.
	 * 	Pages that have price related elements or operations
	 * 	should set this variable to TRUE.
	 * @param {Function} [funcOnAssetSymbolChanged] - Optional function that
	 * 	will be called whenever the currently selected option in
	 * 	the cryptocurrency select box is changed.
	 *
	 * @return {Promise<Object>} - The promise resolves to TRUE
	 *  on success, rejects on error.
	 */
	this.initializeGlobals_promise = function(bIsPriceRelatedPage, funcOnAssetSymbolChanged=null) {
		let methodName = self.constructor.name + '::' + `initializeGlobals_promise`;
		let errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (typeof bIsPriceRelatedPage !== 'boolean')
					throw new Error(errPrefix + `The value in the bIsPriceRelatedPage parameter is not boolean.`);
				if (funcOnAssetSymbolChanged) {
					if (typeof funcOnAssetSymbolChanged !== 'function')
						throw new Error(errPrefix + `The value in the funcOnAssetSymbolChanged parameter is not NULL, yet it is not a function either.`);
				}

				xhrPost_promise(self.urlGetServerConfigVars, null)
					.then(progressEvent => {

						const serverConfigVarsObj = progressEvent.target.response;

						// If an error occurs and the error message carries the flag to show it to the user
						//  then the checkServerReturnForError() method will do so.
						if (!checkServerReturnForError('Retrieving server configuration variables.', serverConfigVarsObj)) {
							if (!misc_shared_lib.isNonNullObjectAndNotArray(serverConfigVarsObj)) {
								console.info(errPrefix + `Error server configuration variables attempt.  "response" object:`);
								console.dir(serverConfigVarsObj, {depth: null, colors: true});

								throw new Error(errPrefix + `The server response is not a valid object.`);
							}

							// Store it.
							self.serverConfigVars = serverConfigVarsObj.message;

							let promiseToExec = null;

							// Is a price related page calling us?
							if (bIsPriceRelatedPage)
								// Execute our method that initializes common price related
								//	elements.
								promiseToExec = self.initializeCommonPriceElements_promise(funcOnAssetSymbolChanged);
							else
								// Resolve immediately to true.
								promiseToExec = Promise.resolve(true);

							return promiseToExec;
						}
					})
					.then(result => {
						if (result !== true)
							throw new Error(errPrefix + `The result of the previous step was not TRUE.`);

						// Resolve the promise with the TRUE..
						resolve(true);
					})
					.catch(err => {
						// Convert the error to a promise rejection.
						let errMsg =
							errPrefix + conformErrorObjectMsg(err);

						reject(errMsg + ' - promise');
					});
			}
			catch(err) {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + conformErrorObjectMsg(err);

				reject(errMsg + ' - try/catch');
			}
		});
	}
};

/**
 * Singleton pattern.
 */
const g_GlobalNamespaces = new function ()
{
	const self = this;

	this.instance = new GlobalNamespaces();
}();

// Use this code on both client and server side.  Are we on the server side?
if (typeof module == 'undefined' || typeof module.exports == 'undefined')
{
	// No. g_GlobalNamespaces is already in the client side global namespace.
} else {
	// Yes.  Export the code so it works with require().
	module.exports =
		{
			g_GlobalNamespaces: g_GlobalNamespaces
		}
}