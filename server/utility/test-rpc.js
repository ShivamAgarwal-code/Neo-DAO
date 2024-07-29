// This file contains some simple code to run a few basic
//  tests against an RPC node.


// const rpcAddress = "http://seed1t.neo.org:20332";
/*
const rpcAddress = common_routines.getEnvironmentVarOrError("URL_NEO_RPC_NODE");
const scripthash = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
const method = "decimals";
const params = {};
const {rpc} = require("@cityofzion/neon-js")
// const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');
*/

const common_routines = require("../common/common_routines");
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');
const {NeodaoBridge} = require("../rpc/neo-rpc-interface");

const {rpc} = require("@cityofzion/neon-js")
const {CommonNeonJS} = require("../common/common-neon-js");

// const wallet = neonObj.wallet;
// const alternative = new Neon.wallet.Account(g_PrivateKey);

// let bIsAddress = neonObj.is.address(account);
// bIsdAdress = neonObj.is.address(account.address);
// bIsAddress = neonObj.wallet.isAddress(account._address);

const rpcAddress_intranet = common_routines.getEnvironmentVarOrError("URL_NEO_RPC_NODE");
const rpcAddress_test_net = "http://seed1t.neo.org:20332";
const scriptHash_gastoken = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
const scriptHash_neodao = "0x0b7fbfe7e434497dfe9bdbba537005bb15daf22d";

const params = {};

const {OfferDetails} = require('../data/offer-details');

const errPrefix = '(test-rpc.js) ';

// The public address for our "bob" account.
const g_WalletAddressForLocalBlockchain_bob = common_routines.getEnvironmentVariableByName('WALLET_ADDRESS_LOCAL_BLOCKCHAIN_BOB');

const g_PrivateKey = common_routines.getEnvironmentVarOrError('NEO_PRIVATE_KEY');
const neon_lib = require("@cityofzion/neon-js");
const neonObj = neon_lib.default;
const account = neonObj.create.account(g_PrivateKey);

/**
 * Test sending 1 NEO token to the "bob" account.
 *
 * @return {Promise<void>}
 */
async function testPaymentFromServer() {
	let errPrefix = `(testPaymentFromServer) `;
	
	// ---------------- BUILD TRANSACTION --------------
	
	// Let us create a ContractTransaction
	let tx = Neon.create.contractTx();
	
	// TODO: The smart contract execution fees should be
	//  calculated by making a read-only call to the
	//  target smart contract method, instead of being
	//	hard-coded as is here.
	const smartContractFees = 1;
	const networkFees = null;
	const systemFees = 1;
	
	// Now let us add an intention to send 1 NEO to someone
	tx.addIntent("NEO", 1, g_WalletAddressForLocalBlockchain_bob)
		// Add an remark
		.addRemark("I am sending 1 NEO to Bob on the local NEO Blockchain.")
		// Now we add in the balance we retrieve from an external API and calculate the required inputs.
		// FORMAT: Smart contract method execution costs, system fees, network fees.
		.calculate(smartContractFees, networkFees, systemFees)
		.sign(g_PrivateKey); // Sign with the private key of the balance
	
	const hash = tx.hash; // Store the hash so we can use it to query a block explorer.
	
	// Now we can use this serializedTx string and send it through sendrawtransaction RPC call.
	const serializedTx = tx.serialize();
	
	// ---------------- SEND TRANSACTION --------------
	
	// Call our RPC helper class to send the transaction.
	const useRpcUrl = rpcAddress_test_net;
	
	const method = "transfer";
	console.log(`\nCalling "${method}()" using URL(${useRpcUrl})...`);
	
	const rpcClient = new rpc.RPCClient(useRpcUrl);

	// >>>>> How do I send a serialized transaction instead of merely
	//  invoking an RPC method?
	const result = await rpcClient.invokeFunction(scriptHash_gastoken, method) // [])
		.catch(err => {
		    // Convert the error to a promise rejection.
		    // let errMsg = errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
		    // console.error(errMsg + ' - promise');
			console.error(err.message);
			
		    bIsError = true;
		});
	
	console.log(result);
	let bExitCode = bIsError ? 1 :0;
	
	process.exit(1);
}

/*
Use the wallet address for "bob" converted to big endian format
	on the local NEO Express blockchain.  (Note, this may change
	if the wallet gets recreated!).

from:

NUT3MyzCuKJeAm3iyTydqEWDGApqPHkcy5

to (big endian):

2d526e9eb996cc084c28e42d644d6c022763a15d

Using the "Address to ScriptHash (big endian)" converter found on this page linked to me by Hal0x2328:

https://neocompiler.io/#!/ecolab/conversor
 */
 
// DO NOT USE THE VALUE THAT COMES FROM THE VSCode DEBUG CONSOLE output.  It is a byte-swapped
//  big-endian string.  Instead, use the value found in the DevTracker display for the desird
//  wallet.
// const string = WALLET_ADDRESS_LOCAL_BLOCKCHAIN_BOB = '5da16327026c4d642de4284c08cc96b99e6e522d';

/**
 * Make a call to the decimals() method_gastoken against the GasToken contract
 * 	on the TestNet.  This serves as basic test of making an RPC call.
 *
 * @return {Promise<void>}
 */
async function testRpc_gastoken() {
	let errPrefix = `(testRpc_gastoken) `;
	
	let bIsError = false;
	
	const useRpcUrl = rpcAddress_test_net;
	
	const method = "decimals";
	console.log(`\nCalling "${method}()" using URL(${useRpcUrl})...`);
	
	const rpcClient = new rpc.RPCClient(useRpcUrl);
	const newObj = new Object();
	const result = await rpcClient.invokeFunction(scriptHash_gastoken, method) // [])
		.catch(err => {
		    // Convert the error to a promise rejection.
		    // let errMsg = errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
		    // console.error(errMsg + ' - promise');
			console.error(err.message);
			
		    bIsError = true;
		});
	
	console.log(result);
	let bExitCode = bIsError ? 1 :0;
	process.exit(1);
}

/**
 * Make a call to the GetVersion() method against our PredictionMarket
 *  contract on our local NEO Express instance.
 *
 * @return {Promise<void>}
 */
async function testRpc_neodao() {
	let errPrefix = `(testRpc_neodao) `;
	
	let bIsError = false;
	
	const useRpcUrl = rpcAddress_intranet;
	// const useRpcUrl = rpcAddress_test_net;
	
	// PredictionMarket contract method test.
	const useScriptHash = scriptHash_neodao;
	const method = "getVersion";
	
	// GasToken contract method test.
	// const useScriptHash = scriptHash_gastoken;
	// const method = "decimals";
	
	console.log(`\n${errPrefix}\nCalling "${method}()" using URL(${useRpcUrl}) and scriptHash: \n${useScriptHash}`);
	
	const rpcClient = new rpc.RPCClient(useRpcUrl);
	const newObj = new Object();
	
	const result = await rpcClient.invokeFunction(useScriptHash, method) // [])
		.catch(err => {
		    // Convert the error to a promise rejection.
		    // let errMsg = errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
		    // console.error(errMsg + ' - promise');
			console.error(err.message);
			
		    bIsError = true;
		});
		
	// The result is an object that appears to be a StackItem object.
	//  For the "getVersion()" method the should be one element in the
	//	"stack" property, which is array, and that first element should
	//	be of type ByteString.
	let strVersion = CommonNeonJS.getStringItemFromResult(result, 0);
	
	console.log('Version:');
	console.log(strVersion);
	
	
	let bExitCode = bIsError ? 1 :0;
	process.exit(1);
}

async function testRpc_neodao_listAvailableOffers() {
	let errPrefix = `(testRpc_neodao_listAvailableOffers) `;
	
	let bIsError = false;
	
	const neodaoBridge = new NeodaoBridge();

	let reqFake = {};
	let resFake = {};

	const result = await neodaoBridge.listAvailableOffers(reqFake, resFake,'cryptocurrency', 'NEO')
		.catch(err => {
			console.error(err.message);
			
		    bIsError = true;
		});

	console.log(errPrefix + `'Done.`);
}

async function testRpc_neodao_listContraxByParticipantId() {
	let errPrefix = `(testRpc_neodao_listContraxByParticipantId) `;
	
	let bIsError = false;
	
	const neodaoBridge = new NeodaoBridge();
	
	const result = await neodaoBridge.listContraxByParticipantId(g_WalletAddressForLocalBlockchain_bob)
		.catch(err => {
			console.error(err.message);
			
		    bIsError = true;
		});

	console.log(errPrefix + `'Done.`);
}

try {


	/*
	let cryptoSymbol_neodao = 'NEODAO';
	let cryptoSymbol_tfuel = 'TFUEL';
	
	getCryptocomparePrice_promise(cryptoSymbol_neodao)
	.then(result => {
	    console.info(errPrefix + `Cryptocompare result for symbol(${cryptoSymbol_neodao}: `);
        console.dir(result, {depth: null, colors: true})
        
		return getCryptocomparePrice_promise(cryptoSymbol_tfuel)
	})
	.then(result => {
	    console.info(errPrefix + `Cryptocompare result for symbol(${cryptoSymbol_neodao}: `);
        console.dir(result, {depth: null, colors: true})
        process.exit(1);
	})
	 */

	// testRpc_gastoken();
	// testRpc_neodao();
	testRpc_neodao_listAvailableOffers();
	// testRpc_neodao_listContraxByParticipantId();
}

catch(err) {
	// Convert the error to a promise rejection.
	let errMsg =
		errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
	
	console.error(errMsg + ' - try/catch');
	process.exit(1);
}

// const Neon = require("@cityofzion/neon-js");
// const acct = Neon.create.Account("ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW");

















