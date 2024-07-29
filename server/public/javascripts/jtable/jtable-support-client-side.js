/**
 * This file contains client side code to support the jTable component.
 */

// Set this to TRUE to not the advanced fields.
const  g_IsAdvancedMode = false;

// The recordsLoaded event will put the array of records
//  loaded by the jTable instance.
let g_CurrentRecords = null;

/**
 * This object is used to configure various jTables for each different
 * 	data set.
 *
 * @param {String} idHostDiv - The ID of the DIV that the jTable instance
 * 	will live in.
 * @param {String} urlCreate - The URL that calls the server API that creates a record.
 * @param {String} urlDelete - The URL that calls the server API that deletes a record.
 * @param {String} urlList - The URL that calls the server API that list records.
 * @param {String} urlUpdate - The URL that calls the server API that updates a record.
 * @param {Object} fieldDefinitions - A list of standard jTable field definitions,
 * 	that jTable about the fields in a record and tell it how to present them
 * 	visually.
 * @param {Boolean} [bEnableUpdateActions] - If TRUE, then each row
 * 	in the displayed table will have a Edit and Delete button,
 * 	if FALSE, then they will not be displayed.
 * @param {Function} funcGetPostData - This function will be called to get the
 * 	POST data for the action JTable is executing.  It will be passed the
 * 	current action verb: create, delete, list, update.
 * @param {Object} overrideJTableParameters - Any fields in this object that bear
 * 	the name of jTable top level parameter will override the default value for that
 * 	parameter in the jTable when it is created.  (e.g. - paginationSize, etc.)
 * @param {Object} additionalApiRequestHeaders - Any additional headers that should be
 * 	added to the request header when any of the record management API calls are made.  A
 * 	common example of this is adding a bearer token, to facilitate authenticated
 * 	access.
 *
 * @constructor
 */
function JTableManager(
		idHostDiv,
		urlCreate,
		urlDelete,
		urlList,
		urlUpdate,
		funcGetPostData,
		fieldDefinitions,
		bEnableUpdateActions=true,
		overrideJTableParameters={},
		additionalApiRequestHeaders={}) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	// Validate parameters.
	if (misc_shared_lib.isEmptySafeString(idHostDiv))
		throw new Error(errPrefix + `The idHostDiv parameter is empty.`);
	
	validateUrlParameter(urlCreate, 'urlCreate');
	validateUrlParameter(urlDelete, 'urlDelete');
	validateUrlParameter(urlList, 'urlList');
	validateUrlParameter(urlUpdate, 'urlUpdate');
	
	if (!misc_shared_lib.isNonNullObjectAndNotArray(fieldDefinitions))
		throw new Error(errPrefix + `The fieldDefinitions is not a valid object.`);
		
	// Extra check to see if the field definitions object is empty, because it must
	//  have some field definitions.
	if (Object.keys(fieldDefinitions).length < 1)
		throw new Error(errPrefix + `The field definition object is empty.`);
		
	if (typeof bEnableUpdateActions !== 'boolean')
		throw new Error(errPrefix + `The value in the bEnableUpdateActions parameter is not boolean.`);
		
	if (!misc_shared_lib.isNonNullObjectAndNotArray(overrideJTableParameters))
		throw new Error(errPrefix + `The overrideJTableParameters is not a valid object.`);
	if (!misc_shared_lib.isNonNullObjectAndNotArray(additionalApiRequestHeaders))
		throw new Error(errPrefix + `The additionalHeaders is not a valid object.`);
		
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = misc_shared_lib.getSimplifiedUuid();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {String} - The ID of the DIV that the jTable instance will live in. */
	this.idHostDiv = idHostDiv;
	
	/** @property {String} - The URL that calls the server API that creates a record. */
	this._urlCreate = urlCreate;
	
	/** @property {String} - The URL that calls the server API that lists records. */
	this._urlList = urlList;
	
	/** @property {String} - The URL that calls the server API that updates a record. */
	this._urlUpdate = urlUpdate;
	
	/** @property {String} - The URL that calls the server API that deletes a record. */
	this._urlDelete = urlDelete;
	
	/** @property {Object} - fieldDefinitions - A list of standard jTable field definitions,
	 * 	that jTable about the fields in a record and tell it how to present them
	 * 	visually. */
	this._fieldDefinitions = fieldDefinitions;

	/** @property {Boolean} - If TRUE, then each row in the displayed table will have an
	 * 	Edit and Delete button,	if FALSE, then they will not be displayed.
 	 */
	this._enableUpdateActions = bEnableUpdateActions;
	
	/** @property {Object} - overrideJTableParameters - Any fields in this object that bear
 	 * 	the name of jTable top level parameter will override the default value for that
 	 * 	parameter in the jTable when it is created.  (e.g. - paginationSize, etc.) */
 	this._overrideJTableParameters = overrideJTableParameters;
	
	/** @property {Object} - additionalApiRequestHeaders - Any additional headers that should be
	 * 	added to the request header when any of the record management API calls are made.  A
	 * 	common example of this is adding a bearer token, to facilitate authenticated
	 * 	access. */
	this._additionalApiRequestHeaders = additionalApiRequestHeaders;
	
	/**
	 * Validate the given action verb as being one of the values
	 * 	we accept.  Throws an error if it is not valid.
	 *
 	 * @param {String} actionVerb - The action verb to validate.
 	 *
	 * @private
	 */
	this._validateActionVerb = function(actionVerb) {
		let methodName = self.constructor.name + '::' + `_validateActionVerb`;
		let errPrefix = '(' + methodName + ') ';
		
		if (misc_shared_lib.isEmptySafeString(actionVerb))
			throw new Error(errPrefix + `The actionVerb parameter is empty.`);
			
		if (!(['create', 'delete', 'list', 'update'].includes(actionVerb)))
			throw new Error(errPrefix + `Invalid action verb: ${actionVerb}`);
	}
 	
	/**
	 * jTable passes the postData elements to actions that are fully defined as a string
	 * 	during an add action, and an object during an update action.  This function
	 * 	converts string POST data to an object.
	 *
	 * @param {Object|string|null} [postDataAsStrOrObj] - Either an object, a string, or NULL,
	 *  or undefined.
	 *
	 * @return {Object} - Returns the encoded string as an object or if an object leaves
	 * 	the object alone.  If the postData is NULL or undefined, an empty object will be returned.
	 *
	 * @private
	 */
	this._postDataAsStringToObject = function(postDataAsStrOrObj) {
		let methodName = self.constructor.name + '::' + `_postDataAsStringToObject`;
		let errPrefix = '(' + methodName + ') ';
	
		let retObj = new Object();

		if (!misc_shared_lib.isNonNullObjectAndNotArray(postDataAsStrOrObj))
			throw new Error(errPrefix + `The postDataAsStrOrObj is not a valid object.`);
		
		if (typeof postDataAsStrOrObj == 'string') {
			let aryElements = postDataAsStrOrObj.split('&');
			
			for (let ndx = 0; ndx < aryElements.length; ndx++) {
				let aryNameValuePair = aryElements[ndx].split('=');
				
				retObj[aryNameValuePair[0]] = decodeURIComponent(aryNameValuePair[1]);
			}
		} else if (typeof postDataAsStrOrObj === 'object') {
			// Just return it.
			return postDataAsStrOrObj;
		} else
			throw new Error(errPrefix + 'The POST data parameter is an invalid type.');
		
		return retObj;
	}
	
	/**
	 * Given an API post data package, add whatever other POST data elements are necessary to
	 * 	make the API call properly.
	 *
	 * @param {string} postDataAsStr - The POST data package that is being sent to the server.
	 *
	 * @param {string} url - The POST data to finalize.
	 */
	function _finalizeApiPostData(postDataAsStr) {
		let methodName = self.constructor.name + '::' + `_finalizeApiPostData`;
		let errPrefix = '(' + methodName + ') ';
		
		if (misc_shared_lib.isEmptySafeString(postDataAsStr))
			throw new Error(errPrefix + `The postDataAsStr parameter is empty.`);
		
		let finalPostData = self._postDataAsStringToObject(postDataAsStr);
		
		return finalPostData;
	}
	
	/**
	 * Tell the jTable data to load itself with data from out server.
 	 */
	this.loadOrReload = function ()
	{
		let methodName = self.constructor.name + '::' + `loadOrReload`;
		let errPrefix = '(' + methodName + ') ';
		
		$('#' + self.idHostDiv).jtable('load');
	}
	
	/**
	 * This function initializes a jTable component.  It should be
	 * 	called from the host web page's document.ready() function.
	 */
	this.initializeJTable = function() {
		let methodName = self.constructor.name + '::' + `initializeJTable`;
		let errPrefix = '(' + methodName + ') ';
		
		/**
		 * Build an action execution function for one of the jTable actions using
		 * 	the provided parameters.
		 *
		 * @param {String|null} urlForAction - The URL that should be called to
		 * 	fulfill this action.  It must be a non-empty string or NULL, nothing
		 * 	else.
		 * @param {String} actionVerb - The action verb that describes this
		 * 	jTable action.  Only four values are allowed:
		 * 	[create, delete, list, update]
		 * @param {Function|null} funcGetPostData - The function that should be
		 * 	called to get the POST data required for this action, if any.  It must
		 * 	be of type "function" or NULL, nothing else.
		 * @param {Object} [requestHeadersObj] - The request headers for the
		 * 	requisite API call.  It may be an empty object, but it must
		 * 	be of type object.
		 *
		 * @return {Object} - Returns an object that tells jTable how to
		 * 	execute this particular data action.
		 */
		function buildActionObject(urlForAction, actionVerb, funcGetPostData, requestHeadersObj={}) {
			let methodName = self.constructor.name + '::' + `JTableManager.buildActionObject`;
			let errPrefix = '(' + methodName + ') ';
			
			if (urlForAction !== null) {
				if (misc_shared_lib.isEmptySafeString(urlForAction))
					throw new Error(errPrefix + `The urlForAction parameter is not NULL, yet is is empty.`);
			}
			
			self._validateActionVerb(actionVerb);
			
			if (funcGetPostData !== null) {
				if (typeof funcGetPostData !== 'function')
					throw new Error(errPrefix + `The value in the funcGetPostData parameter is not NULL, yet it is not a function either.`);
					
			}
			
			if (typeof bEnableUpdateActions !== 'boolean')
				throw new Error(errPrefix + `The value in the bEnableUpdateActions parameter is not boolean.`);
				
			if (!misc_shared_lib.isNonNullObjectAndNotArray(requestHeadersObj))
				throw new Error(errPrefix + `The requestHeadersObj is not a valid object.`);
				
			// NOTE: The postDataFromLoadCall is the data you passed to the jTable
			//  during the jTable.load(hostDivId) call.
			let actionObj =
				function(postDataFromLoadCall, jtParams) {
					// We don't use the post data passed to jTable at load time.
					//  instead we use our funcGetPostData parameter.
					
					let postData = null;
					
					// Do we have a funcGetPostData function?
					if (funcGetPostData)
						// Yes. Get the post data.  Let the function that does that know
						//  what action is being executed.  Pass it the post data we
						//  used in the jTable.load() call too, if any.
						postData = funcGetPostData(actionVerb, postDataFromLoadCall);
					
					return $.Deferred(function ($dfd) {
							$.ajax({
								//
								url: urlForAction,
								type: 'POST',
								dataType: 'json',
								headers: requestHeadersObj,
								// data: _finalizeApiPostData(postDataFromLoadCall, false),
								data: postData ? _finalizeApiPostData(postData, false) : null,
								success: function (data) {
									$dfd.resolve(data);
								},
								error: function () {
									$dfd.reject();
								}
							});
						});
				}
				
			return actionObj;
		}
			
		// Transfer any specified override parameters.
		// let jTableConfigObj = [...self._overrideJTableParameters];
		// let jTableConfigObj = Object.entries(self._overrideJTableParameters);
		
		let jTableConfigObj = {};
		
		for (let propKey in self._overrideJTableParameters)
			jTableConfigObj[propKey] = self._overrideJTableParameters[propKey];
		
		// Build the child objects.
		//
		// Build the request headers child object.
		// let requestHeadersObj = [...self._additionalApiRequestHeaders];
		// let requestHeadersObj = Object.entries(self._additionalApiRequestHeaders);
		const requestHeadersObj = self._additionalApiRequestHeaders;
		
		// Build the actions child object.
		jTableConfigObj.actions = {};
		
		// We always have a 'list' action.
		jTableConfigObj.actions.listAction =
			buildActionObject(self._urlList, 'list', funcGetPostData, requestHeadersObj);
			
		// The other actions are only added if the _enableUpdateActions field
		//  is TRUE.
		if (self._enableUpdateActions) {
			jTableConfigObj.actions.createAction = buildActionObject(self._urlCreate, 'create', funcGetPostData, requestHeadersObj),
			jTableConfigObj.actions.deleteAction = buildActionObject(self._urlDelete, 'delete', funcGetPostData, requestHeadersObj),
			jTableConfigObj.actions.updateAction = buildActionObject(self._urlUpdate, 'update', funcGetPostData, requestHeadersObj)
		}
		
		// Fill in the full jTable configuration object using the child objects
		//  we just created and were given when we constructed.
		jTableConfigObj.fields = self._fieldDefinitions;
		
		// Tell jTable to build and display the table.
		$('#' + self.idHostDiv).jtable(jTableConfigObj);

		// Tell jTable to load the initial data into the table and display it.
		self.loadOrReload();
	}
	
	// ------------------- CONSTRUCTOR CODE ---------------------
	
	// URL parameters for the jTable actions can be NULL but if not,
	//	it must be a non-empty string.
	function validateUrlParameter(theUrl, theUrlName) {
		let errPrefix = `(${self.constructor.name}'::'validateUrlParameter) `;
		
		if (misc_shared_lib.isEmptySafeString(theUrlName))
			throw new Error(errPrefix + `The theUrlName parameter is empty.`);
		
		if (theUrl === null)
			return;
			
		if (misc_shared_lib.isEmptySafeString(theUrlName))
			throw new Error(errPrefix + `The ${theUrlName} parameter is not NULL or a valid string either.`);
	}
}

/**
 * For those jTable use cases where our default table parameters are fine,
 * 	this call returns an object with those parameter fields and values
 * 	that can be used as the overrideJTableParameters parameter when
 * 	building the JTableManager object.
 */
JTableManager.buildDefaultJTableConfigObj = function() {
	let errPrefix = `(JTableManager.buildDefaultJTableConfigObj) `;
	
	let defaultConfigObj =
		{
			jqueryuiTheme: true, // Use a jQuery theme.
			title: 'Items',
			paging: true, // Enable paging
			pageSize: 30, // Increase the page size (default: 10).
			sorting: true, //Enable sorting
			defaultSorting: 'Name ASC' //Set default sorting
		}
	
	return defaultConfigObj;
}

/**
 * This function initializes the jTable object for the create-offers table.
 * 	It should be called from the host page's document ready event.
 *
 * 	@param {string} idHostDiv - The ID of the DIV element that will contain the
 * 	  jTable instance.
 */
function initializeCreateOffersTable(idHostDiv) {
	let errPrefix = `(initializeCreateOffersTable) `;
	
	if (misc_shared_lib.isEmptySafeString(idHostDiv))
		throw new Error(errPrefix + `The idHostDiv parameter is empty.`);
		
	// Need to define the field definitions object for offers.
	throw new Error(errPrefix + `Need to define jTable fields for the offers collection.`);
	
	// Sample field definitions object for a jTable instance.
	/*
		fields: {
			id: {
				key: true,
				// ROS: Do not show the ID In the create or edit forms, or show it in the table (list).
				create: false,
				edit: false,
				list: false
			},
			languageCode: {
				title: 'Language Code',
				inputClass: 'lowercase-only',
				// Note: HTML5 ignores TD & TH width style settings and the class below did not help with that.
				// listClass: 'mini-column',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode,
				defaultValue: 'en'
			},
			question: {
				title: 'Question',
				type: 'textarea'
				// width: '80%'
			},
			choices: {
				title: 'Choices (delimit multiple choices by commas)',
				type: 'textarea',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			choicesToActions: {
				title: 'Choices to Actions Map (delimit multiple choice to action name=value pairs by commas)',
				type: 'textarea',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			correctAnswer: {
				title: 'Correct answer/choice or desired response',
				// TODO: Forcing this to a boolean TRUE/FALSE radio button if in simple mode. (i.e. - not in advanced mode).
				type: g_IsAdvancedMode ? 'input' : 'radiobutton',
				options:
					g_IsAdvancedMode ?
					null
					:
					[ { Value: 'X_TRUE_X', DisplayText: 'true'}, { Value: 'X_FALSE_X', DisplayText: 'false'} ],
				list: false,
			},
			replyForCorrectChoice: {
				title: 'Reply for correct choice or if the user says "yes".',
				type: 'textarea',
				// Add the class to the textarea that tells the auto-clean code
				//	running on an interval that this is one of the fields that
				//	should be auto-cleaned.
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			replyForIncorrectChoice: {
				title: 'Reply for incorrect choice or if the user says "no"',
				type: 'textarea',
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			answer: {
				title: 'Answer to give user regardless of their choice',
				type: 'textarea',
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			additionalInformation: {
				title: 'Additional Information',
				type: 'textarea',
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			sequenceNum: {
				title: '#',
				create: g_IsAdvancedMode,
				edit: false,
				list: false
			},
			typeOfQuestion: {
				title: 'Type',
				inputClass: 'uppercase-only',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode,
				defaultValue: 'T_QUIZ_ITEM_T'
			},
			tagConcreteGoal: {
				title: 'Tag for Concrete Goal',
				inputClass: 'uppercase-only concrete-goal-input',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			}
		}
	*/
	
}

/**
 * This function initializes the jTable object for the list-offers table.
 * 	It should be called from the host page's document ready event.
 *
 * 	@param {String} idHostDiv - The ID of the DIV element that will contain the
 * 	  jTable instance.
 *  @param {Function} funcGetAssetSymbol - A function that when called
 *  	will return the asset symbol the jTable should pass to our
 *  	server, to get the available offers for that asset symbol.
 *
 * 	@return {JTableManager} - Returns the JTableManager object that is
 * 		created by this method.
 */
function initializeListOffersTable(idHostDiv, funcGetAssetSymbol) {
	let errPrefix = `(initializeListOffersTable) `;
	
	if (misc_shared_lib.isEmptySafeString(idHostDiv))
		throw new Error(errPrefix + `The idHostDiv parameter is empty.`);
		
	if (typeof funcGetAssetSymbol !== 'function')
		throw new Error(errPrefix + `The value in the funcGetAssetSymbol parameter is not function.`);

	/**
	 * This function builds the requisite post data for one of the the
	 * 	offer data operations, based on the action verb passed to us
	 * 	from jTable.
	 *
	 * @param {String} actionVerb - The current action jTable is trying
	 * 	to execute.
	 * @param {Object} postDataFromLoadCall - The post data we passed
	 * 	to the jTable.load() call when this jTable instance was
	 * 	initialized.
	 */
	function buildPostDataForOfferAction(actionVerb, postDataFromLoadCall) {
		let errPrefix = `(buildPostDataForOfferAction) `;
		
		if (misc_shared_lib.isEmptySafeString(actionVerb))
			throw new Error(errPrefix + `The actionVerb parameter is empty.`);
			
		if (actionVerb === 'create')
			// Create call.  Post data parameters to be determined later.
			return null;
		else if (actionVerb === 'delete')
			// Delete call.  Post data parameters to be determined later.
			return null;
		else if (actionVerb === 'list') {
			// List call.  The post data must contain the asset symbol we
			//  want a list of offers for.
			const assetSymbol = funcGetAssetSymbol();
			
			if (misc_shared_lib.isEmptySafeString(assetSymbol))
				throw new Error(errPrefix + `The asset symbol returned by the get asset symbol function is invalid.`);
				
			// Get the offer type from the radio buttons that allow the user to select that.
			const selectedOfferType = getSelectedOfferType_buy_option();
			
			if (!selectedOfferType)
				throw new Error(errPrefix + `The selected offer type is unassigned.`);
				
			// This is where we gather the data fields necessary for the list
			//  available offers post data object.
			return {
				asset_symbol:  assetSymbol,
				offer_type:  selectedOfferType
			}
		} else if (actionVerb === `update`)
			// Update call.  Post data parameters to be determined later.
			return null;
		else
			// Invalid action verb.
			throw new Error(errPrefix + `Invalid action verb: ${actionVerb}`);
	}
	
	let fieldDefsObj =
		{
			assetSymbol: {
				key: true,
				create: false,
				edit: false,
				// Don't show this field in the 'list' view.  All items in the
				//  list will be for the same asset symbol.
				list: false
			},
			// The following fields are what are visible at the least in LIST mode.
			offerType: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Type'
			},
			expirationDateTime_string: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Expires On',
				// width: '10px'
			},
			strikePrice_display: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Strike Price',
				// width: '100px'
			},
			premiumPerAsset_display: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Premium'
			},
			maxPayoutPerAsset_display: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: `Max Payout`
			},
			numAssetsAvailable: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Available'
			},
			// This field does not exist in the data object.  It is
			//	added solely to put a BUY button at the end of each row.
			BuyButton: {
				title: 'Buy',
				display: function(data) {
					if (data.record) {
						// const alertMsg = `BUY button clicked for offer ID: ${data.record.id}`;
						
						// Add a buy button.  The click handler for the BUY button is
						//  established in the recordsLoaded() event handler.
						return `<button title="Buy Option" class="my-btn btn btn-success btn-large neodao-go-option-button" data-offer-ext-id="${data.record.id}"><span>BUY</span></button>`;
					}
				},
				create: false,
				edit: false,
				list: true
			}
		}
		
	// Build the override table parameters object.  First,
	//  add the default options.
	let overrideTableParamsObj = JTableManager.buildDefaultJTableConfigObj();
	
	// Add an event handler for the recordsLoaded event so we can add our
	//  BUY button and other per-row event handlers.
	overrideTableParamsObj.recordsLoaded = function(event, data) {
		const errPrefix_2 = `(overrideTableParamsObj.recordsLoaded) `;
		
		// Store the data where other code can access it.  The
		//  "data" parameter should contain an array of records
		//	in the "records" field.
		if (data.records) {
			if (Array.isArray(data.records)) {
				g_CurrentRecords = {};
				
				// jTable stores the records as a linear array.  Store it as an
				//  associative array in our own variable..
				for (let ndx = 0; ndx < data.records.length; ndx++) {
					if (typeof data.records[ndx].id === 'undefined')
						throw new Error(errPrefix_2 + `The data record is missing an "id" field.`);
						
					const theId = data.records[ndx].id;
						
					// We should never have multiple offers with the same ID.
					if (typeof g_CurrentRecords[theId] !== 'undefined')
						throw new Error(errPrefix_2 + `Duplicate offer found with ID: ${theId}.`);
						
				 	g_CurrentRecords[theId] = data.records[ndx];
				}
			}
			else
				g_CurrentRecords = null;
		}
	
		// Click handler for the BuyButton button we put at the end of
		//  each row in the list of available offers jTable.
		$('.neodao-go-option-button').click(
			function() {
				// Get the offer ID from the "data-offer-ext-id" attribute that
				//  we added to each row.
				const offerId = $(this).attr("data-offer-ext-id");
			
				if (misc_shared_lib.isEmptySafeString(offerId))
					throw new Error(errPrefix + `The offerId could not be found in the row containing the BUY button that was clicked.`);
					
				// Get the offer details record attached to that offer ID.
				const srcOfferDetailsExtObj = getSourceOfferByIdOrDie(offerId);
					
				console.log(`BUY button clicked for Offer ID: ${offerId}`);
				
				// Make a "blind" call to the call to the promise that coordinates
				// 	the option purchase steps.  Pass it the object that contains
				//  the offer the user is interested in.
				doBuyOption_promise(srcOfferDetailsExtObj);
			}
		);
	}
	
	const jTableMgrObj = new JTableManager(
			idHostDiv,
			g_GlobalNamespaces.instance.urlCreateOffer,
			g_GlobalNamespaces.instance.urlDeleteOffer,
			g_GlobalNamespaces.instance.urlListOffers,
			g_GlobalNamespaces.instance.urlUpdateOffer,
			buildPostDataForOfferAction,
			fieldDefsObj,
			// List only.  We don't want to allow editing of the OFFERs.
			false,
			overrideTableParamsObj,
		);
		
	// Make the initialization call.
	jTableMgrObj.initializeJTable(idHostDiv);
	
	return jTableMgrObj;
		
	// Need to define the field definitions object for offers.
	// throw new Error(errPrefix + `Need to define jTable fields for the offers collection.`);
	
	// Sample field definitions object for a jTable instance.
	/*
		fields: {
			id: {
				key: true,
				// ROS: Do not show the ID In the create or edit forms, or show it in the table (list).
				create: false,
				edit: false,
				list: false
			},
			languageCode: {
				title: 'Language Code',
				inputClass: 'lowercase-only',
				// Note: HTML5 ignores TD & TH width style settings and the class below did not help with that.
				// listClass: 'mini-column',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode,
				defaultValue: 'en'
			},
			question: {
				title: 'Question',
				type: 'textarea'
				// width: '80%'
			},
			choices: {
				title: 'Choices (delimit multiple choices by commas)',
				type: 'textarea',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			choicesToActions: {
				title: 'Choices to Actions Map (delimit multiple choice to action name=value pairs by commas)',
				type: 'textarea',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			correctAnswer: {
				title: 'Correct answer/choice or desired response',
				// TODO: Forcing this to a boolean TRUE/FALSE radio button if in simple mode. (i.e. - not in advanced mode).
				type: g_IsAdvancedMode ? 'input' : 'radiobutton',
				options:
					g_IsAdvancedMode ?
					null
					:
					[ { Value: 'X_TRUE_X', DisplayText: 'true'}, { Value: 'X_FALSE_X', DisplayText: 'false'} ],
				list: false,
			},
			replyForCorrectChoice: {
				title: 'Reply for correct choice or if the user says "yes".',
				type: 'textarea',
				// Add the class to the textarea that tells the auto-clean code
				//	running on an interval that this is one of the fields that
				//	should be auto-cleaned.
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			replyForIncorrectChoice: {
				title: 'Reply for incorrect choice or if the user says "no"',
				type: 'textarea',
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			answer: {
				title: 'Answer to give user regardless of their choice',
				type: 'textarea',
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			additionalInformation: {
				title: 'Additional Information',
				type: 'textarea',
				inputClass: 'auto-clean-text',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			},
			sequenceNum: {
				title: '#',
				create: g_IsAdvancedMode,
				edit: false,
				list: false
			},
			typeOfQuestion: {
				title: 'Type',
				inputClass: 'uppercase-only',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode,
				defaultValue: 'T_QUIZ_ITEM_T'
			},
			tagConcreteGoal: {
				title: 'Tag for Concrete Goal',
				inputClass: 'uppercase-only concrete-goal-input',
				list: false,
				create: g_IsAdvancedMode,
				edit: g_IsAdvancedMode
			}
		}
	*/
}

/**
 * This function initializes the jTable object for the option
 * 	contract details table that is shown to the user on the
 * 	Dashboard page.  This table show the ContraxDetails
 * 	collection that contains the option contracts where the
 * 	user is participating as a BUYER or SELLER.
 *
 * It should be called from the host page's document ready event.
 *
 * 	@param {String} idHostDiv - The ID of the DIV element that will contain the
 * 	  jTable instance.
 * @param {String} participantId - The public address of the
 * 	participant.
 * @param {String} mode - The desired filter the Neochex
 * 	contract should use when selecting option contracts for the
 * 	returned collection.  See the listContraxByParticipantId()
 * 	method for details.
 *
 * 	@return {JTableManager} - Returns the JTableManager object that is
 * 		created by this method.
 */
function initializeOptionContraxTable(idHostDiv, participantId, mode) {
	let errPrefix = `(initializeOptionContraxTable) `;
	
	if (misc_shared_lib.isEmptySafeString(idHostDiv))
		throw new Error(errPrefix + `The idHostDiv parameter is empty.`);
	if (misc_shared_lib.isEmptySafeString(mode))
		throw new Error(errPrefix + `The mode parameter is empty.`);
		
	/**
	 * This function builds the requisite post data for one of the the
	 * 	contrax details data operations, based on the action verb passed to us
	 * 	from jTable.
	 *
	 * @param {String} actionVerb - The current action jTable is trying
	 * 	to execute.
	 * @param {Object} postDataFromLoadCall - The post data we passed
	 * 	to the jTable.load() call when this jTable instance was
	 * 	initialized.
	 */
	function buildPostDataForContraxAction(actionVerb, postDataFromLoadCall) {
		let errPrefix = `(buildPostDataForContraxAction) `;
		
		if (misc_shared_lib.isEmptySafeString(actionVerb))
			throw new Error(errPrefix + `The actionVerb parameter is empty.`);
			
		if (actionVerb === 'create')
			// Create call.  Post data parameters to be determined later.
			return null;
		else if (actionVerb === 'delete')
			// Delete call.  Post data parameters to be determined later.
			return null;
		else if (actionVerb === 'list') {
			// This is where we gather the data fields necessary for the list
			//  available contraxs post data object, using the list contrax
			//  route on our back-end server.
			return {
				participant_id: participantId,
				mode
			}
		} else if (actionVerb === `update`)
			// Update call.  Post data parameters to be determined later.
			return null;
		else
			// Invalid action verb.
			throw new Error(errPrefix + `Invalid action verb: ${actionVerb}`);
	}
	
	let fieldDefsObj =
		{
			assetSymbol: {
				key: true,
				create: false,
				edit: false,
				list: true
			},
			offerType: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Type'
			},
			expirationDateTime_string: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Expires On',
				// width: '10px'
			},
			strikePrice: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Strike Price',
				// width: '100px'
			},
			// We don't show the premium per asset.  Instead, we
			//  show a derived field that shows the total amount of
			//  premium paid/received for the option contract.
			premiumPerAsset: {
				key: true,
				create: false,
				edit: false,
				list: false,
				title: 'Premium'
			},
			// We don't show the maximum payout per asset.  Instead, we
			//  show a derived field that shows the total payout of
			//  possible with the option contract.
			maxPayoutPerAsset: {
				key: true,
				create: false,
				edit: false,
				list: false,
				title: `Max Payout`
			},
			numAssets: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: 'Available'
			},
			profitOrLoss: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: `Profit/Loss`
			},
			totalMaxPayoutPerAsset: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: `Total Max Payout`
			},
			totalPremiumPaid: {
				key: true,
				create: false,
				edit: false,
				list: true,
				title: `Total Premium Paid`
			},
			// This field does not exist in the data object.  It is
			//	added solely to put a CHART button at the end of each row.
			ViewChartButton: {
				title: 'VIEW CHART',
				display: function(data) {
					if (data.record) {
						// const alertMsg = `VIE CHART button clicked for contrax ID: ${data.record.id}`;
						
						// Add a view chart button.  The click handler for the VIEW CHART button is
						//  established in the recordsLoaded() event handler.
						return `<button title="View Chart" class="my-btn btn btn-success btn-large neochex-view-chart-button" data-contrax-ext-id="${data.record.id}"><span>VIEW CHART</span></button>`;
					}
				},
				create: false,
				edit: false,
				list: true
			}
		}
		
	// Build the override table parameters object.  First,
	//  add the default options.
	let overrideTableParamsObj = JTableManager.buildDefaultJTableConfigObj();
	
	// Add an event handler for the recordsLoaded event so we can add our
	//  VIEW CHART button and other per-row event handlers.
	overrideTableParamsObj.recordsLoaded = function(event, data) {
		const errPrefix_2 = `(overrideTableParamsObj.recordsLoaded) `;
		
		// Store the data where other code can access it.  The
		//  "data" parameter should contain an array of records
		//	in the "records" field.
		if (data.records) {
			if (Array.isArray(data.records)) {
				g_CurrentRecords = {};
				
				// jTable stores the records as a linear array.  Store it as an
				//  associative array in our own variable..
				for (let ndx = 0; ndx < data.records.length; ndx++) {
					if (typeof data.records[ndx].id === 'undefined')
						throw new Error(errPrefix_2 + `The data record is missing an "id" field.`);
						
					const theId = data.records[ndx].id;
					
					// We should never have multiple contraxs with the same ID.
					if (typeof g_CurrentRecords[theId] !== 'undefined')
						throw new Error(errPrefix_2 + `Duplicate contrax found with ID: ${theId}.`);
						
				 	g_CurrentRecords[theId] = data.records[ndx];
				}
			}
			else
				g_CurrentRecords = null;
		}
	
		// Click handler for the ViewChart button we put at the end of
		//  each row in the list of available contraxs jTable.
		$('.neochex-view-chart-button').click(
			function() {
				// Get the contrax ID from the "data-contrax-ext-id" attribute that
				//  we added to each row.
				const contraxId = $(this).attr("data-contrax-ext-id");
			
				if (misc_shared_lib.isEmptySafeString(contraxId))
					throw new Error(errPrefix + `The contraxId could not be found in the row containing the BUY button that was clicked.`);
					
				// Get the contrax details record attached to that contrax ID.
				const srcContraxDetailsExtObj = getSourceOfferByIdOrDie(contraxId);
				
				console.log(`VIEW CHART button clicked for Contrax ID: ${contraxId}`);
				
				// Make a "blind" call to the call to the promise that coordinates
				// 	the option purchase steps.  Pass it the object that contains
				//  the offer the user is interested in.
				//
				// TODO: Currently we are using the alternate target currency
				//  to see the chart prices in because pricing a cryptocurrency
				//  chart in NEO GAS is not available yet on CryptoCompare.
				doViewChart(srcContraxDetailsExtObj.assetSymbol, g_AlternateTargetCurrency);
			}
		);
	}
	
	const jTableMgrObj = new JTableManager(
			idHostDiv,
			null,
			null,
			g_GlobalNamespaces.instance.urlListContraxForUser,
			null,
			buildPostDataForContraxAction,
			fieldDefsObj,
			// List only.  We don't want to allow editing of the CONTRAXs.
			false,
			overrideTableParamsObj,
		);
		
	// Make the initialization call.
	jTableMgrObj.initializeJTable(idHostDiv);
	
	return jTableMgrObj;
}
