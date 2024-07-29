// This file contains code to interface with our smart contracts via the NEO
//	RPC protocol.

const {v4: uuidV4} = require('uuid');
const common_routines = require('../common/common_routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');
const {ContraxDetailsExt} = require("../data/contrax-details");
const {CryptocurrencyPriceDetails} = require("../common/cryptocurency-price-details");
const {getArrayOfCryptocurrencyPrices_promise} = require("../services/cryptocompare");

const {rpc, sc} = require("@cityofzion/neon-js")
const {CommonNeonJS, NeoRpcParameter} = require('../common/common-neon-js');
const {OfferDetails, OfferDetailsExt} = require('../data/offer-details');
const {ContraxDetails} = require('../data/contrax-details');
const {ASSET_SYMBOL_SMART_CONTRACT_CURRENCY} = require('../public/javascripts/misc/price-shared-lib');

// const scriptHash_gastoken = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
// const scriptHash_neodao = "0x0b7fbfe7e434497dfe9bdbba537005bb15daf22d";


// Get the URL to use for the desired RPC node from the environment.
// TODO: For remote RPC nodes, add failover ability using a list of
//	available RPC nodes.

const urlRpcNode = common_routines.getEnvironmentVarOrError("URL_NEO_RPC_NODE");

// Set this variable to TRUE for verbose logging.
const g_VerboseLogging = true;

/**
 * This object contains methods for interfacing with a smart
 * 	contract over the NEO RPC bridge/API, via NeonJS.
 *
 * @param {String} scriptHash - The contract address of the smart contract to
 * 	interface with.
 * @param {String} useRpcUrl - The URL of the RPC node to interact with.
 *
 * @constructor
 */
function NeoRpcBridge(scriptHash, useRpcUrl) {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	if (misc_shared_lib.isEmptySafeString(scriptHash))
		throw new Error(errPrefix + `The scriptHash parameter is empty.`);
	
	if (misc_shared_lib.isEmptySafeString(useRpcUrl))
		throw new Error(errPrefix + `The useRpcUrl parameter is empty.`);
	
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {String} - The contract address of the smart contract to
 	 * 		interface with. */
	this.scriptHash = scriptHash;
	
	/** @property {String} - Create an RPC client for our use.  */
	this.rpcClient = new rpc.RPCClient(useRpcUrl);
	
	/**
	 * Given a method name and an array of parameters to be passed to
	 * 	that method, call that method using the NEO RPC bridge.
	 *
	 * @param {String} theMethodName - The name of the desired smart
	 * 	contract method.
	 * @param {Array<NeoRpcParameter>} aryParams - An array of NeoRpcParameter
	 *  objects that contains the parameters for the method call.
	 *
	 * @return {Object} - Returns the object returned by the RPC bridge call
	 * 	or NULL if there was an error.
	 */
	this.invokeFunction = async function(theMethodName, aryParams) {
		let methodName = self.constructor.name + '::' + `invokeFunction`;
		let errPrefix = '(' + methodName + ') ';
		
		if (misc_shared_lib.isEmptySafeString(theMethodName))
			throw new Error(errPrefix + `The theMethodName parameter is empty.`);
			
		// Disabled, since we now allow the inclusion of CityOfZion
		//  parameter types.
		// NeoRpcParameter.validateParamArray(aryParams);

		let bIsError = false;
		
		if (g_VerboseLogging) {
			console.log(errPrefix + `Making NEO RPC bridge call using the following parameters:`);
			console.log(`script hash: ${self.scriptHash}`);
			console.log(`method name: ${theMethodName}`);
			console.log(JSON.stringify(aryParams, undefined, 2));
		}
		
		const result = await self.rpcClient.invokeFunction(self.scriptHash, theMethodName, aryParams)
			.catch(err => {
				console.error(err.message);
				
				bIsError = true;
			});
			
		if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
			throw new Error(errPrefix + `The result of the invokeFunction() function call is not a valid object.  Did the smart contract script hash change due to a new deployment?  If it was a call to our local NEO Express instance, is it running?  If it was a TestNet or MainNet call, the remote RPC node may actually be down.`);

		if (bIsError) {
			// An error occurred.  Return NULL to let the caller know.
			return null;
		}
		
		// Return the result.
		return result;
	}
}

/**
 * This object contains methods for interfacing specifically with the Neodao smart
 * 	contract over the NEO RPC bridge/API, via NeonJS.
 */
function NeodaoBridge() {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';
	
	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = uuidV4();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/** @property {NeoRpcBridge} - Create a NeoRpcBridge object for our use.
	* 		Get the NEODAO contract script hash and the RPC NODE URL from
	* 		the environment. */
	this.neoRpcBridge =
		new NeoRpcBridge(
			common_routines.getEnvironmentVarOrError("SCRIPT_HASH_NEODAO"),
			common_routines.getEnvironmentVarOrError("URL_NEO_RPC_NODE"));
	
	/**
	 * This function calls the method that lists the available OFFERs in the
	 * 	the Neodao smart contract.
	 *
	 * @param {Object} req - A valid Express request object.
	 * @param {Object} res - A valid Express result object.
	 * @param {String} theAssetType - The asset type to use when
	 * 	selecting OFFERs from the collection of available offers.
	 * @param {String} theAssetSymbol - The asset symbol to use when
	 * 	selecting OFFERs from the collection of available offers.
	 * @param {String} theOfferType - The type of OFFER to use
	 *  when selecting OFFERs from the collection of available offers.
	 *
	 * @return {Promise<Array<OfferDetailsExt>>|null} - If successful an array
	 * 	of OfferDetailsExt objects is returned.  Otherwise NULL is returned.
	 */
	this.listAvailableOffers = async function(req, res, theAssetType, theAssetSymbol, theOfferType) {
		let methodName = self.constructor.name + '::' + `listAvailableOffers`;
		let errPrefix = '(' + methodName + ') ';

		if (!misc_shared_lib.isNonNullObjectAndNotArray(req))
			throw new Error(errPrefix + `The Express request parameter does not contain a valid object.`);
		if (!misc_shared_lib.isNonNullObjectAndNotArray(res))
			throw new Error(errPrefix + `The Express result parameter does not contain a valid object.`);
		
		if (misc_shared_lib.isEmptySafeString(theAssetType))
			throw new Error(errPrefix + `The theAssetType parameter is empty.`);
		if (misc_shared_lib.isEmptySafeString(theAssetSymbol))
			throw new Error(errPrefix + `The theAssetSymbol parameter is empty.`);
		if (misc_shared_lib.isEmptySafeString(theOfferType))
			throw new Error(errPrefix + `The theOfferType parameter is empty.`);
		
		/*
		const aryParams = [
			CommonNeonJS.buildScParam_string(theAssetType),
			CommonNeonJS.buildScParam_string(theAssetSymbol)
		];
		*/
		
		// const contractParam = sc.ContractParam.hash160(participantId);
		const aryParams = [
			sc.ContractParam.string(theAssetType),
			sc.ContractParam.string(theAssetSymbol)
		];
		
		let bIsError = false;
		
		// Make the RPC call.
		const result =
			await self.neoRpcBridge.invokeFunction("listAvailableOffers", aryParams)
			.catch(err => {
				console.error(err.message);
				
				bIsError = true;
			});
			
		if (!misc_shared_lib.isNonNullObjectAndNotArray(result))
			throw new Error(errPrefix + `The result of the invokeFunction("listAvailableOffers") call is not a valid object.`);

		if (bIsError) {
			// An error occurred.  Return NULL to let the caller know.
			return null;
		}

		if (g_VerboseLogging) {
			console.info(errPrefix + `result object:`);
			console.dir(result, {depth: null, colors: true});
		}
		
		// Convert the results to an array of OfferDetails object.
		const aryMapContents = CommonNeonJS.extractMapContentsFromRpcResult(result);
		
		let aryOfferDetailsObjs = [];
		let aryOfferDetailsExtObjs = [];
		let uniqueAssetSymbols = {};
		
		if (aryMapContents.length > 0) {
			// Convert the Map of OFFERs returned in encoded format in the result object
			//  to an array of OfferDetails objects.  Build a list of all the unique asset
			//  symbols we find as we go.
		
			for (let ndx = 0; ndx < aryMapContents.length; ndx++) {
				const encodedObj = aryMapContents[ndx];
				const newOfferDetailsObj = OfferDetails.createFromRawResultObj(encodedObj);
				
				if (typeof uniqueAssetSymbols[newOfferDetailsObj.assetSymbol] === 'undefined')
					uniqueAssetSymbols[newOfferDetailsObj.assetSymbol] = 1;
				else
					uniqueAssetSymbols[newOfferDetailsObj.assetSymbol]++;
				
				aryOfferDetailsObjs.push(newOfferDetailsObj);
			}
			
			// Build an array of the unique asset symbols found.
			let aryUniqueSymbols = [];
			
			for (let symbol in uniqueAssetSymbols)
				aryUniqueSymbols.push(symbol);
				
			if (aryUniqueSymbols.length < 1)
				throw new Error(errPrefix + `The resulting array of unique symbols is empty.`);
		
			// We need the current price for NEO GAS, since all payments and payouts
			//  use its value for calculations, and the price of each unique asset
			//	symbol found in the array of OfferDetails objects.
			let bIsError = false;
			let errMsg = '(none)';
			
			// Get the price detail objects for the cryptocurrency symbols
			//  found in the list of offers.  The prices should be
			//  denominated in the smart contract native currency.
			const aryCryptocurrencyPriceDetailsObjs =
				await getArrayOfCryptocurrencyPrices_promise(req, res, aryUniqueSymbols, ASSET_SYMBOL_SMART_CONTRACT_CURRENCY)
				.catch(err => {
					// Show the error.
					let errMsg =
						errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
					errMsg += ' - promise';
					
					console.error(errMsg + ' - try/catch, promise');
					
					bIsError = true;
				});
			
			if (bIsError)
				throw new Error(errPrefix + `An error occurred during the call to getArrayOfCryptocurrencyPrices_promise: ${errMsg}.`);
				
			// Now augment the array of source offer details to an array of extended objects
			//	by embedding each one of them into an OfferDetailsExt object.
			//	The OfferDetailsExt has fields and code to facilitate displaying the
			//	offer details in a way that is suitable for display.
			
			// Convert the aryCryptocurrencyPriceDetailsObjs array to an associative array
			//  for easy lookups.
			const priceDetailsLookupTable = CryptocurrencyPriceDetails.arrayToPriceLookupTable(aryCryptocurrencyPriceDetailsObjs);
			
			for (let ndx = 0; ndx < aryOfferDetailsObjs.length; ndx++) {
				const srcOfferDetails = aryOfferDetailsObjs[ndx];
				
				if (!(srcOfferDetails instanceof OfferDetails))
					throw new Error(errPrefix + `The value in the srcOfferDetails parameter is not a OfferDetails object.`);
				
				// ------------- FILTER -------------
				
				// Filter the results by the desired offer type (e.g. - "PUT" or "CALL").
				if (srcOfferDetails.offerType === theOfferType) {
					let newOfferDetailsExtObj =
						new OfferDetailsExt(
								srcOfferDetails,
								priceDetailsLookupTable[srcOfferDetails.assetSymbol]);
								
					aryOfferDetailsExtObjs.push(newOfferDetailsExtObj);
				}
			}
		}
		
		return aryOfferDetailsExtObjs;
	}
		
	/**
	 * List all the CONTRAXs that a particular user bought or sold
     *  that meet the filter criteria implied by the "mode"
     *  parameter.
	 * @param {String} participantId - The public address of the
	 * 	participant.
	 * @param {String} mode - There are currently three filter modes
     *      applied to the option contraxs search beyond that
     *      of the primary requirement that the participant
     *      ID matches either the option contrax buyer or
     *      seller ID:
     * 
     *      - open: Option contracts that have not expired yet.
     *      - expired_unpaid: Option contracts that HAVE expired
     *          but only those where the participant has NOT been
     *          paid yet
     *      - expired_paid: Option contracts that HAVE expired
     *          but only those where the participant HAS been
     *          paid yet
	 *
	 * @return {Promise<Array<Object>>|null} - If successful an array
	 * 	of extended contrax details objects is returned.  Otherwise NULL
	 * 	is returned.
	 */
	this.listContraxByParticipantId = async function(participantId, mode) {
		let methodName = self.constructor.name + '::' + `listContraxByParticipantId`;
		let errPrefix = '(' + methodName + ') ';
		
		if (misc_shared_lib.isEmptySafeString(participantId))
			throw new Error(errPrefix + `The participantId parameter is empty.`);
		
		if (misc_shared_lib.isEmptySafeString(mode))
			throw new Error(errPrefix + `The mode parameter is empty.`);
			
		if (mode !== 'open' && mode !== 'expired_paid' && mode !== 'expired_unpaid')
			throw new Error(errPrefix + `Invalid mode parameter value: ${mode}.`);
			
		const participantId_hash160 = sc.ContractParam.hash160(participantId);
		const strMode = sc.ContractParam.string(mode);
		
		const aryParams = [
			// CommonNeonJS.buildScParam_string(participantId)
			participantId_hash160,
			strMode
		];

		let bIsError = false;
		
		// Make the RPC call.
		const result =
			await self.neoRpcBridge.invokeFunction("listContraxsByParticipantId", aryParams)
			.catch(err => {
				console.error(err.message);
				
				bIsError = true;
			});

		if (bIsError) {
			// An error occurred.  Return NULL to let the caller know.
			return null;
		}

		if (g_VerboseLogging) {
			console.info(errPrefix + `result object:`);
			console.dir(result, {depth: null, colors: true});
		}
		
		// Convert the Map of CONTRAXs returned in encoded format to a the result
		//  to an array of ContraxDetails objects.
		const aryMapContents = CommonNeonJS.extractMapContentsFromRpcResult(result);
		
		let aryContraxDetailsObjs = [];
		let aryContraxDetailsExtObjs = [];
		let uniqueAssetSymbols = {};
		let aryUniqueSymbols = [];
	
		if (aryMapContents.length > 0) {
			// Convert the Map of CONTRAXs returned in encoded format in the result object
			//  to an array of ContraxDetails objects.  Build a list of all the unique asset
			//  symbols we find as we go.
			for (let ndx = 0; ndx < aryMapContents.length; ndx++) {
				const encodedObj = aryMapContents[ndx];
				const newContraxDetailsObj = ContraxDetails.createFromRawResultObj(encodedObj);
				
				if (typeof uniqueAssetSymbols[newContraxDetailsObj.assetSymbol] === 'undefined')
					uniqueAssetSymbols[newContraxDetailsObj.assetSymbol] = 1;
				else
					uniqueAssetSymbols[newContraxDetailsObj.assetSymbol]++;
				
				aryContraxDetailsObjs.push(newContraxDetailsObj);
			}
			
			// Create an array of the unique asset symbols.
			for (let key in uniqueAssetSymbols) {
			    let assetSymbol = uniqueAssetSymbols[key];

				aryUniqueSymbols.push(assetSymbol);
			}
			
			// We need the current price for NEO GAS, since all payments and payouts
			//  use its value for calculations, and the price of each unique asset
			//	symbol found in the array of ContraxDetails objects.
			let bIsError = false;
			let errMsg = '(none)';
			
			// Get the price detail objects for the cryptocurrency symbols
			//  found in the list of contraxs.  The prices should be
			//  denominated in the smart contract native currency.
			const aryCryptocurrencyPriceDetailsObjs =
				await getArrayOfCryptocurrencyPrices_promise(req, res, aryUniqueSymbols, ASSET_SYMBOL_SMART_CONTRACT_CURRENCY)
				.catch(err => {
					// Show the error.
					let errMsg =
						errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
					errMsg += ' - promise';
					
					console.error(errMsg + ' - try/catch, promise');
					
					bIsError = true;
				});
			
			if (bIsError)
				throw new Error(errPrefix + `An error occurred during the call to getArrayOfCryptocurrencyPrices_promise: ${errMsg}.`);
				
			// Now augment the array of source contrax details to an array of extended objects
			//	by embedding each one of them into a ContraxDetailsExt object.
			//	The ContraxDetailsExt has fields and code to facilitate displaying the
			//	contrax details in a way that is human friendly.
			
			// Convert the aryCryptocurrencyPriceDetailsObjs array to an associative array
			//  for easy lookups.
			const priceDetailsLookupTable = CryptocurrencyPriceDetails.arrayToPriceLookupTable(aryCryptocurrencyPriceDetailsObjs);
			
			for (let ndx = 0; ndx < aryContraxDetailsObjs.length; ndx++) {
				const srcContraxDetails = aryContraxDetailsObjs[ndx];
				
				if (!(srcContraxDetails instanceof ContraxDetails))
					throw new Error(errPrefix + `The value in the srcContraxDetails parameter is not a ContraxDetails object.`);
				
				const newContraxDetailsExtObj =
					new ContraxDetailsExt(
						participantId,
						srcContraxDetails,
						priceDetailsLookupTable[srcContraxDetails.assetSymbol]);
				aryContraxDetailsExtObjs.push(newContraxDetailsExtObj);
			}
		}
		
		return aryContraxDetailsObjs;
	}
}

module.exports = {
	NeodaoBridge: NeodaoBridge,
	NeoRpcBridge: NeoRpcBridge
}