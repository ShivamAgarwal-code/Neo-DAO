// This route renders the create DAO page.

const express = require('express');
const router = express.Router();
const http_status_codes = require('http-status-codes');

/**
 * WARNING!:  Including these two modules results in an illegal character warning from Node.JS!
 */
// const common_routines = require('../../common/common-routines');
// const misc_shared_lib = require('../../public/javascripts/misc/misc-shared');

const ROUTE_URL = 'submit-proposal';
const ROUTE_OPERATION = 'submit a proposal to a DAO';

/**
 * WARNING!  Including this module corrupts the WebStorm Node.JS error leading to
 *  an "illegal char" error message!
 */
// const { g_CryptoSymbolAndDescription } = require('../../data/assets/cryptocurrency-symbol-and-descriptions.js');

router.get('/' + ROUTE_URL, function(req, res, next) {
    let errPrefix = `(${ROUTE_URL}) `;

    try {
        let locals = {};

        res.render(
            'dao/submit-proposal',
            {
                // strAryAssetSymbolAndDescriptions:
                //    JSON.stringify(g_CryptoSymbolAndDescription.instance.aryAssetSymbolAndDescriptions)
            });
    }
    catch (err)
    {
        const errMsg =
            misc_shared_lib.conformErrorObjectMsg(err);
        console.error(`[ERROR: ${ROUTE_URL}] Error -> ${errMsg}.`);
        // Do not send an error response if we already returned one.
        if (!res.locals.isResponseAlreadySent)
            res.status(http_status_codes.INTERNAL_SERVER_ERROR).send('Error processing request.');
        return;
    }
});

module.exports = router;
