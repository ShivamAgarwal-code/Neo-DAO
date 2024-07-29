

// Simple standalone test to see what version of SSL/TLS version we are using.

const https = require('https')

const common_routines = require('../common/common_routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

const {getCryptocomparePriceWithCaching_promise, getNeodaoAndTFuelPriceSSML_promise} = require("../services/cryptocompare");

const errPrefix = '(test-cryptocompare-api.js) ';

try {
	/*
	let cryptoSymbol_neodao = 'NEODAO';
	let cryptoSymbol_tfuel = 'TFUEL';
	
	getCryptocomparePriceWithCaching_promise(cryptoSymbol_neodao)
	.then(result => {
	    console.info(errPrefix + `Cryptocompare result for symbol(${cryptoSymbol_neodao}: `);
        console.dir(result, {depth: null, colors: true})
        
		return getCryptocomparePriceWithCaching_promise(cryptoSymbol_tfuel)
	})
	.then(result => {
	    console.info(errPrefix + `Cryptocompare result for symbol(${cryptoSymbol_neodao}: `);
        console.dir(result, {depth: null, colors: true})
        process.exit(1);
	})
	 */
	 
	getNeodaoAndTFuelPriceSSML_promise()
	.catch(err => {
	    let errMsg =
	        errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
	    console.error(errPrefix + errMsg);
		process.exit(1);
	});
}
catch(err) {
	// Convert the error to a promise rejection.
	let errMsg =
		errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
	
	console.error(errMsg + ' - try/catch');
	process.exit(1);
}