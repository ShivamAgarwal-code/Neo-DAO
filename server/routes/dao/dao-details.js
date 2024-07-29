// This route renders the DAO details page.

const express = require('express');
const router = express.Router();
const http_status_codes = require('http-status-codes');

/**
 * WARNING!:  Including these two modules results in an illegal character warning from Node.JS!
 */
// const common_routines = require('../../common/common-routines');
// const misc_shared_lib = require('../../public/javascripts/misc/misc-shared');

const ROUTE_URL = 'dao-details';
const ROUTE_OPERATION = 'show the details for a DAO';

router.get('/' + ROUTE_URL, function(req, res, next) {
    let errPrefix = `(${ROUTE_URL}) `;

    try {
        let locals = {};

        res.render(
            'dao/dao-details',
            {
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
