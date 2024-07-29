// This file contains the Javascript code that supports the list DAOS page.

// TEST DATA FOR TESTING THE CODE THAT INTERFACES WITH THE GREENFINCH API.

// const misc_shared_lib = require("../public/javascripts/misc/misc-shared-lib");

// Handlebars template for generating a DAO line.
let g_DaoDetailsHandlebarsTemplate = null;

// Handlebars template for generating a proposal details line.
let g_ProposalDetailsHandlebarsTemplate = null;

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

const g_RecentlyUploadedAssetsDivId = 'recently-uploaded-asset-div';
const g_RecentlyUploadedAssetsDivId_selector = '#' + g_RecentlyUploadedAssetsDivId;

// Counts the number of Alpaca form updates.
let g_UpdateCounter = 0;


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
function fetchAssetPriceAndCreateForm_daodetails(selectedValue) {
    let errPrefix = `(fetchAssetPriceAndCreateForm_daodetails) `;

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

            console.warn(`${errPrefix}Alpaca form is DISABLED.`);
            /*
                NOTE: We have not added an Alpaca form to this page yet.
            // If the Alpaca form has not been created yet, do so now.
            if (!g_IsAlpacaForObjCreated) {
                createAlpacaForm_subprop(g_CurrentAssetSymbol, g_CurrentAssetPrice);
                g_IsAlpacaForObjCreated = true;
            } else {
                // Update the Alpaca form field that will trigger any Alpaca
                //  controls dependent on it.
                const control = $(g_AlpacaFormObjId_selector).alpaca("get");
                // control.getControlEl().css("border", "5px blue solid");
                g_UpdateCounter++;
                control.childrenByPropertyId['triggerUpdateCounter'].setValue(g_UpdateCounter);
            }
             */

        })
        .catch(err => {
            // Log the error message to the console.
            let errMsg =
                errPrefix + misc_shared_lib.conformErrorObjectMsg(err);

            console.error(errMsg);
        });
}

/**
 * This is the interval function that (not used currently).
 */
function doIntervalWork() {
    const errPrefix = `(doIntervalWork) `;

    try {
        // STUB.
    }
    catch(err) {
        // Convert the error to a promise rejection.
        let errMsg =
            errPrefix + conformErrorObjectMsg(err);

        reject(errMsg + ' - try/catch');
    }
}

/**
 * This function will be called when the Neoline object
 *  is ready.
 */
function doStart() {
    const errPrefix = `(doStart) `;

    // -------------------- RETRIEVE DAO DETAILS ------------
    const neoDaoScriptHash = lookUpScriptHashOrDie('NEODAO_TESTNET');
    const useHash = neoDaoScriptHash.startsWith('0x') ? neoDaoScriptHash : '0x' + neoDaoScriptHash;

    const postDataObj_1 =
        {
            "params": [
                `${useHash}`,
                "getDaoSummaryByGuid",
                // [{type: "ByteArray", value: "main"}],
                [{type: "Integer", value: `${g_DaoGuid}`}],
                []
            ],
            "jsonrpc": "2.0",
            "id": 1234,
            "method": "invokefunction"
        }

    xhrPost_promise(lookupRpcUrl(), postDataObj_1)
    .then(progressEvent => {
        const aryDaoSummaryObjs = decodeDaoSummaryListFromRpc(progressEvent);

        if (aryDaoSummaryObjs) {
            console.info('------------------------------------------------');
            console.info(`${errPrefix}Successful response JSON RPC.`);
            console.info(errPrefix + `aryDaoSummaryObjs object:`);
            console.dir(aryDaoSummaryObjs, {depth: null, colors: true});

            if (aryDaoSummaryObjs.length < 1)
                throw new Error(`${errPrefix}The array of DAO summary objects is empty.`);
            if (aryDaoSummaryObjs.length > 1)
                throw new Error(`${errPrefix}The array of DAO summary objects contained more than one object.`);

            // Render the summary object.
            const strHtml = g_DaoDetailsHandlebarsTemplate(aryDaoSummaryObjs[0]);
            $("#dao-summary-fields-as-details").html(strHtml);
        } else {
            console.info(`${errPrefix}The results are empty.`)
        }

        // -------------------- RETRIEVE PROPOSALS BELONGING TO THE DAO ------------
        const postDataObj_2 =
            {
                "params": [
                    `${useHash}`,
                    "listAllProposalsForDao",
                    // [{type: "ByteArray", value: "main"}],
                    [{type: "Integer", value: `${g_DaoGuid}`}],
                    []
                ],
                "jsonrpc": "2.0",
                "id": 1234,
                "method": "invokefunction"
            }

        return xhrPost_promise(lookupRpcUrl(), postDataObj_2);
    })
    .then(progressEvent => {
        const aryProposalSummaryObjs = decodeProposalSummaryListFromRpc(progressEvent);

        let strHtml = "No proposals have been created yet for this DAO.";

        if (aryProposalSummaryObjs) {
            console.info('------------------------------------------------');
            console.info(`${errPrefix}Successful response JSON RPC(2).`);
            console.info(errPrefix + `aryProposalSummaryObjs object:`);
            console.dir(aryProposalSummaryObjs, {depth: null, colors: true});

            if (aryProposalSummaryObjs.length < 1) {
                console.info(`${errPrefix}The array of proposal summary objects is empty.`);
            } else {
                console.info(`${errPrefix}Number of proposals retrieved: ${aryProposalSummaryObjs.length} .`);

                strHtml = `<ul class="unpadded-list">`;

                // Sort the proposal objects alphabetically by proposal description.
                aryProposalSummaryObjs.sort((a, b) =>
                {
                    return a.details.toLowerCase().localeCompare(b.details.toLowerCase());
                });

                for (let ndx = 0; ndx < aryProposalSummaryObjs.length; ndx++) {
                    // Render the proposal objects.
                    //
                    // Build a link that will take you to the proposal details page
                    //  for the proposal.
                    let proposalSummaryObj = aryProposalSummaryObjs[ndx];

                    const urlToProposalDetailsPage =
                            `/proposal-details?dao_guid=${g_DaoGuid}&proposal_guid=${proposalSummaryObj.id}`;
                    proposalSummaryObj.proposalDetailsUrl = urlToProposalDetailsPage;

                    const strHtmlOneProposal = g_ProposalDetailsHandlebarsTemplate(proposalSummaryObj);
                    strHtml += strHtmlOneProposal;
                }

                strHtml += "</ul>";
            }

        } else {
            console.error(`${errPrefix}The proposal details array is unassigned.`)
        }

        $("#proposals-list-for-dao").html(strHtml);

        return(true);
    })
    .catch(err => {
        // Convert the error to a promise rejection.
        let errMsg =
            errPrefix + conformErrorObjectMsg(err);

        console.error(errMsg + ' - promise');
    });
}

// Document ready handler.
$(document).ready(function (){
    let errPrefix = '(dao-details-page-support) ';

    console.info(`In Document ready handler.`)

    // Get the page URL arguments.
    const urlArgs = getUrlArguments();

    // We must have a DAO GUID.
    g_DaoGuid = urlArgs["dao_guid"];

    if (!g_DaoGuid) {
        alert("The query URL is missing a valid DAO GUID.  Therefore, this page is not operational.");
        return;
    }

    // Create proposal button.
    $('#create-proposal-btn').click(
        function() {
            // Navigate to the submit proposal button set to
            //  the current DAO ID.
            window.location = `/submit-proposal?dao_guid=${g_DaoGuid}`;
            // return false;
        }
    );

    /*
    // Change the CREATE PROPOSAL href attribute to navigate
    //  to the submit-proposal page set to the current DAO id.
    const newUrl =
        `/submit-proposal?dao_guid=${g_DaoDetailsHandlebarsTemplate}`;

    const oldUrl =
        $("#create-new-proposal-btn").attr("href");
    console.info(`Old create new proposal button href value: ${oldUrl}`);
    $("#create-new-proposal-btn").attr("href", newUrl);
    */

    g_GlobalNamespaces.instance.initializeGlobals_promise(true, fetchAssetPriceAndCreateForm_daodetails);

    // Initialize the help system.
    initializeHelpSystem();

    // Compile the handlebars templates we use for later use.
    g_DaoDetailsHandlebarsTemplate = Handlebars.compile($('#dao-details-handlebars-template').html());
    g_ProposalDetailsHandlebarsTemplate = Handlebars.compile($('#proposal-details-handlebars-template').html());

    // If Neoline is ready, call our worker function that
    //  depends on Neoline being ready now.  Otherwise,
    //  tell the Neoline helper object to call our
    //  notification function when it's ready.
    if (g_NeoLineHelper.isNeoLineReady)
        doStart();
    else
        g_NeoLineHelper.instance.funcCallMeWhenReady = doStart;

    // Start an interval that polls the Greenfinch API for
    //  new uploads.
    setInterval(doIntervalWork, 1000);

});

/*
            try {
            catch (err)
            {
                const errMsg =
                    errPrefix + misc_shared_lib.conformErrorObjectMsg(err);
                console.error(errMsg);
                console.error('------------------------------------------------');
                console.error(`${errPrefix}Invalid response from JSON RPC.`);
                console.info(errPrefix + `progressEvent object:`);
                console.dir(progressEvent, {depth: null, colors: true});
            }
 */