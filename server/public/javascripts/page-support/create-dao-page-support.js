// This file contains the Javascript code that supports the create DAO page.

// This flag lets the onbeforeunload handler know we are closing the form.
let gSubmitButtonCalling = false;

// Once the Alpaca form object has been created, this variable will be set to TRUE.
let g_IsAlpacaForObjCreated = false;

// The ID we have given to the Alpaca forms submit button.
const g_AlpacaSubmitButtonId = "button-create-this-dao";
const g_AlpacaSubmitButtonId_selector = '#' +  g_AlpacaSubmitButtonId;

const g_IdOfAlpacaExpirationDateTimeField = "alpaca-expirationDateTime";

// The ID of the DIV that hosts the DIV that holds the Alpaca form (see below).
const g_AlpacaHostDivId = 'alpaca-form-host-div';
const g_AlpacaHostDivId_selector = '#' + g_AlpacaHostDivId;

// The ID and jQuery selector of the DIV that will hold the Alpaca form instance.
const g_AlpacaDivId = 'alpaca-form-div';
const g_AlpacaDivId_selector = '#' + g_AlpacaDivId;

// The selector that gets the DOM element that is the Alpaca forms object.
const g_AlpacaFormObjId = 'alpaca2';
const g_AlpacaFormObjId_selector ="#" + g_AlpacaFormObjId;

// -------------------- BEGIN: DEFAULT DAO SETTINGS ------------

const DEFAULT_DILUTION_BOUND = 3; // default = 3. The maximum multiplier a YES voter will be obligated to pay in case of mass ragequit
const DEFAULT_GRACE_PERIOD_LENGTH = 35; // default = 35 periods (7 days)
const DEFAULT_GRANTSDAO_MIN_SUMMONER_SHARES = 0; // (For grant related DAOs) default = At least 1 token to be a GRANTS DAO summoner (default deposit token).
const DEFAULT_GRANTSDAO_MAX_SUMMONER_SHARES = 1000; // We don't really set a maximum currently.  This is just to catch some odd extreme value.
const DEFAULT_MEMBERSHIP_FEE = 0; // The default is no membershp fee.
const DEFAULT_PERIOD_DURATION = 17280; // default = 17280 = 4.8 hours in seconds (5 periods per day)
const DEFAULT_PROCESSING_REWARD = 3; // default = 1. The amount of the default token to give to whoever processes a proposal
const DEFAULT_PROPOSAL_DEPOSIT = 10; // default = 10 of the default tokens
const DEFAULT_VOTING_PERIOD_LENGTH = 35; // default = 35 periods (7 days)

const MAX_PERIOD_DURATION = 10 * DEFAULT_PERIOD_DURATION; // 10 times the default PERIOD DURATION.
const MAX_PROCESSING_REWARD_TOKENS = 100; // This is an arbitrary value to keep huge token count values from being entered accidentally by the user as a processing reward.

// NOTE: The default summoning time is "now".

// -------------------- END  : DEFAULT DAO SETTINGS ------------

// -------------------- BEGIN: DAO SETTINGS LIMITS ------------

const MAX_VOTING_PERIOD_LENGTH = 10000000000000000000; // Math.Pow(10, 18);
const MAX_GRACE_PERIOD_LENGTH = 10000000000000000000;
const MAX_DILUTION_BOUND = 10000000000000000000;
const MAX_NUMBER_OF_SHARES_AND_LOOT = 10000000000000000000;
const MAX_TOKEN_WHITELIST_COUNT = 400;
const MAX_TOKEN_GUILDBANK_COUNT = 200;

// -------------------- END  : DAO SETTINGS LIMITS ------------

// Counts the number of Alpaca form updates.
let g_UpdateCounter = 0;

// Moved to global namespaces module.
// let g_CurrentAssetSymbol = null;

// The current price for the currently selected asset symbol,
//  denominated in the preferred target currency.
let g_CurrentAssetPrice = null;

// The current price for NEO GAS token in the preferred target currency.
let g_CurrentGasTokenPrice_preferred = null;

// The current price for NEO GAS token in the alternate target currency.
let g_CurrentGasTokenPrice_alternate = null;

// This variable lets us know if the Alpaca form has been created or not.
// let g_IsAlpacaFormCreated = false;

// Handlebars templates.  The document ready handler will initialize these variables.
// (none)

/**
 * Fetch the latest (cached) asset symbol price based on the currently
 * 	selected symbol and after we have the price, create the Alpaca
 * 	form.
 *
 * @param {*} selectedValue - The currently selected value.
 *
 * NOTE: This call may seem redundant but it is necessary because
 * 	currently the cryptocurrency symbol list manager object does not
 * 	handle async-functions/promises.  So we wrap the promise to
 * 	get the current asset price in a plain function.
 */
function fetchAssetPriceAndCreateForm_createdao(selectedValue) {
	let errPrefix = `(fetchAssetPriceAndCreateForm_createdao) `;
	
	if (misc_shared_lib.isEmptySafeString(selectedValue))
		throw new Error(errPrefix + `The selectedValue parameter is empty, invalid, or not a string.`);
	
	// Get the currently selected asset symbol.
	const assetSymbol = selectedValue.trim();
	
	if (misc_shared_lib.isEmptySafeString(assetSymbol))
		throw new Error(errPrefix + `The asset symbol selected is empty.`);
		
	// Make a blind call to the promise that fetches the latest (cached) price.
	console.info(errPrefix + `Fetching the current price for selected asset symbol: ${assetSymbol}.`);
	
	fetchSelectedAssetPrice_promise(
		assetSymbol,
		g_PreferredTargetCurrency,
		(result) => {
			if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
				throw new Error(errPrefix + `The result of the fetchSelectedAssetPrice_promise() is not a valid object.  Context: post-fetch function callback.`);
				
			// Update all price elements with the new price.
			const assetPriceStr =
				`${result.assetPrice} (${result.denominatedInCurrency})`;
			$('.current-asset-price').text(assetPriceStr);
			
			// Save it where others can find it too.
			g_CurrentAssetSymbol = assetSymbol;
			g_CurrentAssetPrice = result.assetPrice;

			// If the Alpaca form has not been created yet, do so now.
			if (!g_IsAlpacaForObjCreated) {
				createAlpacaForm_createdao(g_CurrentAssetSymbol, g_CurrentAssetPrice);
				g_IsAlpacaForObjCreated = true;
			} else {
				// Update the Alpaca form field that will trigger any Alpaca
				//  controls dependent on it.
				const control = $(g_AlpacaFormObjId_selector).alpaca("get");
				// control.getControlEl().css("border", "5px blue solid");
				g_UpdateCounter++;
				control.childrenByPropertyId['triggerUpdateCounter'].setValue(g_UpdateCounter);
			}
		})
		.catch(err => {
		    // Log the error message to the console.
		    let errMsg =
		        errPrefix + misc_shared_lib.conformErrorObjectMsg(err);

			console.error(errMsg);
		});
}

/**
 * This is a temporary object that is used to hold the bag of
 * 	details necessary to fulfill an DAO creation.
 * 	It is not persisted and is only used during the confirmation
 * 	step in the offer creation process.
 *
 * @param {Object} srcAlpacaFormDataObj - An Alpaca form data
 * 	object that contains the offer details values entered by
 * 	the user and calculated by our code.
 * @param {Number} currentAssetPrice - The current asset price
 * 	denominated in the preferred target currency.
 * @param {String} preferredTargetCurrency - The target
 * 	currency all the price related fields in the form
 * 	data object are denominated in (e.g. - "USD").
 *
 * @constructor
 */
function NewDaoDetailsBag_deprecated(srcAlpacaFormDataObj, currentAssetPrice, preferredTargetCurrency) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	if (!misc_shared_lib.isNonNullObjectAndNotArray(srcAlpacaFormDataObj))
		throw new Error(errPrefix + `The srcAlpacaFormDataObj is not a valid object.`);
		
	if (typeof currentAssetPrice !== 'number')
		throw new Error(errPrefix + `The value in the currentAssetPrice parameter is not a number.`);
		
	if (currentAssetPrice <= 0)
		throw new Error(errPrefix + `The current asset price is less than or equal to 0.`);
	
	if (misc_shared_lib.isEmptySafeString(preferredTargetCurrency))
		throw new Error(errPrefix + `The preferredTargetCurrency parameter is empty.`);

	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = misc_shared_lib.getSimplifiedUuid();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {Object} - An Alpaca form data object that contains the DAO
	 * 	details values entered by the user and calculated by our code. */
	this.srcAlpacaFormDataObj = srcAlpacaFormDataObj;
	
	/** @property {String} - The target currency all the price related fields
	 * in the form data object are denominated in (e.g. - "USD"). */
	this.preferredTargetCurrency = preferredTargetCurrency;
	
	/**
	 * Using the current contents of this object, build the text/HTML
	 * 	to show on the floating DIV that gets final confirmation from
	 * 	the user before they complete an DAO creation.
	 *
	 * @return {String} - A string is returned that can be used for the
	 * 	dialog HTML block required by one of our EZDialog objects.
	 */
	this.buildConfirmationDialogText = function() {
		let methodName = self.constructor.name + '::' + `buildConfirmationDialogText`;
		let errPrefix = '(' + methodName + ') ';
		
		/*
			Example: You are offering for sale the right to
				<buy/sell> <5> <Bitcoin> tokens <from/to> you
				at the strike price of <strike price USD> on but not
				before <March 31st, 2021>.	You are charging <$1000 USD>
				per asset for this offer with a maximum
				payout of <$2000 USD> per asset.  Therefore, your total
				risk for this offer is <$10,000> since <$2000 USD) times
				<5> equals <$10,000 USD>.  This is the amount
				that you must pay at this time to create this
				offer.  This amount will be held in escrow for you
				until the option expires on <March 31st, 2021>.
				
				If the price of <Bitcoin> has stayed <above/below>
				your strike price of <strike price USD>, the entire
				amount held in escrow will be returned to you plus
				the amount of premium paid by the user.  If the
				price of <Bitcoin> is <above/below> your strike
				price of <strike price USD>, you will receive
				nothing back.  If the final price of <Bitcoin>
				is between <strike price USD> and <strike price
				plus/minus strike price delta USD>, you will
				receive back an amount that is equal to the
				remainder of your escrow amount minus the
				loss you incurred by the final price.
				
				NOTE: All amounts paid to you will have
				a Neodao transaction fee of <2%> applied to them.
				
				IMPORTANT:  Please note. You will not have to <buy/sell> any
				<Bitcoin> tokens if the price has moved against you
				by the time the option contract expiration date
				occurs.  Instead,
				the amount of loss you have suffered given
				the specific details of this offer, will be transferred out of the
				amount held in escrow for you and paid to the option buyer.
				
				All payments and payouts in Neodao are done with
				NEO GAS tokens, saving you from the headache and
				fear that comes from moving tokens around on
				various exchanges, a process where you could
				lose all your tokens during the transfer.  You
				also avoid the losses that come from the slippage
				that occurs from moving	tokens around.
		 */
		 
		const bIsPutOption = self.srcAlpacaFormDataObj.offerType === 'PUT';
		const numAssetsOffered = self.srcAlpacaFormDataObj.numAssets;
		const strNumAssetsOffered = `${numAssetsOffered}`;
		
		const assetSymbolOrDesc = self.srcAlpacaFormDataObj.assetSymbol;
		const strAboveBelow = bIsPutOption ? 'below' : 'above';
		const strBuySell = bIsPutOption ? 'sell' : 'buy';
		const strReceiveNeedToSell = bIsPutOption ? 'need to sell' : 'receive';
		const strFromTo = bIsPutOption ? 'to' : 'from';
		const strFromToThe = bIsPutOption ? 'to the' : 'from';
		const strExpiryDateTime = self.srcAlpacaFormDataObj.expirationDateTime;
		const totalPremiumAmount = self.srcAlpacaFormDataObj.premiumPerAsset * numAssetsOffered;
		const maxPayoutAtRiskAmount = self.srcAlpacaFormDataObj.maxPayoutPerAsset * numAssetsOffered;
		
		const strPremiumPerAsset = `${self.srcAlpacaFormDataObj.premiumPerAsset}`;
		const strMaxPayoutPerAsset = `${self.srcAlpacaFormDataObj.maxPayoutPerAsset}`;
		const strMaxPayoutAtRiskAmount = `${maxPayoutAtRiskAmount}`;
		const strTotalPremiumAmount = `${totalPremiumAmount}`;
		
		const absValStrikePriceDelta = Math.abs(self.srcAlpacaFormDataObj.strikePriceDelta);
		const strAbsValStrikePriceDelta = `${absValStrikePriceDelta}`;
		
		if (totalPremiumAmount <= 0)
			// This indicates an invalid offer and could lead to
			//	a divide by zero situation.  Throw an error.
			throw new Error(errPrefix + `The payment amount is less than or equal to 0.`);
		if (totalPremiumAmount >= maxPayoutAtRiskAmount)
			// Although not technically invalid, the user should never be sold
			//  an option that has a payout ratio less than 1.
			throw new Error(errPrefix + `The premium amount(${totalPremiumAmount} is greater than or equal to the maximum payout: ${maxPayoutAtRiskAmount}`);
		
		const strPayoutRatio = maxPayoutAtRiskAmount / totalPremiumAmount;
		const strStrikePrice = self.srcAlpacaFormDataObj.strikePrice;
		
		const theCurrency = self.preferredTargetCurrency;
		
		// Rebuild the payments, payouts, and terms HTML with the current asset symbol.
		const paymentsPayoutsAndTermsHtml =
			g_AryHandlebarsTemplates['payments-payouts-and-terms-mini-template'](
				{
					currentAssetSymbol: assetSymbolOrDesc,
					systemTransactionFeePercentage: g_SystemTransactionFeePercentage
				}
			);
		
		let htmlText =
		`
			<p class="section-sub-header">Summary</p>
			<p class="section-body">
				You are offering the buyer the right to
				${strBuySell} ${strNumAssetsOffered} ${assetSymbolOrDesc}
				tokens ${strFromTo} you
				at the strike price of ${strStrikePrice} ${theCurrency} on, but not
				before ${strExpiryDateTime}. You are charging
				${strPremiumPerAsset} ${theCurrency}
				per asset for this offer with a maximum
				payout of ${strMaxPayoutPerAsset} ${theCurrency} per asset.
				
				Therefore:
				<ul>
					<li>
						Your total risk for this offer if all of your
						inventory is bought is ${strMaxPayoutAtRiskAmount}
						${theCurrency}.
					</li>
					<li>
						The total profit you can possibly make from this offer
						if all of your inventory is bought is
						${strTotalPremiumAmount}.
					</li>
					<li>
						Given your premium per asset and maximum payout per
						asset settings, you are offering a
						payout ratio to the buyer of ${strPayoutRatio} to 1.
					</li>
				</ul>
			</p>
			
			<p class="section-sub-header">Payment Required</p>
			<p class="section-body">
				You must pay ${strMaxPayoutAtRiskAmount} ${theCurrency} at this
				time if you wish to create this offer. This amount will be held
				in escrow for you until the option expires on ${strExpiryDateTime}.
			</p>
			
			<p class="section-sub-header">Auto Adjustment of Strike Price</p>
			<p class="section-body">
				The strike price of any options bought from this offer will be
				<b>automatically</b> adjusted based on the current
				price of ${assetSymbolOrDesc} at the moment an
				option contract purchase occurs.
				<a href="javascript:showSimpleHelp('strike-price-auto-adjustment-for-offers-template')">See Help</a>.
			</p>
			
			<p class="section-sub-header">Payment Details And Terms</p>
			<p class="section-body">
				${paymentsPayoutsAndTermsHtml}
			</p>`;
			
		return htmlText;
	}
	
	// --------------- CONSTRUCTOR CODE -------------
	
	// Validate the content we were passed.
	// this.Validate();
}

/**
 * Create the Alpaca form that lets the user enter the offer details.
 */
function createAlpacaForm_createdao(currentAssetSymbol, currentAssetPrice) {
	let errPrefix = `(createAlpacaForm_createdao) `;
	
	if (misc_shared_lib.isEmptySafeString(currentAssetSymbol))
		throw new Error(errPrefix + `The currentAssetSymbol parameter is empty.`);
	if (typeof currentAssetPrice !== 'number')
		throw new Error(errPrefix + `The value in the currentAssetPrice parameter is not a number.`);
	if (currentAssetPrice <= 0)
		throw new Error(errPrefix + `The current asset price is less than or equal to zero.`);
		
	
	// ------------------ ALPACA FORM --------------------
	
	const dateToday = misc_shared_lib.getToday();
	const dateTomorrow = misc_shared_lib.getToday(1);
	
	// Remove any existing elements with this ID (i.e. - clean up
	//  old forms).
	console.info(errPrefix + `Removing any existing Alpaca form instances.`);
	$(g_AlpacaDivId_selector).remove();
	
	// Recreate the removed element and attach it to the
	//  correct host DIV.
	$(g_AlpacaHostDivId_selector).append(`<div id="${g_AlpacaDivId}"></div>`);

	// Create a brand new form for the new cryptocurrency.
	console.info(errPrefix + `Creating a new Alpaca form for cryptocurrency: ${currentAssetSymbol}.`);

	// The default summoning time is now.
	let defaultSummoningTime = Date.now();

	// Data source for the depositToken field, that
	//  returns the currently selected asset symbol.
	const dataSrcCryptoSymbol = function(callback) {
		// const value = this.observable("/city").get();
		// callback(teamsMap[value]);

		callback(g_CurrentAssetSymbol);
	};

	// CREATE DAO FORM FIELD DECLARATION (Alpaca Forms)
	$(g_AlpacaDivId_selector).alpaca(
	{
		// Field names, initial values.
		"data": {
			"ownerAddress": 'not set',

			"ID": '',
			"displayName": '',

			"depositTokenSymbol": g_CurrentAssetSymbol,

			"dilutionBound": DEFAULT_DILUTION_BOUND,
			"gracePeriodLength": DEFAULT_GRACE_PERIOD_LENGTH,
			"membershipFee": DEFAULT_MEMBERSHIP_FEE,
			"minSummonerShares": DEFAULT_GRANTSDAO_MIN_SUMMONER_SHARES,
			"periodDuration": DEFAULT_PERIOD_DURATION,
			"processingReward": DEFAULT_PROCESSING_REWARD,
			"proposalDeposit": DEFAULT_PROPOSAL_DEPOSIT,
			"votingPeriodLength": DEFAULT_VOTING_PERIOD_LENGTH,

			"summoningTime": defaultSummoningTime,

			// This is a hidden field we use to trigger the
			//  update of any field that pulls its data
			//  from an external data source.  In our
			//  case, we want the readonly depositTokenSymbol
			//  field to update itself to the cryptocurrency
			//  asset currently selected in the form level
			//  list-box for those.
			//
			// Incrementing this field should trigger the necessary
			//  updates.
			"triggerUpdateCounter": g_UpdateCounter,
		},
		"schema": {
			"title": "Create DAO",
			"description": "Create a DAO",
			"type": "object",
			// Field definitions.
			"properties": {
				"displayName": {
					"type": "string",
					"title": "Display Name",
					// "enum":['PUT', 'CALL'],
					"required": true,
					"placeholder": 'This is help',
				},
				// The deposit token is the selected via the cryptocurrency
				//  selection box.
				"depositTokenSymbol": {
					"type": "string",
					"title": "Default Token",
					readonly: true,
					"required": true,
				},
				"dilutionBound": {
					"type": "number",
					"title": "Dilution Bound",
					"required": true,
				},
				"gracePeriodLength": {
					"type": "number",
					"title": "Grace Period Length",
					"required": true,
				},
				"membershipFee": {
					"type": "number",
					"title": "Membership Fee",
					"required": true,
				},
				"minSummonerShares": {
					"type": "number",
					"title": "Minimum number of shares to create DAO (for a GRANT related DAO only)",
					"required": true,
				},
				"proposalDeposit": {
					"type": "number",
					"title": "Proposal Deposit",
					"required": true,
				},
				"periodDuration": {
					"type": "number",
					"title": "Period Duration",
					"required": true,
				},
				"processingReward": {
					"type": "number",
					"title": "Processing Reward",
					"required": true,
				},
				"votingPeriodLength": {
					"type": "number",
					"title": "Voting Period Length",
					"required": true,
				},
				// AUTOMATICALLY DERIVED FIELDS (HIDDEN).
				"ownerAddress": {
					"type": "string",
					"title": "Owner Address",
					"required": true,
					"hidden": true,
				},
				"ID": {
					"title": "DAO ID",
					"required": true,
					"hidden": true,
				},
				"summoningTime": {
					// DO NOT USE TYPE "date"! You will get a FIELD_INSTANTATION_ERROR
					//  from the Alpaca library.  Use the "format" property instead
					//  (see below).
					// "type": "date",
					"title": "Summoning Time",

					// TODO: Disabling this for now.  Getting an error
					//  from the bootstrap-datetimepicker library.

					/*
					"format": "date",
					 */
					"readonly": true,
					"required": true,
					// TODO: This doesn't work.
					//
					// Set it to read-only so only the datetimepicker control
					//  can enter dates, to avoid having the user enter an
					//  invalid date.
					// "readonly": true,
				},
				"triggerUpdateCounter": {
					"title": "TRIGGER UPDATE CONTAINER",
					"required": true,
					"hidden": true,
				}
			}
		},
		"options": {
			// Add this to the top of the "options" section.  Without
			//  this form level validator property/function, the per-field
			//  validators will NOT fire!
			"validator": function(callback) {
				
				const dateToday = new Date();
			
				// Get the Alpaca form data object.
				let formDataObj = this.getValue();

				// Calculate the derived fields and check for errors.  If an error
				//  occurs, build an object appropriate for the Alpaca callback
				//  function and push it into the aryErrObjs variable.
				let aryErrObjs = [];
				// const offerType = getAlpacaFieldValue(this, "offerType");
				
				// Derive the expiration date/time delta value by
				// Update the hidden expiration date/time delta field.
				// setAlpacaFieldValue(this, "expirationDateTimeDelta", expirationDateTimeDelta);

				// Any errors?
				if (aryErrObjs.length > 0) {
					let errMsg = null;
					
					// Yes.  Build an appropriate error message.
					if (aryErrObjs.length <= 1)
						errMsg = aryErrObjs[0];
					else
						errMsg = `Please fix the following errors first: \n` + aryErrObjs.join('\n');
						
					callback({
						"status": false,
						"message": errMsg
					});
					return;
				} else {
					// Let the Alpaca handler know the form level validations passed.
					callback({
						"status": true
					});
				}
			},
			// FIELD LEVEL SETTINGS.
			"fields": {
				"depositTokenSymbol": {
					// NOTE: Changing the currentAssetSymbolSelected hidden field will update the
					//  this field.
					/*
					"dependencies": {
						"currentAssetSymbolSelected":
					}
					 */
					"dataSource": dataSrcCryptoSymbol,
				},
				"displayName": {
					"validator": function(callback) {
						validateStringField_basic(this, callback, this.getTitle());
					}
				},
				"dilutionBound": {
					"validator": function(callback) {
						validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_DILUTION_BOUND, true);
					}
				},
				"membershipFee": {
					"validator": function(callback) {
						validateRangeBoundNumericField(this, callback, this.getTitle(), DEFAULT_MEMBERSHIP_FEE, MAX_NUMBER_OF_SHARES_AND_LOOT, false);
					}
				},
				"minSummonerShares": {
					"validator": function(callback) {
						validateRangeBoundNumericField(this, callback, this.getTitle(), 0, DEFAULT_GRANTSDAO_MAX_SUMMONER_SHARES, false);
					}
				},
				"periodDuration": {
					"validator": function(callback) {
						validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_PERIOD_DURATION, true);
					}
				},
				"votingPeriodLength": {
					"validator": function(callback) {
						validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_VOTING_PERIOD_LENGTH, true);
					}
				},
				"processingReward": {
					"validator": function(callback) {
						validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_PROCESSING_REWARD_TOKENS, true);
					}
				},
				"proposalDeposit": {
					"validator": function(callback) {
						// The proposal deposit must not be less than the processing reward.
						const proposalDeposit = this.getValue();
						const processingReward = getAlpacaFieldValue(this, "processingReward");

						if (proposalDeposit < processingReward) {
							callback({
								"status": false,
								"message": `The proposal deposit must not be less than the processing reward.`
							});
							return;
						}

						// Do the range bound validation now.
						validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_PROCESSING_REWARD_TOKENS, true);
					}
				},
				/*
				"validator": function(callback) {
					// Get this field's current value.
					let value = this.getValue();
					
					// Validation logic.
					callback({
						"status": true
					});
					
					// Get the value of another field on the form.
					let age = this.getParent().childrenByPropertyId["age"].getValue();
					// Validation logic.
					if ((value === "beer" || value === "wine") && age < 21) {
						callback({
							"status": false,
							"message": "You are too young to drink alcohol!"
						});
						return;
					}
					callback({
						"status": true
					});
					return;
					 */
			},
			"form": {
				/*
				ROS: This block is only needed if the form data is submitted
				directly to a back-end server.
				"attributes":{
					"action":"<some API URL>",
					"method":"POST"
				},
				 */
				// ---------------- SUBMIT BUTTON ----------------
				"buttons":{
					"submit":{
						"title": "Create This DAO",
						"id": g_AlpacaSubmitButtonId,
						"click": function(a, b, c) {
							const formDataObj = this.getValue();
							
							if (this.isValid(true)) {
								g_NeoLineHelper.instance.createDao_promise(formDataObj, formDataObj.depositTokenSymbol);
								
								// alert(`Submit the data to the NeoLine extension!`);
							} else {
								alert("Invalid value: " + JSON.stringify(formDataObj, null, "  "));
							}
						}
					}
				},
				// set this flag to TRUE if you don't want to show validation errors
				//  to the user when the form is first presented.
				"hideInitValidationError": false,
			},
			"helper": "Create a new DAO",
		},
		"postRender": function(control) {
			const fldTriggerUpdateCounter = control.childrenByPropertyId["triggerUpdateCounter"];
			const fldlDepositTokenSymbol = control.childrenByPropertyId["depositTokenSymbol"];

			// When fldTriggerUpdateCounter field changes, trigger
			//  a refresh of the depositTokenSymbol field.
			fldTriggerUpdateCounter.on("change", function() {
				fldlDepositTokenSymbol.refresh();
			})

			// when the "validated" even is raised, enable the submit button
			control.on("validated", function(e) {
				$(g_AlpacaSubmitButtonId_selector).prop("disabled", false);
			});
		}

		/*
		"postRender": function(control) {
			const fldlDepositToken = control.childrenByPropertyId["depositToken"];
			const fldCurrentAsset = control.childrenByPropertyId["currentAssetSymbolSelected"];

			// Subscribe depositToken field to changes
			//  in the currentAssetSymbolSelected field, which is updated
			//  automatically when the use selects a new cryptocurrency
			//  asset from the drop-down list for those.
			fldlDepositToken.subscribe(fldCurrentAsset, function(val) {
				// The line below is from the Alpaca observables docs.
				//  It shows how you can get the value of the field's
				//  "enum" property from the "this" object.
				// this.schema.enum = this.options.optionLabels = teams[val];

				// Copy the current value of the currentAssetSymbolSelected field
				//  into the depositToken field.
				this.schema = val;

				this.refresh();
			});
		}
		 */

		/*
		"postRender": function(control) {
			// control.childrenByPropertyId["name"].getFieldEl().css("background-color", "lightgreen");
		}
		 */
	});
	
	// Use jQuery directly to set the expiration date-time field
	//  to read-only so only the datetimepicker control can enter
	//  dates, to avoid having the user enter an invalid date.
	//  We tried the Alpaca declarations first but they didn't work.
	//  See above.
	$("#" + g_IdOfAlpacaExpirationDateTimeField).attr('readOnly', 'true');
}

// Document ready handler.
$(document).ready(function (){
	let errPrefix = '(create-dao-page-support) ';
	
	// Get the page URL arguments.
	const urlArgs = getUrlArguments();
	
	// Sample Click handler.
	$('#reorder-page-link-a').click(
		function() {
        	return false;
		}
	);
	
	g_GlobalNamespaces.instance.initializeGlobals_promise(true, fetchAssetPriceAndCreateForm_createdao);
	
	// onbeforeunload event handler for the page.
	window.onbeforeunload =
			function (e) {
				// console.log(e.stringify());
				// Don't show the page exit confirmation dialog if the Submit button was
				//  the reason we are leaving the page.
				if (!gSubmitButtonCalling)
					return "Did you save any changes you made?";
			}
			
	// Initialize the help system.
	initializeHelpSystem();

	// TODO: After the contest, get the cryptocurrency assets list
	//  object working and disable this command.  (See
	//	fetchAssetPriceAndCreateForm_createdao() for where it is
	//	supposed to occur.
	//
	// Configure the Alpaca form.
	// createAlpacaForm_createdao(g_CurrentAssetSymbol, g_CurrentAssetPrice);

	// Pass in some parameter values so createAlpacaForm_createdao() does not throw
	// an error.
	// createAlpacaForm_createdao('NEO', 1);
	
    // Testing datepicker outside of Alpaca.
    // $('#startDate').datetimepicker({ format: 'dd/MM/yyyy hh:mm:ss' });

	/*
	// Render the Alpaca form using the offer data passed to us.
	$.get( "/get_form_data?offer_id=" + "#{offer_id}", function( data )
	{
		// Get the offer data for the desired offer.
		$("#form").alpaca(data);

		// Add our event handler that lets us know the Alpaca forms submit button was clicked.
		//  That button has a data-key attribute with a value equal to 'submit'.
		$("button[data-key='submit']").click(
		(
			function ()
			{
				// Let the onbeforeunload handler know the submit button was clicked.
				//  so we don't interrupt the save operation.
				gSubmitButtonCalling = true;
			}
		));
	});
	 */
	
});


// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&


