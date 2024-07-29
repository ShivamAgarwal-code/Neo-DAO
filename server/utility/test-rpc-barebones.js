// This file contains some simple code to run a few basic
//  tests against an RPC node.  This is the original version
//  that we know works so we are keeping it around as a base
//  test of the RPC bridge.


// const rpcAddress = "http://seed1t.neo.org:20332";
/*
const rpcAddress = common_routines.getEnvironmentVarOrError("URL_NEO_RPC_NODE");
const scripthash = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
const method = "decimals";
const params = {};
const {rpc} = require("@cityofzion/neon-js")
// const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');
*/

const {rpc} = require("@cityofzion/neon-js")
const common_routines = require("../common/common_routines");
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

const {CommonNeonJS} = require("../common/common-neon-js");


const rpcAddress_intranet = common_routines.getEnvironmentVarOrError("URL_NEO_RPC_NODE");

const rpcAddress_test_net = "http://seed1t.neo.org:20332";
const scriptHash_gastoken = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
const scriptHash_neodao = "0x0b7fbfe7e434497dfe9bdbba537005bb15daf22d";
const params = {};

const errPrefix = '(test-rpc.js) ';

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
	
	const useRpcUrl = rpcAddress_intranet;
	// const useRpcUrl = rpcAddress_test_net;
	
	// PredictionMarket contract method test.
	const useScriptHash = scriptHash_neodao;
	const method = "listAvailableOffers";
	// const method = "getVersion";
	
	// GasToken contract method test.
	// const useScriptHash = scriptHash_gastoken;
	// const method = "decimals";
	
	console.log(`\n${errPrefix}\nCalling "${method}()" using URL(${useRpcUrl}) and scriptHash: \n${useScriptHash}`);
	
	const rpcClient = new rpc.RPCClient(useRpcUrl);
	const newObj = new Object();
	
	const args = [
		CommonNeonJS.buildScParam_string("cryptocurrency"),
		CommonNeonJS.buildScParam_string("NEO")
	];
	
	console.log(`Using args: `);
	console.log(args);
	
	const result = await rpcClient.invokeFunction(useScriptHash, method, args)
		.catch(err => {
		    // Convert the error to a promise rejection.
		    // let errMsg = errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
		    // console.error(errMsg + ' - promise');
			console.error(err.message);
			
		    bIsError = true;
		});
	
	console.log('Raw result:');
	console.log(result);
	
	console.info(errPrefix + `result object:`);
	console.dir(result, {depth: null, colors: true});
	
	
	let bExitCode = bIsError ? 1 :0;
	process.exit(1);
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
















