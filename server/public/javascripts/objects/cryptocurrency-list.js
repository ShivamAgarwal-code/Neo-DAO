// This file contains the code for an object that handles the details of build
//  a cryptocurrency details list, including support for "select2" compatible
//	options boxes.

const g_InitiallySelectedCryptoCurrencySymbol = 'NEO';

/**
 * Use an instance of this object to have a managed list of cryptocurrency
 * 	asset symbols along with their associated details.
 *
 * @param {String} select2DivId - The ID of the HTML select element that
 * 	the "select2" content should be displayed in.
 * @param {Function|null} [funcOnChange] - If not NULL, then this function
 * 	will be called whenever the selected cryptocurrency asset symbol
 * 	changes.
 *
 * @constructor
 */
function CryptoCurrencySymbolAndDescListManager(select2DivId, funcOnChange=null) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	if (misc_shared_lib.isEmptySafeString(select2DivId))
		throw new Error(errPrefix + `The select2DivId parameter is empty.`);
		
	if (funcOnChange !== null) {
		if (typeof funcOnChange !== 'function')
			throw new Error(errPrefix + `The value in the funcOnChange parameter is not NULL, but it is not a function either.`);
	}

	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = misc_shared_lib.getSimplifiedUuid();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {Object} - This variable will have the main cryptocurrency
	 * 	asset details object once the document ready handler fills it in. */
	this.cryptoCurrencyAssetDetailsObj = null;
	
	/** @property {Object} - This variable will contain  cryptocurrency symbol
	 *	and description array in a format that is compatible with select2, once
	 *	the document ready handler fills it in. */
	this.aryCryptoCurrencyOptionBoxElements = null;
	
	/** @property {String} - The ID of the HTML "select" options box that
	* 	will use this data to show a selection box.  */
	this.select2DivId = select2DivId;
	
	/** @property {Function|null} - If not NULL, then this function will be
	* 		called whenever the user changes the selected cryptocurrency.
	*/
	this.funcOnChange = funcOnChange;
	
	/**
	 * Ask our server for the latest get-cryptocurrency-asset-list.
	 *
	 * @return {Promise<Object>} - Returns the cryptocurrency symbol
	 * 	and description array received from the server.
	 */
	this.getCryptoCurrencySymbolAndDescList_promise = function () {
		let methodName = self.constructor.name + '::' + `getCryptoCurrencySymbolAndDescList_promise`;
		
		return new Promise(function(resolve, reject) {
			try	{
				
				// Call the back end server via a POST request.
				xhrPost_promise(g_GlobalNamespaces.instance.urlGetCryptoSymblsAndDesc, {})
				.then(progressEvent => {
					// Access the sub-scene rendering information.
					let result = progressEvent.target.response;
					
					if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
						throw new Error(errPrefix + `The result of the urlGetCryptoSymblsAndDesc API call is not a valid object.`);
						
					console.info(errPrefix + `RECEIVED cryptocurrency symbol and description array from server.`);
					
					// Resolve the promise with this value.
					resolve(result);
				})
				.catch(err => {
					// Show the error.
					let errMsg =
						errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
					errMsg += ' - promise';
					
					reject(errMsg + ' - try/catch, promise');
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
	
	/**
	 * Compensate for the problems we are having with the select2 list-box.
	 */
	this.updateAndFixSelect2ListBox = function() {
		let methodName = self.constructor.name + '::' + `updateAndFixSelect2ListBox`;
		let errPrefix = '(' + methodName + ') ';
		
		function doTheFix() {
			const valSelected = $(self.select2DivId).val();
			
			if (self.funcOnChange)
				self.funcOnChange(valSelected);
			
			// Hide the SPAN that select2 creates.  It is redundant.
			$('.select2-selection__rendered').hide();
		}
	
		// We handle the "selected" event for the primary list-box
		//  rendered by the select2 control, due to the current problems
		//  we are having with it treating the SPAN it creates as a
		//  list-box.
		$(g_CryptoSymbolSelect2DivId_selector).change(function () {
			doTheFix();
			return false;
		});
	
		// Make the initial call to fetch the selected cryptocurrency
		//  asset price and create an Alpaca form for it.
		doTheFix();
	}
	
	/**
	 * Initialize this object with the cryptocurrency asset list details.
	 * 
	 * @param {Function} [funcOnAssetSymbolChanged] - Optional function that
	 * 	will be called whenever the currently selected option in
	 * 	the cryptocurrency select box is changed.
	 *
	 * @return {Promise<String>} - Resolves to the pre-selected asset symbol.
	 */
	this.initializeCryptoCurrencySymbolList_promise = function(funcOnAssetSymbolChanged=null) {
		let methodName = self.constructor.name + '::' + 'initializeCryptoCurrencySymbolList_promise';
		let errPrefix = '(' + methodName + ') ';
		
		return new Promise(function(resolve, reject) {
			try	{
				if (funcOnAssetSymbolChanged) {
					if (typeof funcOnAssetSymbolChanged !== 'function')
						throw new Error(errPrefix + `The value in the funcOnAssetSymbolChanged parameter is not NULL, yet it is not a function either.`);
				}
				
				// Get the cryptocurrency symbol and description array from our server.
				self.getCryptoCurrencySymbolAndDescList_promise()
				.then(result => {
					if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
						throw new Error(errPrefix + `The result of our getCryptoCurrencySymbolAndDescList_promise() call is not a valid object.`);
						
					// Save it.
					self.aryCryptoCurrencyOptionBoxElements = result;
					
					let aryAssetSymbolAndDescriptions =
						self.aryCryptoCurrencyOptionBoxElements.aryAssetSymbolAndDescriptions;
						
					if (!Array.isArray(aryAssetSymbolAndDescriptions))
						throw new Error(errPrefix + `The aryAssetSymbolAndDescriptions variable is not an array.`);
						
					if (aryAssetSymbolAndDescriptions.length < 1)
						throw new Error(errPrefix + `The aryAssetSymbolAndDescriptions array is empty`);
						
					// Build an array compatible with select2.
					let aryCryptoCurrencyOptionBoxElements = [];
					
					// TODO: Pre-select the NEO GAS token.
					// Pre-select the NEO token.
					let selectedAssetSymbol = null;
					
					for (let ndx = 0; ndx < aryAssetSymbolAndDescriptions.length; ndx++) {
						const bIsDesiredAssetSymbol =
							aryAssetSymbolAndDescriptions[ndx].name === g_InitiallySelectedCryptoCurrencySymbol;
							
						aryCryptoCurrencyOptionBoxElements.push(
							{
								id: aryAssetSymbolAndDescriptions[ndx].name,
								text: aryAssetSymbolAndDescriptions[ndx].description,
								selected: bIsDesiredAssetSymbol
							});
							
						if (bIsDesiredAssetSymbol)
							selectedAssetSymbol = aryAssetSymbolAndDescriptions[ndx].name;
					}
					
					if (!selectedAssetSymbol)
						throw new Error(errPrefix + `We did not find the desired asset symbol in the received asset list: ${g_InitiallySelectedCryptoCurrencySymbol}.`);
				 
					// Build the option box for picking the desired cryptocurrency for the
					//  OFFER.
					$(self.select2DivId).select2({data: aryCryptoCurrencyOptionBoxElements});
					// $(self.select2DivId).select2({placeholder: 'hello'});
					
					// Bind the "selected" event to the the funcChange function
					//  we were passed during construction.  Pass it the value selected.
					/*
					$('#crypto-symbol-select2-div').on("select2:select", function (e) {
						const valSelected = $(self.select2DivId).select2().val();
    					self.funcOnAssetSymbolChanged(valSelected);
					});
					*/
					
					// Bind the on-change event to the one provided, if it is not NULL.
					// if (self.funcOnAssetSymbolChanged)
					// 	$(self.select2DivId).change(self.funcOnAssetSymbolChanged);
					
					// Call the funcOnAssetSymbolChanged function for the initially selected
					//  cryptocurrency symbol, if we have both of those.
					self.updateAndFixSelect2ListBox();
					
					resolve(selectedAssetSymbol);
				})
				.catch(err => {
					// Convert the error to a promise rejection.
					let errMsg =
						errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
					
					reject(errMsg + ' - promise');
				});
			}
			catch(err) {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
				
				reject(errMsg + ' - try/catch');
			}
		});
	}
}
