// This file contains code to convert s plain text file that contains
//	a list of asset symbol/description pairs to JSON Objects.

const uuidV4 = require('uuid/v4');
const common_routines = require('../common/common_routines');
const misc_shared_lib = require('../public/javascripts/misc/misc-shared-lib');

const fs = require('fs');
const jsonfile = require('jsonfile');
const {AssetSymbolAndToken} = require("../common/asset-symbol-and-description");

const errPrefix = 'make-asset-symbol-json-objects.js';

const inputFilePath = `../input-files`;
const srcRawAsciiFilePath = `${inputFilePath}/top-1000-cryptocurrency-symbol-and-name-list.txt`;
const destJsonObjFilePath = `${inputFilePath}/top-1000-cryptocurrency-symbol-and-name-list.json`;

try {
	// Load the ASCII file containing the symbol/description pairs.
	
	const inputFileAsStr = fs.readFileSync(srcRawAsciiFilePath, 'utf8');
	
	// Split by line feeds.
	let aryLines = inputFileAsStr.split('\n');
	
	if (aryLines.length < 1)
		throw new Error(errPrefix + `The input file is essentially empty.  Input file name: ${srcRawAsciiFilePath}.`);
		
	let aryAssetSymAndDescObjs_1 = [];
	
	for (let i = 0; i < aryLines.length; i++) {
		// Create a AssetSymbolAndToken object from each line
		//  and accumulate it.
		let str = aryLines[i].trim();
		
		// Ignore comment lines and empty lines.
		if (str.length > 0 && str[0] !== '#') {
			// Parse the line into a new AssetSymbolAndToken object
			//  and accumulate it.
			
			let newObj = AssetSymbolAndToken.Parse(str);
			
			// We just need the asset symbol and description fields.
			aryAssetSymAndDescObjs_1.push(
				{
					name: newObj.name,
					// Prefix the description with the symbol for
					//  select box display.
					description: `${newObj.name} - ${newObj.description}`
				}
			);
		}
	}
	
	if (aryAssetSymAndDescObjs_1.length < 1)
		throw new Error(errPrefix + `The resulting array of asset symbol and description objects is empty.`);
		
	// Sort the array by asset symbol.
	let aryAssetSymAndDescObjs_2 =
		aryAssetSymAndDescObjs_1.sort((elem_1, elem_2) => (elem_1.name.toLowerCase() > elem_2.name.toLowerCase()) ? 1 : -1);
		
	// Create a container object.
	const containerObj = {};
	
	containerObj.contentsDescription = 'Asset Symbols and Descriptions array.';
	containerObj.aryAssetSymbolAndDescriptions = aryAssetSymAndDescObjs_2;
		
	// Write out the object to disk.
	jsonfile.writeFileSync(destJsonObjFilePath, containerObj);
	
	console.log('Success.  JSON object that contains the array of asset symbols and descriptions written to the file named:');
	console.log(destJsonObjFilePath);
	process.exit(0);
} catch(err) {
	// Convert the error to a promise rejection.
	let errMsg =
		errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
	
	console.error(errMsg + ' - try/catch');
	process.exit(1);
}
