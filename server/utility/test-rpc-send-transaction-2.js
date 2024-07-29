// Sample code from Edge on the NEO Discord that does a quick invoke test
//  that (can) involve a wallet related transaction.

const Neon = require("@cityofzion/neon-js");

const common_routines = require('../common/common_routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

// const wif = "L3yyCx9TwgQZkm2VxWBsrkdPyECNSDRXQfHZc8AzNMM9iyyuCuXm"; // test key
// const g_PrivateKey = common_routines.getEnvironmentVarOrError('NEO_PRIVATE_KEY');

const theRpcNodeUrl = common_routines.getEnvironmentVarOrError("URL_NEO_RPC_NODE");
const theNodeNetworkMagic = common_routines.getEnvironmentVarOrError("NETWORK_MAGIC_RPC_NODE");

const thePrivateKey = common_routines.getEnvironmentVarOrError('NEO_PRIVATE_KEY');
// The public address for our "bob" account.
const bobsWalletAddress = common_routines.getEnvironmentVariableByName('WALLET_ADDRESS_LOCAL_BLOCKCHAIN_BOB');

const acc = new Neon.wallet.Account(thePrivateKey);
const config = {
    networkMagic: theNodeNetworkMagic, // NEO Express local.
    rpcAddress: theRpcNodeUrl, // "http://neo3.edgeofneo.com:10332",
    account: acc
};

const gasTokenScriptHash = "0xd2a4cff31913016155e38e474a2c06d08be276cf" // gas contract
// const to_address = "30c12c1a2df2a5a9d9ec0a624c6accf1e824305e" // big endian script hash

const amount = 1

async function invokeFunction(config, scScriptHash, toScriptHash, amount) {
	const errPrefix = `(invokeFunction) `;
	
    const nep17TokenContract = new Neon.experimental.SmartContract(
        Neon.u.HexString.fromHex(scScriptHash),
        config
    );

    const theParams = [
        Neon.sc.ContractParam.hash160(config.account.scriptHash),
        Neon.sc.ContractParam.hash160(toScriptHash),
        Neon.sc.ContractParam.integer(amount),
        Neon.sc.ContractParam.any()
    ];

    const theSigner = new Neon.tx.Signer({
        account: Neon.u.HexString.fromHex(config.account.scriptHash),
        scopes: Neon.tx.WitnessScope.CalledByEntry
    });

    async function run() {
    	const errprefix = '(invokeFunction::run) ';
    	
        // console.log(`Transferring ${amount} token(s) from ${config.account.address} to ${Neon.wallet.getAddressFromScriptHash(toAddress)}`)
        console.info(`Transferring ${amount} token(s) from ${config.account.address} to ${toScriptHash}`)
        
        let bIsError = false;
        
        const invokeResult =
        	// testInvoke() for read-only invoke.  invoke() for actual transfer test.
        	// await nep17TokenContract.testInvoke("transfer", theParams, [theSigner])
        	await nep17TokenContract.invoke("transfer", theParams, [theSigner])
        	.catch(err => {
        		bIsError = true;
        	    let errMsg =
        	        errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
        	    
        	    console.error(errMsg + ' - promise');
        	});
        	
        
        if (bIsError) {
        	// The error should have been displayed in the catch block above.
		} else {
        	console.info(errPrefix + `result of invoke/testInvoke() call:`);
        	console.dir(invokeResult, {depth: null, colors: true});
		}
        
        process.exit(0);
    }

    const runResult = await run();
    
    console.info(errPrefix + `result of run() call:`);
    console.dir(runResult, {depth: null, colors: true});
}

const errPrefix = 'test-rpc-send-transaction-2.js';

try {
	// Convert bobs address to a big-endian script hash.
	const bobsScriptHash =
		Neon.wallet.getScriptHashFromAddress(bobsWalletAddress);
		
	if (misc_shared_lib.isEmptyOrWhitespaceString (bobsScriptHash))
		throw new Error(errPrefix + `The script hash returned from getScriptHashFromAddress() is invalid.`);
		
	
	invokeFunction(config, gasTokenScriptHash, bobsWalletAddress, amount);
} catch(err)
{
	// Convert the error to a promise rejection.
	let errMsg =
		errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
	
	console.error(errMsg);
	
	process.exit(1);
}
