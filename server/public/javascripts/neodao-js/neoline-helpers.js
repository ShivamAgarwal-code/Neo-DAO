// This file contains code that helps with interacting with the
//	NeoLine Chrome extension.

/*

IMPORTANT: Currently we forcing integer values for several
	DAO settings that would be better as fractional values.
	We should do that later.  But when we do, we will need
	to upsize the values to BigInteger and then modifiy
	the Neodao smart contract to suit (especially be
	careful with values used in multiplication like the
	Dilution Bound multiplier!).
 */

// The default NEO transaction fee.
const DEFAULT_NEO_TRANSACTION_FEE = 0.0001;

// The asset symbol for NEO GAS tokens, the native
//  currency used by our NEO smart contracts.
const ASSET_SYMBOL_NEO_GAS = 'GAS';

// TODO: Research this value.
// The number of periods in a DAO day.
const DAO_PERIODS_PER_DAY = 5;

// The fee our Neodao contract charges for
//  usage of the contract.
const NEODAO_TRANSACTION_FEE = 1;

// The script hash of the most recently used NEO address.
let g_LastPickedAddressAsScriptHash = null;

// This label, if found in the "value" field by
//  the makePaymentViaNeoLine_promise(),
//  will be replaced with the N3 account address
//  the user selects from the wallet.
const SUBST_LABEL_USER_ADDRESS = '@user_account_address';

const g_AryTokenSymbolToScriptHashes = [
	{ symbol: 'NEO', hash: '0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5'},
	{ symbol: 'GAS', hash: '0xd2a4cff31913016155e38e474a2c06d08be276cf' },
	// TODO: WARNING! Keep this value updated if the contract is redeployed
	//  as a brand new contract, instead of as an "update"!
	// { symbol: 'NEODAO_TESTNET', hash: '0x1ff79db507f1f236bcf426e30a5afbeff86d5a85'}
	{ symbol: 'NEODAO_TESTNET', hash: '8964b5d1ea51aa7158bd9576fbe53bdde5962a7f'}
];

/**
 * Simple object to hold one of the type/value objects used
 *  in communications to and from a Neo N3 RPC endpoint.
 */
function NeoTypeValue() {
	const self = this;
	const methodName = self.constructor.name + '::' + `constructor`;
	const errPrefix = '(' + methodName + ') ';

	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = misc_shared_lib.getSimplifiedUuid();

	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();

	/** @property {string} - The type stored in the "value" field. */
	this.type = null;

	/** @property {*} - The value. */
	this.value = null;
}

/**
 * This function throws an error if the given object is not a valid
 *  NeoTypeValue object.  Otherwise it just exists.
 *
 * @param {object} obj
 */
NeoTypeValue.isValidOrDie = function(obj) {
	const errPrefix = `(NeoTypeValue::isValid) `;

	if (!misc_shared_lib.isNonNullObjectAndNotArray(obj))
		throw new Error(`${errPrefix}The obj parameter is not a valid object.`);
	if (typeof obj.type === 'undefined')
		throw new Error(`${errPrefix}The object is missing a "type" field.`);
	if (misc_shared_lib.isEmptySafeString(obj.type))
		throw new Error(`${errPrefix}The object has an empty "type" field.`);

	if (typeof obj.value === 'undefined')
		throw new Error(`${errPrefix}The object is missing a "value" field.`);
}

/**
 * Given a NeoTypeValue object, extract its value
 *  and apply any need translations against it.
 *
 * @param neoTypeValueObj
 *
 * @return {*}
 */
function extractValueFromRpcNeoTypeObj(neoTypeValueObj) {
	const errPrefix = `(decodeRpcResponseChildObj) `;

	NeoTypeValue.isValidOrDie(neoTypeValueObj);

	// The default is just to return the value field.
	let retValue = neoTypeValueObj.value;

	if (neoTypeValueObj.type === 'ByteString')
		// ByteString are base64 encoded.
		retValue = atob(neoTypeValueObj.value);

	return retValue;
}


/**
 * Create a JSON object that contains the contents
 *  of a DAO summary object, from an array of
 *  NeoTypeValue objects that comprise the
 *  DAO summary objects content.s
 *
 * @param {NeoTypeValue} neoTypeValueArrayObj - A
 *  NeoTypeValue object that should be of type "Array".
 *
 * @return {object} - Returns a JSON object with the
 *  decoded DAO summary object content.
 */
function decodeRpcDaoSummaryObject(neoTypeValueArrayObj) {
	const errPrefix = `(decodeRpcDaoSummaryObject) `;

	NeoTypeValue.isValidOrDie(neoTypeValueArrayObj);

	const aryDaoSummaryFields = neoTypeValueArrayObj.value;

	const NUM_FIELDS_IN_SUMMARY = 5;

	if (!Array.isArray(aryDaoSummaryFields))
		throw new Error(`${errPrefix}The aryDaoSummaryFields parameter value is not an array.`);
	if (aryDaoSummaryFields.length !== NUM_FIELDS_IN_SUMMARY)
		throw new Error(`${errPrefix}The aryDaoSummaryFields parameter should have exactly ${NUM_FIELDS_IN_SUMMARY} fields.  Found: ${aryDaoSummaryFields.length}.`);

	let retObj = {};

	for (let fldNdx = 0; fldNdx < aryDaoSummaryFields.length; fldNdx++) {
		const neoTypeValueObj = aryDaoSummaryFields[fldNdx];

		if (!misc_shared_lib.isNonNullObjectAndNotArray(neoTypeValueObj))
			throw new Error(`${errPrefix}The neoTypeValueObj found  is not a valid object.`);

		switch (fldNdx) {
			case 0:
				retObj.id = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 1:
				retObj.proposalDeposit = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 2:
				retObj.processingReward = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 3:
				retObj.displayName = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 4:
				retObj.membershipFee = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			default:
				throw new Error(`${errPrefix}Invalid field index found while decoding DAO summary object.  Field index: ${fldNdx}`);
		}
	}

	return retObj;
}


/**
 * Create a JSON object that contains the contents
 *  of a proposal summary object, from an array of
 *  NeoTypeValue objects that comprise the
 *  proposal summary objects content.
 *
 * @param {NeoTypeValue} neoTypeValueArrayObj - A
 *  NeoTypeValue object that should be of type "Array".
 *
 * @return {object} - Returns a JSON object with the
 *  decoded proposal summary object content.
 */
function decodeRpcProposalSummaryObject(neoTypeValueArrayObj) {
	const errPrefix = `(decodeRpcProposalSummaryObject) `;

	NeoTypeValue.isValidOrDie(neoTypeValueArrayObj);

	const aryProposalSummaryFields = neoTypeValueArrayObj.value;

	const NUM_FIELDS_IN_SUMMARY = 7;

	if (!Array.isArray(aryProposalSummaryFields))
		throw new Error(`${errPrefix}The aryDaoSummaryFields parameter value is not an array.`);
	if (aryProposalSummaryFields.length !== NUM_FIELDS_IN_SUMMARY)
		throw new Error(`${errPrefix}The aryDaoSummaryFields parameter should have exactly ${NUM_FIELDS_IN_SUMMARY} fields.  Found: ${aryProposalSummaryFields.length}.`);

	let retObj = {};

	for (let fldNdx = 0; fldNdx < aryProposalSummaryFields.length; fldNdx++) {
		const neoTypeValueObj = aryProposalSummaryFields[fldNdx];

		if (!misc_shared_lib.isNonNullObjectAndNotArray(neoTypeValueObj))
			throw new Error(`${errPrefix}The neoTypeValueObj found  is not a valid object.`);

		switch (fldNdx) {
			case 0:
				retObj.id = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 1:
				retObj.details = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 2:
				retObj.lootRequested = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 3:
				retObj.paymentRequested = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 4:
				retObj.sharesRequested = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 5:
				retObj.tributeOffered = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			case 6:
				retObj.neofsCompoundIdPairs = extractValueFromRpcNeoTypeObj(neoTypeValueObj);
				break;
			default:
				throw new Error(`${errPrefix}Invalid field index found while decoding DAO summary object.  Field index: ${fldNdx}`);
		}
	}

	return retObj;
}

/**
 * Decode a list of DAO summaries received from an RPC call against
 *  our smart contract.
 *
 * @param {object} progressEvent - A valid progressEvent object
 *  received from an RPC call (XHR/Post)
 */
function decodeDaoSummaryListFromRpc(progressEvent) {
	const errPrefix = `(decodeDaoSummaryListFromRpc) `;

	if (!misc_shared_lib.isNonNullObjectAndNotArray(progressEvent))
		throw new Error(`${errPrefix}The progressEvent parameter is not a valid object.`);

	const aryOuter = progressEvent.currentTarget.response.result.stack;

	if (!Array.isArray(aryOuter))
		throw new Error(`${errPrefix}The outer array in the progress event object is not an array.`);
	// There should be at least one element in the outer array.  The results array is in the
	//  "value" field of the element in the first slot of the outer array.
	if (aryOuter.length < 1)
		throw new Error(`${errPrefix}The outer array in the progress event object is empty.`);

	const outerArrayObj = aryOuter[0];

	NeoTypeValue.isValidOrDie(outerArrayObj);

	// It must be of type "array".
	if (outerArrayObj.type !== 'Array')
		throw new Error(`${errPrefix}The "type" field in the outer array object is not "Array".`);

	const aryResults = outerArrayObj.value;

	if (!Array.isArray(aryResults))
		throw new Error(`${errPrefix}The aryResults parameter value is not an array.`);

	const aryDecodedSummaryObjs = [];

	// The response is an array of arrays.  The outer array
	//  consists of the DAO summary objects.  The inner array
	//  is the fields for each summary object and is an array
	//  of NeoTypeValue objects.
	for (let ndx = 0; ndx < aryResults.length; ndx++) {
		const arySummaryFields = aryResults[ndx];
		const daoSummaryObj = decodeRpcDaoSummaryObject(arySummaryFields);

		aryDecodedSummaryObjs.push(daoSummaryObj)
	}


	return aryDecodedSummaryObjs;
}

/**
 * Decode a list of proposal summaries received from an RPC call against
 *  our smart contract.
 *
 * @param {object} progressEvent - A valid progressEvent object
 *  received from an RPC call (XHR/Post)
 */
function decodeProposalSummaryListFromRpc(progressEvent) {
	const errPrefix = `(decodeDaoSummaryListFromRpc) `;

	if (!misc_shared_lib.isNonNullObjectAndNotArray(progressEvent))
		throw new Error(`${errPrefix}The progressEvent parameter is not a valid object.`);

	const aryOuter = progressEvent.currentTarget.response.result.stack;

	if (!Array.isArray(aryOuter))
		throw new Error(`${errPrefix}The outer array in the progress event object is not an array.`);
	// There should be at least one element in the outer array.  The results array is in the
	//  "value" field of the element in the first slot of the outer array.
	if (aryOuter.length < 1)
		throw new Error(`${errPrefix}The outer array in the progress event object is empty.`);

	const outerArrayObj = aryOuter[0];

	NeoTypeValue.isValidOrDie(outerArrayObj);

	// It must be of type "array".
	if (outerArrayObj.type !== 'Array')
		throw new Error(`${errPrefix}The "type" field in the outer array object is not "Array".`);

	const aryResults = outerArrayObj.value;

	if (!Array.isArray(aryResults))
		throw new Error(`${errPrefix}The aryResults parameter value is not an array.`);

	const aryDecodedSummaryObjs = [];

	// The response is an array of arrays.  The outer array
	//  consists of the DAO summary objects.  The inner array
	//  is the fields for each summmary object and is an array
	//  of NeoTypeValue objects.
	for (let ndx = 0; ndx < aryResults.length; ndx++) {
		const arySummaryFields = aryResults[ndx];
		const proposalSummaryObj = decodeRpcProposalSummaryObject(arySummaryFields);

		aryDecodedSummaryObjs.push(proposalSummaryObj)
	}

	return aryDecodedSummaryObjs;
}


/**
 * Return the current RPC URL we are using.
 *
 * @return {string}
 */
function lookupRpcUrl() {
	return `https://testneofura.ngd.network:444/`;
	// const url = 'http://seed7.ngd.network:10332';
}

/**
 * Look up the script hash for an asset symbol.
 *
 * @param {string} assetSymbol - The asset symbol
 *  whose hash is desired.
 *
 * @return {string} - Returns the script hash
 *  for the given asset symbol if found, Or
 *  an error is thrown if not.
 */
function lookUpScriptHashOrDie(assetSymbol) {
	const errPrefix = `(lookUpScriptHashOrDie) `;

	if (misc_shared_lib.isEmptySafeString(lookUpScriptHashOrDie))
		throw new Error(`${errPrefix}The n3AssetSymbol parameter is empty.`);

	for (let i = 0; i < g_AryTokenSymbolToScriptHashes.length; i++) {
		if (g_AryTokenSymbolToScriptHashes[i].symbol == assetSymbol)
			return g_AryTokenSymbolToScriptHashes[i].hash;
	}

	throw new Error(`${errPrefix}Unable to find a script hash for asset symbol: ${assetSymbol}`);
}

/**
 * This is a temporary object that is used to hold the bag of
 * 	details that are the user defined settings or a new DAO.
 * 	It is not persisted and is only used during the confirmation
 * 	step in the DAO creation process.
 *
 * @param {Object} srcAlpacaFormDataObj - An Alpaca form data
 * 	object that contains the DAO settings entered by
 * 	the user and calculated by our code.
 * @param {string} assetSymbolOrDesc - The default token for
 *  the DAO.
 * @param {Number} currentAssetPrice - The current asset price
 * 	denominated in the preferred DAO token.
 * @param {String} preferredTargetCurrency - The target
 * 	currency all the price related fields in the form
 * 	data object are denominated in (e.g. - "USD").
 *
 * @constructor
 */
function NewDaoDetailsBag(srcAlpacaFormDataObj, assetSymbolOrDesc, currentAssetPrice, preferredTargetCurrency) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';

	if (!misc_shared_lib.isNonNullObjectAndNotArray(srcAlpacaFormDataObj))
		throw new Error(errPrefix + `The srcAlpacaFormDataObj is not a valid object.`);

	if (misc_shared_lib.isEmptySafeString(assetSymbolOrDesc))
		throw new Error(`${errPrefix}The assetSymbolOrDesc parameter is empty.`);

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

	/** @property {Object} - An Alpaca form data object that contains the offer
	 * 	details values entered by the user and calculated by our code. */
	this.srcAlpacaFormDataObj = srcAlpacaFormDataObj;

	/** @property {String} - The target currency all the price related fields
	 * in the form data object are denominated in (e.g. - "USD"). */
	this.preferredTargetCurrency = preferredTargetCurrency;

	/**
	 * Using the current contents of this object, build the text/HTML
	 * 	to show on the floating DIV that gets final confirmation from
	 * 	the user before they complete an offer creation.
	 *
	 * @return {String} - A string is returned that can be used for the
	 * 	dialog HTML block required by one of our EZDialog objects.
	 */
	this.buildConfirmationDialogText = function() {
		let methodName = self.constructor.name + '::' + `buildConfirmationDialogText`;
		let errPrefix = '(' + methodName + ') ';

		const strGracePeriodLengthInDays = self.srcAlpacaFormDataObj.gracePeriodLength * DAO_PERIODS_PER_DAY;
		const strVotingePeriodLengthInDays = self.srcAlpacaFormDataObj.votingPeriodLength * DAO_PERIODS_PER_DAY;

		let strMembershipFeeDesc_1 = '';
		let strMembershipFeeDesc_2 = '';
		const strTokenWord = self.srcAlpacaFormDataObj.membershipFee > 1 ? 'tokens' : 'token';

		if (self.srcAlpacaFormDataObj.membershipFee > 0) {
			strMembershipFeeDesc_1 = `${self.srcAlpacaFormDataObj.membershipFee}`;

			// A membership fee is specified.  Build the text for that.
			strMembershipFeeDesc_2 = `You require a membership fee of ${self.srcAlpacaFormDataObj.membershipFee} ${self.depositTokenSymbol} ${strTokenWord} to join the DAO.`;

		} else {
			strMembershipFeeDesc_1 = `(none)`;

			// No membership fee required to join the DAO.
			strMembershipFeeDesc_2 = `You have not specified a membership fee.  Anyone can join the DAO for free.`;
		}

		// Build the confirmation dialogue.
		/*
		const paymentsPayoutsAndTermsHtml =
			g_AryHandlebarsTemplates['neo-dao-mini-template'](
				{
					currentAssetSymbol: assetSymbolOrDesc,
					systemTransactionFeePercentage: g_SystemTransactionFeePercentage
				}
			);
		*/

		// TODO: For now we are ignoring the minimum summoner shares, so
		//  it is not in the confirmation dialogue.
		let htmlText =
			`
			<p class="section-sub-header">Summary</p>
			<p class="section-body">
				You are about to create a DAO named ${self.srcAlpacaFormDataObj.displayName} with the following
				settings:
				<ul>
					<li>
						DEFAULT TOKEN: ${self.srcAlpacaFormDataObj.depositTokenSymbol}
						
						You have selected ${self.srcAlpacaFormDataObj.depositTokenSymbol} tokens as
						the default token for DAO transactions.
					</li>
					<li>
						DILUTION BOUND (multiplier): ${self.srcAlpacaFormDataObj.dilutionBound}
						
						If there is a mass rage-quit, the maximum a member
						who votes YES as part of the rage-quit will be ${self.srcAlpacaFormDataObj.dilutionBound}
						times ??? VALUE ???
					</li>
					<li>
						GRACE PERIOD LENGTH: ${strGracePeriodLengthInDays} days
						
						The grace period for the DAO is ${strGracePeriodLengthInDays} days 
					</li>
					<li>
						MEMBERSHIP FEE: ${strMembershipFeeDesc_1}

						${strMembershipFeeDesc_2}
					</li>
					<li>
						PROCESSING REWARD: ${self.srcAlpacaFormDataObj.processingReward} tokens
						
						The reward for processing a proposal is ${self.srcAlpacaFormDataObj.processingReward} tokens.
					</li>
					<li>
						PROPOSAL DEPOSIT: ${self.srcAlpacaFormDataObj.proposalDeposit} tokens
						
						The deposit required for a proposal is ${self.srcAlpacaFormDataObj.proposalDeposit} tokens.
					</li>
					<li>
						VOTING PERIOD LENGTH: ${strVotingePeriodLengthInDays} days
						
						The duration of the voting period is ${strVotingePeriodLengthInDays} days.
					</li>
				</ul>
			</p>
			
			<p class="section-body">
				span<class="help-field-label"> NEODAO TRANSACTION FEE:</span>
				span<class="help-text"> 
					NOTE: All transactions will have a Neodao transaction fee of ${NEODAO_TRANSACTION_FEE}
					percent applied to all transactions involving the Neodao smart contract
					that transfer funds between all parties involved with the DAO.</span>
			</p>
			<p class="section-body">
				span<class="help-text")  If you are satisfied with your DAO settings,
					clicking the OK button to create your new DAO.  Clicking the
					OK button indicates your acceptance of this information <i>and</i>
					also that you accept fully the Neodao site <b>Terms of Use</b> and
					<b>Privacy Policy</b>.
				</span>
			</p>			
			`;

		return htmlText;
	}

	// --------------- CONSTRUCTOR CODE -------------

	// Validate the content we were passed.
	// this.Validate();
}

/**
 * A simple class to hold a blockchain account along with a label
 * 	that describes it.
 *
 * @param  {String} accountAddress - The account address.
 * @param {String} accountLabel - A label that describes the account address.
 *
 * @constructor
 */
function AccountLabelAndAddress(accountAddress, accountLabel) {
	const self = this;
	const methodName = self.constructor.name + '::' + `constructor`;
	const errPrefix = '(' + methodName + ') ';

	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = misc_shared_lib.getSimplifiedUuid();

	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();

	if (misc_shared_lib.isEmptySafeString(accountAddress))
		throw new Error(errPrefix + `The accountAddress parameter is empty.`);

	if (misc_shared_lib.isEmptySafeString(accountLabel))
		throw new Error(errPrefix + `The accountLabel parameter is empty.`);

	/** @property {String} - The account address. */
	this.accountAddress = accountAddress;

	/** @property {String} - A label that describes the account address. */
	this.accountLabel = accountLabel;
}

/**
 * This function converts an integer to BigInteger format by
 * 	multiplying by the BigInteger multiplier and then
 * 	truncated to an integer.
 *
 * @param {Number} theNumber - The number to transform.
 *
 * @return {number} - The number in BigInteger format.
 */
function upsizeToBigInteger(theNumber) {
	let errPrefix = `(upsizeToBigInteger) `;

	if (typeof theNumber !== 'number')
		throw new Error(errPrefix + `The value in the theNumber parameter is not number.`);

	return Math.trunc( theNumber * price_shared_lib.BIGINTEGER_MULTIPLIER);
}

/**
 * Convert a price so one that it is denominated in a desired
 * 	smart contract's native currency.
 *
 * @param {Number} assetPrice - The price of the asset.
 * @param {String} assetDenominatedInCurrency - The asset symbol
 * 	for the currency the assetPrice is denominated in.
 * @param {String} smartContractCurrency - The asset symbol
 * 	for the currency used natively by the relevant smart
 * 	contract.
 * @param {Number} sccCurrentPrice - The current price for the
 * 	smart contract currency.
 * @param {String} sccDenominatedInCurrency - The asset symbol
 * 	for the currency the sccCurrentPrice is denominated in.
 * @param {Boolean} bUpsizeToBigInteger - If TRUE, then
 * 	the resulting price will be upsized to BigInteger
 * 	format.  If FALSE, then it won't be upsized.
 *
 * @return {Number} - Returns the BigInteger encoding of the
 * 	given float, denominated in the smart contract
 * 	currency.
 */
function convertFloatToSccCurrency(
	assetPrice,
	assetDenominatedInCurrency,
	smartContractCurrency,
	sccCurrentPrice,
	sccDenominatedInCurrency,
	bUpsizeToBigInteger) {
	let errPrefix = `(convertFloatToBigIntInSccCurrency) `;

	const validatedAssetPrice = price_shared_lib.validatePrice(assetPrice, false, false);

	if (validatedAssetPrice === null)
		throw new Error(errPrefix + `The asset price is not valid: ${validatedAssetPrice}.`);

	if (misc_shared_lib.isEmptySafeString(assetDenominatedInCurrency))
		throw new Error(errPrefix + `The denominatedInCurrency parameter is empty.`);

	if (misc_shared_lib.isEmptySafeString(smartContractCurrency))
		throw new Error(errPrefix + `The smartContractCurrency parameter is empty.`);

	const validatedSccPrice = price_shared_lib.validatePrice(sccCurrentPrice, false, false);

	if (validatedSccPrice === null)
		throw new Error(errPrefix + `The smart contract currency price is not valid: ${validatedSccPrice}.`);
	if (misc_shared_lib.isEmptySafeString(sccDenominatedInCurrency))
		throw new Error(errPrefix + `The sccDenominatedInCurrency parameter is empty.`);

	if (typeof bUpsizeToBigInteger !== 'boolean')
		throw new Error(errPrefix + `The value in the bUpsizeToBigInteger parameter is not boolean.`);

	// If the asset symbol and the smart contract currency are not the
	//  same, then we must divide the asset price by the smart contract
	//  currency price first to make sure everything is denominated
	//  in the currency used natively by the relevant smart contract.
	let newAssetPrice = validatedAssetPrice;
	/* This function only works if the smart contract
     * 	price parameter is denominated in the same currency
     * 	as the asset price!  (e.g. - If the asset price is
     * 	Bitcoin denominated in USD, and the smart contract
     * 	currency is NEO, then the smart contract price
     * 	parameter must be denominated in USD as well).
     */
	if (assetDenominatedInCurrency !== smartContractCurrency) {
		// The two prices must be denominated in the same
		//  currency.
		if (assetDenominatedInCurrency !== sccDenominatedInCurrency)
			throw new Error(errPrefix + `The asset price("${assetDenominatedInCurrency}") is not denominated in the same currency as the smart contract currency price("${sccDenominatedInCurrency}").`);

		// Renumerate the asset price in the smart contract
		//  price.
		newAssetPrice = newAssetPrice/validatedSccPrice;
	}

	// Upsize the value to BigInteger format?
	let retVal = null;

	if (bUpsizeToBigInteger)
		retVal = upsizeToBigInteger(newAssetPrice);
	else
		retVal = newAssetPrice;

	return retVal;
}

/**
 * This object provides helper functions for interacting with the NeoLine
 * 	Chrome extension.
 *
 * @constructor
 */
function NeoLineHelper() {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';

	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = misc_shared_lib.getSimplifiedUuid();

	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();

	/** @property {Boolean} - If FALSE, then we have not received the ready event
	 *    yet from the NeoLine Chrome extension.  Once we have, this field will
	 *    be set to TRUE. */
	this.isNeoLineReady = false;

	// TODO: Later, change this to a full subscriber based strategy.
	//
	/** @property {function|null} - Set this function to a Javascript
	 *   function of your making if you want to be notified when
	 *   the NeoLine object is ready. */
	this.funcCallMeWhenReady = null;

	// Listen for the event from the NeoLineN3 extension that tells
	//	us it is ready for use.
	window.addEventListener('NEOLine.N3.EVENT.READY', () => {
		console.log(`NEOLineN3 ready event received.`);

		// Don't call any NeoLine functions here.  At the time this
		//  was written, you will get the error shown below if you try.
		//	Move any such code out of this event listener with a
		//	setTimeout() operation.
		//
		// Error message:
		//
		//	neoline-n3-test.html:66 Uncaught ReferenceError: Cannot access 'neolineN3' before initialization
		//

		// Set the ready flag.  NeoLine is now ready.
		self.isNeoLineReady = true;

		if (self.funcCallMeWhenReady)
			// Call the user defined callback handler so
			//  they know Neoline is now ready.
			self.funcCallMeWhenReady();
	});

	/**
	 * This promise asks NeoLine to ask the user to select a public
	 *    address from their account list.
	 *
	 * @return {Promise<AccountLabelAndAddress>} - The promise resolves
	 *  to a AccountLabelAndAddress object if the operation succeeded,
	 *    or FALSE if the user cancels the purchase operation, or it
	 *    rejects if an error occurs.
	 */
	this.pickAddress_promise = function () {
		const methodName = self.constructor.name + '::' + `pickAddress_promise`;
		const errPrefix = '(' + methodName + ') ';

		return new Promise(function (resolve, reject) {
			try {
				const neo3Obj = new window.NEOLineN3.Init();

				let pickedAddressAndLabelObj = null;

				// >>>>> STEP: Have the user choose the public address they wish to use
				//  for making a payment.
				let operationStep = 'allowing user to select the desired public address';
				console.info(errPrefix + `Executing step: ${operationStep}.`);

				neo3Obj.pickAddress()
					.then(result => {
						if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
							throw new Error(errPrefix + `The result of the NeoLine pickAddress() call is not a valid object.`);

						if (misc_shared_lib.isEmptySafeString(result.address))
							throw new Error(errPrefix + `The object that is the result of the NeoLine pickAddress() call has an invalid "address" field.`);

						if (misc_shared_lib.isEmptySafeString(result.label))
							throw new Error(errPrefix + `The object that is the result of the NeoLine pickAddress() call has an invalid "label" field.`);

						pickedAddressAndLabelObj = new AccountLabelAndAddress(result.address, result.label);

						// Resolve the promise with the picked address.
						resolve(pickedAddressAndLabelObj);
					})
					.catch(err => {
						console.info(errPrefix + `In error handling block.  Analyzing.`);
						let errMsg = `(No error message set).`;

						// If the user cancels a NeoLine request, the NeoLine extension
						//  throws an error of type "CANCELED" (one "L").
						const {type, description, data} = err;
						switch (type) {
							case 'CANCELED':
								console.warn(errPrefix + `The user cancelled the NeoLine request during operation step: ${operationStep}.`);
								alert(`Transaction cancelled.`);
								// Resolve the promise with FALSE.
								resolve(false);
								break;
							case 'NO_PROVIDER':
								errMsg = errPrefix + `NeoLine error reported: Unable to determine a provider for NEO blockchain services.`;
								console.error(errMsg);
								break;
							case 'CONNECTION_REFUSED':
								errMsg = errPrefix + `NeoLine error reported: The NEO RPC endpoint refused to connect.`;
								console.error(errMsg);
								break;
							case 'RPC_ERROR':
								errMsg = errPrefix + `NeoLine error reported: Unable to broadcast the transaction to the NEO blockchain network.`;
								console.error(errMsg);
								break;
							default:
								errMsg = errPrefix + `Unknown or invalid error type reported by the NeoLine extension.`;
								console.error(errMsg);
								console.info(errPrefix + `err object:`);
								console.dir(err, {depth: null, colors: true});
								break;
						}
					});
			} catch (err) {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + conformErrorObjectMsg(err);

				reject(errMsg + ' - try/catch');
			}
		});
	}

	/**
	 * Do our standard substitutions on the given string.
	 *
	 * @param str
	 */
	this.doStandardSubstitutions = function (str) {
		const methodName = self.constructor.name + '::' + `doStandardSubstitutions`;
		const errPrefix = '(' + methodName + ') ';

		if (typeof str !== 'string')
			throw new Error(`${errPrefix}The value in the str parameter is not a string.`);

		let retStr = str;


		// Yes.  Does it contain the picked address substitution label?
		if (str.indexOf(SUBST_LABEL_USER_ADDRESS) >= 0) {
			if (misc_shared_lib.isEmptySafeString(g_LastPickedAddressAsScriptHash))
				throw new Error(`${errPrefix}The last picked address as script hash variable has not been set`);

			// Yes.  Replace the substitution label with the Neo account
			//  address selected by the user for this transaction.
			retStr = misc_shared_lib.replaceAllOccurrences(str, SUBST_LABEL_USER_ADDRESS, g_LastPickedAddressAsScriptHash);
		}

		return retStr;
	}

	/**
	 * This function does deep inspection of an array of invoke call parameter
	 *  objects.  It performs in-place any substitutions needed on that value.
	 *
	 * @param {array<object>} aryOfInvokeParamObjs - An array of invoke
	 *  parameter objects, built by one of the upper level methods that
	 *  do the preparation work for an invoke call.
	 */
	this.performSubstitutionsOnInvokeParamArgs = function(aryOfInvokeParamObjs) {
		const methodName = self.constructor.name + '::' + `performSubstitutionsOnInvokeParamArgs`;
		const errPrefix = '(' + methodName + ') ';

		if (!Array.isArray(aryOfInvokeParamObjs))
			throw new Error(`${errPrefix}The aryOfInvokeParamObjs parameter value is not an array.`);

		if (aryOfInvokeParamObjs.length < 1)
			throw new Error(`${errPrefix}The aryOfInvokeParamObjs parameter value is empty`);

		for (let ndx = 0; ndx < aryOfInvokeParamObjs.length; ndx++) {
			const invokeParamObj = aryOfInvokeParamObjs[ndx];

			if (typeof invokeParamObj.type === 'undefined')
				throw new Error(`${errPrefix}The invokeParamObj parameter is missing a "type" field.`);
			if (typeof invokeParamObj.value === 'undefined')
				throw new Error(`${errPrefix}The invokeParamObj parameter is missing a "value" field.`);

			const lowerCaseType = invokeParamObj.type.toLowerCase();

			// Is it an array itself?
			if (lowerCaseType === 'array') {
				// Recursive call to check the child elements of the array.
				self.performSubstitutionsOnInvokeParamArgs(invokeParamObj.value);
			} else {
				// Is it a string *based* element?
				if ([ 'address', 'hash160', 'hash256', 'string'].includes(lowerCaseType))
					// Replace the value with a value that has had any needed
					//  substitutions performed on it.
					invokeParamObj.value = self.doStandardSubstitutions(invokeParamObj.value);
			}
		}
	}

	/**
	 * This function performs any of our standard substitutions on a
	 *  a TRUE string element that is destined for a place in the
	 *  invoke parameter object tree.  A TRUE string is a string
	 *  value that is not one of the dedicated invoke() call
	 *  parameter tyeps like Hash160, Address, etc., that
	 *  are strings in our Javascript space.
	 *
	 * @param {string} str - A string.
	 * @param {string} thePickedAddressAsScriptHash - The Neo address
	 *  picked by the user for the current Neo transaction.
	 * @return {string} - Returns the given string with our standard
	 *  substitutions applied to it.
	 *
	 this.performSubstitutions = function(str, thePickedAddressAsScriptHash) {
		 const methodName = self.constructor.name + '::' + `performSubstitutions`;
		 const errPrefix = '(' + methodName + ') ';

		 if (typeof str !== 'string')
		 	throw new Error(`${errPrefix}The value in the str parameter is not a string.`);
		 if (misc_shared_lib.isEmptySafeString(thePickedAddressAsScriptHash))
			 throw new Error(`${errPrefix}The thePickedAddressAsScriptHash parameter is empty.`);

		 if (str.indexOf(SUBST_LABEL_USER_ADDRESS) >= 0)
			 // Yes.  Replace the substitution label with the Neo account
			 //  address selected by the user for this transaction.
			 return misc_shared_lib.replaceAllOccurrences(str, SUBST_LABEL_USER_ADDRESS, thePickedAddressAsScriptHash);
		else
			return str;
	}
	 */

	/**
	 * Builds an invoke() call compatible string element object.
	 *
	 * @param {string} strElemVal - A string.
	 *
	 * @return {{type: string, value: string}}
	 */
	this.buildInvokeParamStringObject = function(strElemVal) {
		const methodName = self.constructor.name + '::' + `buildInvokeParamStringObject`;
		const errPrefix = '(' + methodName + ') ';

		// Empty strings are fine, but it must be of type "string".
		if (typeof strElemVal !== 'string')
			throw new Error(`${errPrefix}The value in the strElemVal parameter is not string.`);

		return { type: 'String', value: strElemVal };
	}

	/**
	 * Builds an invoke() call compatible integer element object.
	 *
	 * @param {number} intElement - A integer.
	 *
	 * @return {{type: string, value: string}}
	 */
	this.buildInvokeParamIntegerObject = function(intElement) {
		const methodName = self.constructor.name + '::' + `buildInvokeParamIntegerObject`;
		const errPrefix = '(' + methodName + ') ';

		if (typeof intElement !== 'number')
			throw new Error(`${errPrefix}The value in the intElement parameter is not a number.`);

		if (!Number.isInteger(intElement))
			throw new Error(`${errPrefix}The value in the intElement parameter is not an integer.`);

		return { type: 'Integer', value: intElement };
	}

	/**
	 * Turns a Javascript array into an array of invoke()
	 *  parameter string objects of the desired type.
	 *
	 * @param {array<string>>} aryElements - A Javascript array.
	 *
	 * @return {array<object>}
	 */
	this.doBuildInvokeParamArrayObj = function(aryElements, paramType) {
		const methodName = self.constructor.name + '::' + `doBuildInvokeParamArrayObj`;
		const errPrefix = '(' + methodName + ') ';

		if (!Array.isArray(aryElements))
			throw new Error(`${errPrefix}The aryElements parameter value is not an array.`);

		const aryRetParamObjs = [];

		// Turn each element into a invoke() compatible definition object
		//  and add them to the master object we are building.
		for (let ndx = 0; ndx < aryElements.length; ndx++) {
			const elem = aryElements[ndx];

			const newObj = {};

			newObj.type = paramType;
			const originalElemValue = elem;
			newObj.value = elem;

			// Build the value field while validating.
			if (paramType === 'String') {
				if (typeof elem !== 'string')
					throw new Error(`${errPrefix}The value at array element(${ndx}) is not a string.`);

				// The post-Neoline substitutions will be performed by the makePaymentViaNeoline_promise()
				//  method, after we have certain needed values.
			}
			else if (paramType === 'Integer') {
				if (typeof elem !== 'number')
					throw new Error(`${errPrefix}The value at array element(${ndx}) is not a number.`);
				if (!Number.isInteger(elem))
					throw new Error(`${errPrefix}The value at array element(${ndx}) is not an integer.`);

				// The value needs no modifications.
			}
			else if (paramType === 'Address') {
				if (typeof elem !== 'string')
					throw new Error(`${errPrefix}The value at array element(${ndx}) is not a string (Address).`);
				if (misc_shared_lib.isEmptySafeString(originalElemValue))
					throw new Error(`${errPrefix}The value at array element(${ndx}) is empty (Address).`);

				// The value needs no modifications.
			}
			else if (paramType === 'Hash160') {
				if (typeof elem !== 'string')
					throw new Error(`${errPrefix}The value at array element(${ndx}) is not a string (Hash160).`);
				if (misc_shared_lib.isEmptySafeString(originalElemValue))
					throw new Error(`${errPrefix}The value at array element(${ndx}) is empty (Hash160).`);

				// The value needs no modifications.
			}
			else
				throw new Error(`${errPrefix}Do not know how to build an invoke parameter object of this type yet: ${paramType}`);

			aryRetParamObjs.push(newObj);
		}

		return aryRetParamObjs;
	}

	/**
	 * Turns an Javascript string array into an array of invoke()
	 *  parameter string objects.
	 *
	 * @param {array<string>>} aryStrings - A Javascript string array.
	 *
	 * @return {array<object>}
	 *
	this.buildInvokeParamStrArrayObj = function(aryStrings) {
		const methodName = self.constructor.name + '::' + `buildInvokeParamStrArrayObj`;
		const errPrefix = '(' + methodName + ') ';

		if (!Array.isArray(aryStrings))
			throw new Error(`${errPrefix}The aryStrings parameter value is not an array.`);

		const aryRetParamObjs = [];

		// Turn each string into a invoke() compatible string definition object
		//  and add them to the master object we are building.
		for (let ndx = 0; ndx < aryStrings.length; ndx++) {
			const str = aryStrings[ndx];

			aryRetParamObjs.push(self.buildInvokeParamStringObject(str));
		}

		return aryRetParamObjs;
	}
	 */

	/**
	 * This promise sends a transaction to the GasToken smart contract on
	 * 	the NEO blockchain using the NeoLine Chrome extension.
	 *
	 * @param {Number} amountNeoGas - the amount of NEO GAS to send with the
	 * 	transaction, NOT upsized to BigInteger format.
	 * @param {Array} aryParameterArgs - The array of arguments to poss along with the
	 * 	send transaction or invoke call. These arguments end up in the "data[]" parameter
	 * 	in the smart contract onNEP17Payment() event handler, when the GasToken
	 * 	contract calls that method after successfully processing the payment.
	 * 	It may be empty, but it must be an array.
	 * @param {Number} transactionFee - The amount of NEO GAS to pay as the
	 * 	desired transaction fee (i.e. - processing fee).  Higher amounts
	 * 	result in higher priority for submitted transactions.
	 *
	 * @return {Promise<Boolean>} - The promise resolves to a simple boolean
	 * 	TRUE if the submission of the transaction succeeds, FALSE if the
	 * 	user cancels the purchase operation, or it rejects if there
	 * 	is an error.
	 *
	 * NOTE: Remember to wait for the transaction confirmation event, which
	 * 	occurs asynchronously after submitting a transaction to the blockchain.
	 */
	this.makePaymentViaNeoLine_promise = function(amountNeoGas, aryParameterArgs, transactionFee=DEFAULT_NEO_TRANSACTION_FEE) {
		const methodName = self.constructor.name + '::' + `makePaymentViaNeoLine_promise`;
		const errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (!g_NeoLineHelper.instance.isNeoLineReady)
					throw new Error(errPrefix + `The NeoLine Chrome extension is not ready yet.`);

				if (typeof amountNeoGas !== 'number')
					throw new Error(errPrefix + `The value in the amountNeoGas parameter is not a number.`);
				// if (amountNeoGas <= 0)
				//	throw new Error(errPrefix + `The value in the amountNeoGas parameter is less than one.`);
				if (amountNeoGas < 0)
					throw new Error(errPrefix + `The value in the amountNeoGas parameter is negative.`);
				if (!Array.isArray(aryParameterArgs))
					throw new Error(errPrefix + `The aryArgs parameter value is not an array.`);

				// TODO: When we are also on the MainNet this code MUST be updated
				//  to provide the correct script hash.
				//
				// Lookup the Neodao contract script hash on TestNet.
				const neoDaoScriptHash = lookUpScriptHashOrDie('NEODAO_TESTNET');
				const gasTokenScriptHash = lookUpScriptHashOrDie('GAS');
				const neoTokenScriptHash = lookUpScriptHashOrDie('NEO');

				/*
				// Get the Neodao script hash from the environment.

				if (misc_shared_lib.isEmptySafeString(neodaoScriptHash))
					throw new Error(errPrefix + `The neodaoScriptHash server configuration field is empty.`);
				const neodaoScriptHash = g_GlobalNamespaces.instance.serverConfigVars.neodao_script_hash;

				const gasTokenScriptHash = g_GlobalNamespaces.instance.serverConfigVars.gastoken_script_hash;

				if (misc_shared_lib.isEmptySafeString(gasTokenScriptHash))
					throw new Error(errPrefix + `The gasTokenScriptHash server configuration field is empty.`);

				 */

				/* TODO: Put this event listener somewhere more sensible.
				window.addEventListener('NEOLine.NEO.EVENT.TRANSACTION_CONFIRMED', (data) => {
					console.log('NEOLineN3 transaction confirmed received.');
					if (g_LastPaymentTxId === data.detail.txid) {
						// Payment confirmed.
						console.log(errPrefix + "Transaction with ID(${data.detail.txid}) has been confirmed.");
					}
				});
				 */

				// TODO: Should we put a NULL/UNDEFINED object check here?
				const neo3Obj = new window.NEOLineN3.Init();

				let theLabelOfPickedAddress = null;
				let thePickedaddress = null;
				let thePickedAddressAsScriptHash = null;

				// >>>>> STEP: Have the user choose the public address they wish to use
				//  for making a payment.
				let operationStep = 'allowing user to select the desired public address';
				console.info(errPrefix + `Executing step: ${operationStep}.`);

				neo3Obj.pickAddress()
					.then(result => {
						if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
							throw new Error(errPrefix + `The result of the NeoLine pickAddress() call is not a valid object.`);

						if (misc_shared_lib.isEmptySafeString(result.address))
							throw new Error(errPrefix + `The object that is the result of the NeoLine pickAddress() call has an invalid "address" field.`);

						if (misc_shared_lib.isEmptySafeString(result.label))
							throw new Error(errPrefix + `The object that is the result of the NeoLine pickAddress() call has an invalid "label" field.`);

						thePickedaddress = result.address;
						theLabelOfPickedAddress = result.label;

						// >>>>> STEP: Convert the picked address to a script hash.
						operationStep = `Converting picked address(${thePickedaddress}) to a script hash`;
						console.info(errPrefix + `Executing step: ${operationStep}.`);

						return neo3Obj.AddressToScriptHash({address: thePickedaddress});
					})
					.then(result => {
						// The result should be an object with a single field named "scriptHash".
						if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
							throw new Error(errPrefix + `The result of the AddressToScriptHash() call is not a valid object.`);
						thePickedAddressAsScriptHash = result.scriptHash;

						if (misc_shared_lib.isEmptySafeString(thePickedAddressAsScriptHash))
							throw new Error(errPrefix + `The result of the AddressToScriptHash() call is not a valid string.`);

						// Put the value where others can find it.
						g_LastPickedAddressAsScriptHash = thePickedAddressAsScriptHash;

						// Perform any needed substitutions.
						self.performSubstitutionsOnInvokeParamArgs(aryParameterArgs);

						// >>>>> STEP: Ask NeoLine to execute the desired blockchain transaction.
						operationStep = `Invoking transaction with script hash: ${thePickedAddressAsScriptHash}`;
						console.info(errPrefix + `Executing step: ${operationStep}.`);

						if (true) {
							console.info(errPrefix + `aryParameterArgs object:`);
							console.dir(aryParameterArgs, {depth: null, colors: true});
						}

						console.warn('thePickedAddressAsScriptHash', thePickedAddressAsScriptHash);

						return neo3Obj.invoke({
							scriptHash: gasTokenScriptHash,
							operation: 'transfer',
							args: [
								{
									// From - the user sending the transaction
									"type": "Address",
									"value" : thePickedaddress
								},
								{
									// To - the smart contract that should receive the payment.
									"type": "Hash160",
									"value": neoDaoScriptHash
								},
								{
									// Amount - the amount to send with the transaction
									"type": "Integer",
									"value": amountNeoGas.toString()
								},
								{
									// data[] object that the GasToken contract will pass
									//  to our smart contract's onNEP17Payment()
									//	public method.
									"type": "Array",
									"value": aryParameterArgs
								},
							],
							fee: transactionFee.toString(),
							broadcastOverride: false,
							signers: [
								{
									account: thePickedAddressAsScriptHash,
									scopes: 1
								}
							],
						});
					})
					.then(result => {
						console.log('Read invocation result: ' + JSON.stringify(result));

					})
					.catch(err => {
						console.info(errPrefix + `In error handling block.  Analyzing.`);
						let errMsg = `(No error message set).`;

						// If the user cancels a NeoLine request, the NeoLine extension
						//  throws an error of type "CANCELED" (one "L").
						const {type, description, data} = err;
						switch(type) {
							case 'CANCELED':
								console.warn(errPrefix + `The user cancelled the NeoLine request during operation step: ${operationStep}.`);
								alert(`Transaction cancelled.`);
								// Resolve the promise with FALSE.
								resolve(false);
								break;
							case 'NO_PROVIDER':
								errMsg = errPrefix + `NeoLine error reported: Unable to determine a provider for NEO blockchain services.`;
								console.error(errMsg);
								break;
							case 'CONNECTION_REFUSED':
								errMsg = errPrefix + `NeoLine error reported: The NEO RPC endpoint refused to connect.`;
								console.error(errMsg);
								break;
							case 'RPC_ERROR':
								errMsg = errPrefix + `NeoLine error reported: Unable to broadcast the transaction to the NEO blockchain network.`;
								console.error(errMsg);
								break;
							default:
								errMsg = errPrefix + `Unknown or invalid error type reported by the NeoLine extension.`;
								console.error(errMsg);
								console.info(errPrefix + `err object:`);
								console.dir(err, {depth: null, colors: true});
								break;
						}
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
	 * This promise resolves to a list of DAO details objects
	 *  via a call to the Neodao listDaos() methods.
	 */
	this.listDaos = function() {
		const methodName = self.constructor.name + '::' + `listDaos`; //
		const errPrefix = '(' + methodName + ') ';

		const aryArgs = [];
		// aryArgs.push(self.buildInvokeParamStringObject('listAllDaos')); // listAllDaos == listAllDaos
		aryArgs.push(self.buildInvokeParamStringObject('ListAllDaos')); // listAllDaos == listAllDaos
		aryArgs.push(self.buildInvokeParamIntegerObject(987)); // listAllDaos == listAllDaos

		return self.invokeFunctionViaNeoLine_promise(0, aryArgs);
	}

	/**
	 * Template for creating a full-fledged promise.
	 *
	 * @return {Promise<any>}
	 */
	function listDaos_promise() {
		let errPrefix = '(listDaos_promise) ';

		return new Promise(function(resolve, reject) {
			try	{


				dummyPromise()
				.then(result => {
					// THEN BLOCK BODY.
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


	/**
	 * This promise sends a transaction directly to the smart contract
	 *  in "read-only" mode.
	 *
	 * @param {Number} amountNeoGas - the amount of NEO GAS to send with the
	 * 	transaction, NOT upsized to BigInteger format.
	 * @param {Array} aryParameterArgs - The array of arguments to poss along with the
	 * 	send transaction or invoke call. These arguments end up in the "data[]" parameter
	 * 	in the target smart contract method.
	 * 	It may be empty, but it must be an array.
	 * @param {Number} transactionFee - The amount of NEO GAS to pay as the
	 * 	desired transaction fee (i.e. - processing fee).  Higher amounts
	 * 	result in higher priority for submitted transactions.
	 *
	 * @return {Promise<Boolean>} - The promise resolves to a simple boolean
	 * 	TRUE if the submission of the transaction succeeds, FALSE if the
	 * 	user cancels the purchase operation, or it rejects if there
	 * 	is an error.
	 *
	 * NOTE: The RPC servers return the response to an invokeRead() call
	 *  immediately.
	 */
	this.invokeFunctionViaNeoLine_promise = function(amountNeoGas, aryParameterArgs, transactionFee=DEFAULT_NEO_TRANSACTION_FEE) {
		const methodName = self.constructor.name + '::' + `makePaymentViaNeoLine_promise`;
		const errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (!g_NeoLineHelper.instance.isNeoLineReady)
					throw new Error(errPrefix + `The NeoLine Chrome extension is not ready yet.`);

				if (typeof amountNeoGas !== 'number')
					throw new Error(errPrefix + `The value in the amountNeoGas parameter is not a number.`);
				if (amountNeoGas < 0)
					throw new Error(errPrefix + `The value in the amountNeoGas parameter is negative.`);
				if (!
						(aryParameterArgs == null || Array.isArray(aryParameterArgs))
					)
					throw new Error(errPrefix + `The aryArgs parameter value is not NULL, yet it is not an array either.`);

				// We must have at least one element in the args paramter array.
				//  We are keeping the convention of using the first slot for the
				//  method name, so we have uniform args parameter handling between
				//  "invoke" and "invokeRead" operations.
				if (aryParameterArgs.length < 1)
					throw new Error(`${errPrefix}The args parameter array is empty.  There must be at least one element for the target method name.`);

				const strOperationName = aryParameterArgs[0];

				if (misc_shared_lib.isEmptySafeString(strOperationName))
					throw new Error(`${errPrefix}The target method name is empty.`);

				// TODO: When we are also on the MainNeet this code MUST be updated
				//  to provide the correct script hash.
				//
				// Lookup the Neodao contract script hash on TestNet.
				const neoDaoScriptHash = lookUpScriptHashOrDie('NEODAO_TESTNET');
				const gasTokenScriptHash = lookUpScriptHashOrDie('GAS');
				const neoTokenScriptHash = lookUpScriptHashOrDie('NEO');

				// TODO: Should we put a NULL/UNDEFINED object check here?
				const neo3Obj = new window.NEOLineN3.Init();

				let theLabelOfPickedAddress = null;
				let thePickedaddress = null;
				let thePickedAddressAsScriptHash = null;

				// >>>>> STEP: Have the user choose the public address they wish to use
				//  for making a payment.
				let operationStep = 'allowing user to select the desired public address';
				console.info(errPrefix + `Executing step: ${operationStep}.`);

				neo3Obj.pickAddress()
					.then(result => {
						if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
							throw new Error(errPrefix + `The result of the NeoLine pickAddress() call is not a valid object.`);

						if (misc_shared_lib.isEmptySafeString(result.address))
							throw new Error(errPrefix + `The object that is the result of the NeoLine pickAddress() call has an invalid "address" field.`);

						if (misc_shared_lib.isEmptySafeString(result.label))
							throw new Error(errPrefix + `The object that is the result of the NeoLine pickAddress() call has an invalid "label" field.`);

						thePickedaddress = result.address;
						theLabelOfPickedAddress = result.label;

						// >>>>> STEP: Convert the picked address to a script hash.
						operationStep = `Converting picked address(${thePickedaddress}) to a script hash`;
						console.info(errPrefix + `Executing step: ${operationStep}.`);

						return neo3Obj.AddressToScriptHash({address: thePickedaddress});
					})
					.then(result => {
						// The result should be an object with a single field named "scriptHash".
						if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
							throw new Error(errPrefix + `The result of the AddressToScriptHash() call is not a valid object.`);
						thePickedAddressAsScriptHash = result.scriptHash;

						if (misc_shared_lib.isEmptySafeString(thePickedAddressAsScriptHash))
							throw new Error(errPrefix + `The result of the AddressToScriptHash() call is not a valid string.`);

						// Put the value where others can find it.
						g_LastPickedAddressAsScriptHash = thePickedAddressAsScriptHash;

						// Perform any needed substitutions.
						self.performSubstitutionsOnInvokeParamArgs(aryParameterArgs);

						// >>>>> STEP: Ask NeoLine to execute the desired method call on the
						//  target smart contract..
						operationStep = `Invoking transaction with script hash: ${thePickedAddressAsScriptHash}`;
						console.info(errPrefix + `Executing step: ${operationStep}.`);

						if (true) {
							console.info(errPrefix + `aryParameterArgs object:`);
							console.dir(aryParameterArgs, {depth: null, colors: true});
						}

						console.warn('thePickedAddressAsScriptHash', thePickedAddressAsScriptHash);

						return neo3Obj.invokeRead({
							scriptHash: neoDaoScriptHash,
							operation: strOperationName,
							args: aryParameterArgs,
							/*
							args: [
								{
									// From - the user sending the transaction
									"type": "Address",
									"value" : thePickedaddress
								},
								{
									// To - the smart contract that should receive the payment.
									"type": "Hash160",
									"value": neoDaoScriptHash
								},
								{
									// Amount - the amount to send with the transaction
									"type": "Integer",
									"value": amountNeoGas.toString()
								},
								{
									// data[] object that the target method will receive.
									"type": "Array",
									"value": aryParameterArgs
								},
							],

							 */
							fee: transactionFee.toString(),
							broadcastOverride: false,
							signers: [
								{
									account: thePickedAddressAsScriptHash,
									scopes: 1
								}
							],
						});
					})
					.then(result => {
						console.log('Read invocation result: ' + JSON.stringify(result));

					})
					.catch(err => {
						console.info(errPrefix + `In error handling block.  Analyzing.`);
						let errMsg = `(No error message set).`;

						// If the user cancels a NeoLine request, the NeoLine extension
						//  throws an error of type "CANCELED" (one "L").
						const {type, description, data} = err;
						switch(type) {
							case 'CANCELED':
								console.warn(errPrefix + `The user cancelled the NeoLine request during operation step: ${operationStep}.`);
								alert(`Transaction cancelled.`);
								// Resolve the promise with FALSE.
								resolve(false);
								break;
							case 'NO_PROVIDER':
								errMsg = errPrefix + `NeoLine error reported: Unable to determine a provider for NEO blockchain services.`;
								console.error(errMsg);
								break;
							case 'CONNECTION_REFUSED':
								errMsg = errPrefix + `NeoLine error reported: The NEO RPC endpoint refused to connect.`;
								console.error(errMsg);
								break;
							case 'RPC_ERROR':
								errMsg = errPrefix + `NeoLine error reported: Unable to broadcast the transaction to the NEO blockchain network.`;
								console.error(errMsg);
								break;
							default:
								errMsg = errPrefix + `Unknown or invalid error type reported by the NeoLine extension.`;
								console.error(errMsg);
								console.info(errPrefix + `err object:`);
								console.dir(err, {depth: null, colors: true});
								break;
						}
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
	 * Using the option contract purchase details found in the given
	 * 	newContraxDetailsBagObj parameter, make an option contract
	 * 	purchase.
	 *
	 * @param {NewContraxDetailsBag} newContraxDetailsBagObj - The object
	 * 	that contains the information needed to make an option contract
	 * 	purchase
	 * @param {Number} gasPrice - The current price for NEO GAS
	 * 	tokens.
	 * @param {String} gasPriceDenominatedIn - The currency the
	 * 	current gas price is denominated in.
	 *
	 * @return {Promise<Boolean>} - If the *submission* of the option
	 * 	contract purchase to the blockchain succeeds, then this
	 * 	promise will resolve to the result of the underlying
	 * 	makePaymentViaNeoLine_promise() call.  If the user cancelled the
	 * 	purchase from within the NeoLine Chrome extension interface,
	 * 	then the promise will resolve to FALSE.  If an error occurs,
	 * 	the promise will reject.
	 */
	this.buyOption_promise = function(newContraxDetailsBagObj,  gasPrice, gasPriceDenominatedIn) {
		let methodName = self.constructor.name + '::' + `buyOption_promise`;
		let errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (!(newContraxDetailsBagObj instanceof NewContraxDetailsBag))
					throw new Error(errPrefix + `The value in the newContraxDetailsBagObj parameter is not a NewContraxDetailsBag object.`);

				if (typeof gasPrice !== 'number')
					throw new Error(errPrefix + `The value in the gasPrice parameter is not a number.`);
				if (gasPrice <= 0)
					throw new Error(errPrefix + `The NEO GAS token price is less than or equal to zero.`);

				if (misc_shared_lib.isEmptySafeString(gasPriceDenominatedIn))
					throw new Error(errPrefix + `The gasPriceDenominatedIn parameter is empty.`);

				// Convert a float value, denominated in the target currency specified in the
				//  newOfferDetailsBagObj object, to a BigInteger value denominated in
				//  the relevant smart contract native currency, and return it in
				//  string format.
				function convertFloatToBigIntSccStr(thePrice) {
					let errPrefix = `(${methodName}::convertFloatToBigIntSccStr) `;

					if (typeof thePrice !== 'number')
						throw new Error(errPrefix + `The value in the thePrice parameter is not a number.`);
					const retVal =
						convertFloatToSccCurrency(
							thePrice,
							newContraxDetailsBagObj.preferredTargetCurrency,
							ASSET_SYMBOL_NEO_GAS,
							gasPrice,
							gasPriceDenominatedIn,
							// Upsize to BigInteger format.
							true);

					return retVal.toString();
				}

				// >>>>> STEP: Get the current price of GAS tokens in the ALTERNATE currency.
				fetchSelectedAssetPrice_promise(
					ASSET_SYMBOL_SMART_CONTRACT_CURRENCY,
					g_AlternateTargetCurrency)
					.then(result => {
						if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
							throw new Error(errPrefix + `The result of the fetchSelectedAssetPrice_promise() is not a valid object.  Context: following then-block.`);

						// Save it where others can find it too.
						if (typeof result['assetPrice'] === 'undefined')
							throw new Error(errPrefix + `The result of the fetchSelectedAssetPrice_promise() call is missing the asset price field.`);

						g_CurrentGasTokenPrice_alternate = result.assetPrice;

						// Validate the price. validatePrice() will throw an error
						//  if the price isn't valid.
						validatePrice(g_CurrentGasTokenPrice_alternate);

						// The amount we submit to the NeoLine extensions must be in
						//   NEO GAS tokens in BigInteger format.
						const amountNeoGas =
							convertFloatToSccCurrency(
								newContraxDetailsBagObj.srcOfferDetailsExt.premiumPerAsset * newContraxDetailsBagObj.numAssetsDesired,
								newContraxDetailsBagObj.preferredTargetCurrency,
								ASSET_SYMBOL_NEO_GAS,
								gasPrice,
								gasPriceDenominatedIn,
								// Upsize to BigInteger format
								true);

						// Create the arguments array needed to tell the Neodao smart
						//  contract to execute an option contract purchase.  These
						//	arguments will be passed on by the GasToken contract when
						//	it calls the Neodao onNEP17Payment() method.
						const aryArgs =
							[
								{
									// Specify the method to be called when our smart contract
									//    onNEP17Transfer() method is called by the gas contract.
									type: "String",
									value: "buyOption"
								},
								{
									// Offer ID.
									type: "String",
									value: newContraxDetailsBagObj.srcOfferDetailsExt.idOfOffer.toString()
								},
								{
									// Number of assets to buy.
									type: "Integer",
									value: newContraxDetailsBagObj.numAssetsDesired.toString(),
								},
								{
									// Current asset price in the smart contract native currency.
									type: "Integer",
									value: convertFloatToBigIntSccStr(newContraxDetailsBagObj.srcOfferDetailsExt.premiumPerAsset),
								},
								{
									// Current price of gas in the alternate target currency.
									type: "Integer",
									value: convertFloatToBigIntSccStr(g_CurrentGasTokenPrice_alternate),
								},
							];

						// Pass the call on to our payment method.
						return self.makePaymentViaNeoLine_promise(amountNeoGas, aryArgs);
					})
					.then(result => {
						// The result should just be TRUE.
						if (result !== true)
							throw new Error(errPrefix + `The result of the makePaymentViaNeoLine_promise() call is not TRUE.`);

						// Just resolve the promise with the result of the makePaymentViaNeoLine_promise() call.
						resolve(result);
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
					errPrefix + conformErrorObjectMsg(err);

				reject(errMsg + ' - try/catch');
			}
		});
	}

	/**
	 * Using the create offer details found in the given
	 * 	newOfferDetailsBagObj parameter, make an option contract
	 * 	purchase.
	 *
	 * @param {NewOfferDetailsBag} newOfferDetailsBagObj - The object
	 * 	that contains the information needed to make an option contract
	 * 	purchase
	 * @param {Number} gasPrice - The current price for NEO GAS
	 * 	tokens.
	 * @param {String} gasPriceDenominatedIn - The currency the
	 * 	gas price is denominated in.
	 *
	 * @return {Promise<Boolean>} - If the *submission* of the offer
	 * 	creation to the blockchain succeeds, then this
	 * 	promise will resolve to TRUE.  If the user cancelled the
	 * 	offer from within the NeoLine Chrome extension interface,
	 * 	then the promise will resolve to FALSE.  If an error occurs,
	 * 	the promise will reject.
	 */
	this.createOffer_promise = function(newOfferDetailsBagObj, gasPrice, gasPriceDenominatedIn) {
		let methodName = self.constructor.name + '::' + `createOffer_promise`;
		let errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (!(newOfferDetailsBagObj instanceof NewOfferDetailsBag))
					throw new Error(errPrefix + `The value in the newOfferDetailsBagObj parameter is not a NewOfferDetailsBag object.`);

				if (typeof gasPrice !== 'number')
					throw new Error(errPrefix + `The value in the gasPrice parameter is not a number.`);
				if (gasPrice <= 0)
					throw new Error(errPrefix + `The NEO GAS token price is less than or equal to zero.`);

				if (misc_shared_lib.isEmptySafeString(gasPriceDenominatedIn))
					throw new Error(errPrefix + `The gasPriceDenominatedIn parameter is empty.`);

				// Convert a float, denominated in the target currency specified in the
				//  newOfferDetailsBagObj object, to a BigInteger value denominated in
				//  the relevant smart contract native currency, and return it in
				//  string format.
				function convertFloatToBigIntSccStr(thePrice) {
					let errPrefix = `(${methodName}::convertFloatToBigIntSccStr) `;

					if (typeof thePrice !== 'number')
						throw new Error(errPrefix + `The value in the thePrice parameter is not a number.`);

					const retVal =
						convertFloatToSccCurrency(
							thePrice,
							newOfferDetailsBagObj.preferredTargetCurrency,
							ASSET_SYMBOL_NEO_GAS,
							gasPrice,
							gasPriceDenominatedIn,
							// Upsize to BigInteger format.
							true);

					return retVal.toString();
				}

				// Calculate the total amount the seller is at risk
				//  if all their inventory is sold from this offer.
				const totalAtRiskAmount =
					newOfferDetailsBagObj.srcAlpacaFormDataObj.maxPayoutPerAsset
					* newOfferDetailsBagObj.srcAlpacaFormDataObj.numAssets;

				// The seller must pay their at-risk amount to the smart contract
				// 	to be held in escrow to cover any options written
				//  from the offer.	The amount we submit to the NeoLine extensions must
				//  be in NEO GAS tokens but NOT in BigInteger format.
				const amountNeoGas =
					convertFloatToSccCurrency(
						totalAtRiskAmount,
						newOfferDetailsBagObj.preferredTargetCurrency,
						ASSET_SYMBOL_NEO_GAS,
						gasPrice,
						gasPriceDenominatedIn,
						// Upsize to BigInteger format.
						true);

				if (amountNeoGas <= 0)
					throw new Error(errPrefix + `The NEO GAS amount for the total at-risk payment is less than or equal to zero.`);

				const strMethodName = "createOffer";
				const strDaoOwnerAddress = SUBST_LABEL_USER_ADDRESS;


				const strAssetSymbol = newOfferDetailsBagObj.srcAlpacaFormDataObj.assetSymbol;
				const strAssetType = newOfferDetailsBagObj.srcAlpacaFormDataObj.assetType;
				const strExpirationDateTimeDelta = newOfferDetailsBagObj.srcAlpacaFormDataObj.expirationDateTimeDelta.toString();
				const strMaxPayoutPerAsset = convertFloatToBigIntSccStr(newOfferDetailsBagObj.srcAlpacaFormDataObj.maxPayoutPerAsset);
				const strNumAssetsToOffer = newOfferDetailsBagObj.srcAlpacaFormDataObj.numAssets.toString();
				const strOfferType = newOfferDetailsBagObj.srcAlpacaFormDataObj.offerType;
				const strPremiumPerAsset = convertFloatToBigIntSccStr(newOfferDetailsBagObj.srcAlpacaFormDataObj.premiumPerAsset);
				const strStrikePrice = convertFloatToBigIntSccStr(newOfferDetailsBagObj.srcAlpacaFormDataObj.strikePrice);
				const strStrikePriceDelta = convertFloatToBigIntSccStr(newOfferDetailsBagObj.srcAlpacaFormDataObj.strikePriceDelta);

				// Create the arguments array needed to tell the Neodao smart
				//  contract to execute a create offer transaction.  These
				//	arguments will be passed on by the GasToken contract when
				//	it calls the Neodao onNEP17Payment() method.
				const aryArgs =
					[
						{
							// Specify the method to be called when our smart contract
							//    onNEP17Transfer() method is called by the gas contract.
							type: "String",
							value: strMethodName
						},
						{
							// Asset Symbol.
							type: "String",
							value: strAssetSymbol
						},
						{
							// User's N3 address.
							type: "String",
							value: strDaoOwnerAddress
						},
						{
							// Expiration Date/Time Delta.
							type: "Integer",
							value: strExpirationDateTimeDelta
						},
						{
							// Maximum Payout Per Asset.
							type: "Integer",
							value: strMaxPayoutPerAsset,
						},
						{
							// Number of assets to offer.
							type: "Integer",
							value: strNumAssetsToOffer,
						},
						{
							// Offer Type.
							type: "String",
							value: strOfferType
						},
						{
							// Premium Per Asset.
							type: "Integer",
							value: strPremiumPerAsset
						},
						{
							// Strike Price.
							type: "Integer",
							value: strStrikePrice,
						},
						{
							// Strike Price Delta.
							type: "Integer",
							value: strStrikePriceDelta,
						},
					];

				// Pass the call on to our payment method.
				return self.makePaymentViaNeoLine_promise(amountNeoGas, aryArgs);
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
	 * Using the create DAO details found in the given
	 * 	newOfferDetailsBagObj parameter, create a
	 * 	new DAO using the NeoDao smart contract.
	 *
	 * @param {object} srcAlpacaFormDataObj - A valid Alpaca forms object.
	 *
	 * @return {Promise<Boolean>} - If the operation to create
	 *  a new DAO succeeds, then this promise will resolve to TRUE.
	 *  If the user cancelled the operation from within the NeoLine
	 *  Chrome extension interface, then the promise will resolve
	 *  to FALSE.  If an error occurs, then the promise will reject.
	 */
	this.createDao_promise = function(srcAlpacaFormDataObj, preferredTargetCurrency) {
		let methodName = self.constructor.name + '::' + `createOffer_promise`;
		let errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (!misc_shared_lib.isNonNullObjectAndNotArray(srcAlpacaFormDataObj))
					throw new Error(`${errPrefix}The alpacaFormObj is not a valid object.`);

				// ------------------- BUILD INVOKE CALL PARAMETERS -------------

				// Build the parameters for the Neoline invoke call.

				// TODO:  Only accepting NEO and GAS tokens for the Polaris hackathon.
				//  NEO FOR "shares', GAS for "loot".  After the hackathon,
				//  add full, flexible support for multiple tokens. Currently
				//  the the incoming _approvedTokens array is ignored.
				const aryApprovedTokens = [];

				// The token used for deposits is assumed to be in the first slot of the approved tokens array.
				aryApprovedTokens[0] = 'GAS';
				aryApprovedTokens[1] = 'NEO';

				const strDepositTokenSymbol = srcAlpacaFormDataObj.depositTokenSymbol;

				// NOTE: The Neodao smart contract expects the contract hash
				//  for a token, not its symbol.  We must convert the approved
				//  tokens to their script hashes here.
				const aryApprovedTokenHashes = [];

				for (let i = 0; i < aryApprovedTokens.length; i++)
					aryApprovedTokenHashes.push(lookUpScriptHashOrDie(aryApprovedTokens[i]));

				// First token script hash is the deposit token script hash.
				const strDepositTokenScriptHash = aryApprovedTokenHashes[0];


				// The method we want to call on our smart contract (internal
				//  to the smart contract).
				const strMethodName = "createDao";

				// Create a JSON object to hold all the parameters except the
				//  target method name.
				let customDataParamsObj = {};

				customDataParamsObj.array_summoner_addresses = [SUBST_LABEL_USER_ADDRESS];
				customDataParamsObj.approved_token_hashes = aryApprovedTokenHashes;
				customDataParamsObj.deposit_token = strDepositTokenScriptHash;
				customDataParamsObj.dilution_bound = srcAlpacaFormDataObj.dilutionBound;
				customDataParamsObj.display_name = srcAlpacaFormDataObj.displayName;
				customDataParamsObj.grace_period_length = srcAlpacaFormDataObj.gracePeriodLength;
				// Create a GUID that can be used to access the DAO.
				// TODO: The contract assigns the DAO GUID.  This value will be ignored.
				customDataParamsObj.dao_guid = misc_shared_lib.getSimplifiedUuid();
				customDataParamsObj.membership_fee = srcAlpacaFormDataObj.membershipFee;
				customDataParamsObj.minimum_summoner_shares = srcAlpacaFormDataObj.minSummonerShares;
				customDataParamsObj.period_duration = srcAlpacaFormDataObj.periodDuration;
				customDataParamsObj.processing_reward = srcAlpacaFormDataObj.processingReward;
				customDataParamsObj.proposal_deposit = srcAlpacaFormDataObj.proposalDeposit;
				customDataParamsObj.summoning_time = srcAlpacaFormDataObj.summoningTime;

				// TODO: Ignoring the summoner shares feature for now.  After the
				//  hackathon this feature should be fully implemented.  However,
				//  the number of elements in the summoner shares array must
				//  match the count in the summoners array.  Since we are only
				//  using the DAO owner (current user) as the summoner, we
				//  create a single element array for the summoner shares.
				let aryFakeSummonerShares = [];
				aryFakeSummonerShares.push(0);

				customDataParamsObj.array_summoner_shares = aryFakeSummonerShares;

				customDataParamsObj.voting_period_length = srcAlpacaFormDataObj.votingPeriodLength;

				// Serialize the custom data parameters object.
				const strCustomDataParams = JSON.stringify(customDataParamsObj);
				// Make an output suitable for a VSCode/Neo invoke file.
				const strInvokeFileParams =
					`"${strCustomDataParams.replace(/\"/gm, '\\"')}"`;

				console.info('------------------------------------------');
				console.info(`Creating new DAO with parameters (stringified):`);
				console.info(strInvokeFileParams);
				console.info('------------------------------------------');

				// Create the arguments array needed to tell the Neodao smart
				//  contract to execute a create offer transaction.  These
				//	arguments will be passed on by the GasToken contract when
				//	it calls the NeoDao onNEP17Payment() method.
				const aryArgs =
					[
						{
							// Specify the method to be called when our smart contract
							//    onNEP17Transfer() method is called by the gas contract.
							type: "String",
							value: strMethodName
						},
						{
							// (rest of the) custom data parameters, passes as a serialized JSON object.
							type: "String",
							value: strCustomDataParams
						},
					];

				// console.warn(`${errPrefix}Creating DAO with GUID: ${customDataParamsObj.dao_guid}`);
				console.warn(`${errPrefix}Creating new DAO.  Contract will assign an ID to it.}`);

				// Pass the call on to our payment method.
				// return self.makePaymentViaNeoLine_promise(amountNeoGas, aryArgs);

				// TODO: Currently we are not submitting summoner shares as
				//  part of the create DAO call, which might be something
				//  we want to do later if we don't make that a separate step
				//  (for the DAO creator aka the owner address).
				//
				// Therefore, we pass 0 for the amount of GAS with this
				//  invoke call.
				return self.makePaymentViaNeoLine_promise(0, aryArgs);
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
	 * Using the submit proposal details found in the given
	 * 	newOfferDetailsBagObj parameter, submit the proposal
	 *  to the target DAO.
	 *
	 * @param {object} srcAlpacaFormDataObj - A valid Alpaca forms object.
	 *
	 * @return {Promise<Boolean>} - If the operation to submit a new
	 *  a new proposal succeeds, then this promise will resolve to TRUE.
	 *  If the user cancelled the operation from within the NeoLine
	 *  Chrome extension interface, then the promise will resolve
	 *  to FALSE.  If an error occurs, then the promise will reject.
	 */
	this.submitProposal_promise = function(srcAlpacaFormDataObj) {
		let methodName = self.constructor.name + '::' + `submitProposal_promise`;
		let errPrefix = '(' + methodName + ') ';

		return new Promise(function(resolve, reject) {
			try	{
				if (!misc_shared_lib.isNonNullObjectAndNotArray(srcAlpacaFormDataObj))
					throw new Error(`${errPrefix}The alpacaFormObj is not a valid object.`);

				// ------------------- BUILD INVOKE CALL PARAMETERS -------------

				// Build the parameters for the Neoline invoke call.

				// TODO: For the hackathon, we are only allowing NEO and GAS tokens.
				//  After the hackathon, add support for other N3 based tokens.
				//  We are using NEO for shares tokens (voting power) and GAS
				//   for loot tokens (non-voting).
				const gasTokenContractHash = lookUpScriptHashOrDie('NEO');
				const neoTokenContractHash = lookUpScriptHashOrDie('GAS');
				const sharesTokenContractHash = neoTokenContractHash;
				const lootTokenContractHash = gasTokenContractHash;

				// We are using GAS for the tribute and (non-member) payment
				//  tokens for the Polaris hackathon since they have
				//  not voting power in the DAO.
				const tributeTokenContractHash = gasTokenContractHash;
				const paymentTokenContractHash = gasTokenContractHash;

				// The method we want to call on our smart contract (internal
				//  to the smart contract).
				const strMethodName = "submitProposal";

				// Create a JSON object to hold all the parameters except the
				//  target method name.
				let customDataParamsObj = {};

				// Transfer the GUID of the DAO this proposal is being submitted to.
				if (misc_shared_lib.isEmptySafeString(srcAlpacaFormDataObj.daoGuid))
					throw new Error(`${errPrefix}The DAO GUID is missing from the forms object.`);

				// TODO: For the hackathon, the DAO GUIDs are integers, not GUIDs.
				// customDataParamsObj.dao_guid = srcAlpacaFormDataObj.daoGuid;
				customDataParamsObj.dao_guid = typeof g_DaoGuid === 'number' ? g_DaoGuid :  parseInt(g_DaoGuid);

				// Create a GUID that can be used to access the proposal.
				customDataParamsObj.proposal_guid = misc_shared_lib.getSimplifiedUuid();

				// Alpaca will leave out a field if it has no value.  The
				//  "applicant" field is optional, so check for the omission
				//  of that value.
				customDataParamsObj.applicant = typeof srcAlpacaFormDataObj.applicant === 'undefined' ? '' : srcAlpacaFormDataObj.applicant;
				customDataParamsObj.shares_requested = srcAlpacaFormDataObj.sharesRequested;
				customDataParamsObj.loot_requested = srcAlpacaFormDataObj.lootRequested;
				customDataParamsObj.tribute_offered = srcAlpacaFormDataObj.tributeOffered;
				// customDataParamsObj.startingPeriod = srcAlpacaFormDataObj.startingPeriod;
				customDataParamsObj.tribute_token = tributeTokenContractHash;
				customDataParamsObj.payment_requested = srcAlpacaFormDataObj.paymentRequested;
				customDataParamsObj.payment_token = gasTokenContractHash;
				customDataParamsObj.details = srcAlpacaFormDataObj.details;

				// const aryNeoFsObjs = [];
				// customDataParamsObj.array_Json_string_neofs = JSON.stringify(aryNeoFsObjs);

				// TODO: Need to add the NeoFS URLs found in the
				//  submit proposal page's NeoFsFileBox control.
				 customDataParamsObj.neofs_compound_id_pairs = srcAlpacaFormDataObj.neofsCompoundIdPairs;

				// Serialize the custom data parameters object.
				const strCustomDataParams = JSON.stringify(customDataParamsObj);
				// Make an output suitable for a VSCode/Neo invoke file.
				const strInvokeFileParams =
					`"${strCustomDataParams.replace(/\"/gm, '\\"')}"`;

				console.info('------------------------------------------');
				console.info(`Submitting new proposal with parameters (stringified):`);
				// console.info(strInvokeFileParams);
				console.info(strCustomDataParams);
				console.info('------------------------------------------');

				// Create the arguments array needed to tell the Neodao smart
				//  contract to execute a create offer transaction.  These
				//	arguments will be passed on by the GasToken contract when
				//	it calls the NeoDao onNEP17Payment() method.
				const aryArgs =
					[
						{
							// Specify the method to be called when our smart contract
							//    onNEP17Transfer() method is called by the gas contract.
							type: "String",
							value: strMethodName
						},
						{
							// (rest of the) custom data paramters, passes as a serialized JSON object.
							type: "String",
							value: strCustomDataParams
						},
					];

				// Pass the call on to our payment method.
				// return self.makePaymentViaNeoLine_promise(amountNeoGas, aryArgs);

				// TODO: Currently we are not submitting summoner shares as
				//  part of the create DAO call, which might be something
				//  we want to do later if we don't make that a separate step
				//  (for the DAO creator aka the owner address).
				//
				// Therefore, we pass 0 for the amount of GAS with this
				//  invoke call.
				return self.makePaymentViaNeoLine_promise(0, aryArgs);
			}
			catch(err) {
				// Convert the error to a promise rejection.
				let errMsg =
					errPrefix + conformErrorObjectMsg(err);

				reject(errMsg + ' - try/catch');
			}
		});
	}

}

/**
 * Singleton pattern.
 */
const g_NeoLineHelper = new function ()
{
	const self = this;

	this.instance = new NeoLineHelper();
}();

