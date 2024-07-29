// This file contains the Javascript code that supports the proposal details page.

// TEST DATA FOR TESTING THE CODE THAT INTERFACES WITH THE GREENFINCH API.

// const misc_shared_lib = require("../public/javascripts/misc/misc-shared-lib");

// Handlebars template for generating a DAO line.
// let g_DaoDetailsHandlebarsTemplate = null;

// Handlebars template for generating a proposal details line.
let g_ProposalDetailsHandlebarsTemplate = null;

// Handlebars template for NeoFS assets.
let g_NeoFsAssetsHandlebarsTemplate = null;

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

// The GUID of the DAO the proposal belongs to.
let g_OwnerDaoGuid = null;

// The proposal GUID.
let g_ProposalGuid = null;

// The summary field content for the DAO tha owns this proposal will be stored here.
let g_DaoSummaryObj = null;

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

    // -------------------- RETRIEVE PROPOSALS BELONGING TO THE DAO ------------

    const postDataObj_daodetails =
        {
            "params": [
                `${useHash}`,
                "getDaoSummaryByGuid",
                // [{type: "ByteArray", value: "main"}],
                [{type: "Integer", value: `${g_OwnerDaoGuid}`}],
                []
            ],
            "jsonrpc": "2.0",
            "id": 1234,
            "method": "invokefunction"
        }

    xhrPost_promise(lookupRpcUrl(), postDataObj_daodetails)
    .then(progressEvent => {
        const aryDaoSummaryObjs = decodeDaoSummaryListFromRpc(progressEvent);

        if (!(Array.isArray(aryDaoSummaryObjs) || aryDaoSummaryObjs.length < 1))
            throw new Error(`${errPrefix}Unable to find the details for the DAO this proposal belongs to using DAO ID: ${g_OwnerDaoGuid}.`);

        if (aryDaoSummaryObjs.length > 1)
            throw new Error(`${errPrefix}More than one detail object was found for the DAO this proposal belongs to.  DAO ID: ${g_OwnerDaoGuid}.`);

        console.info('------------------------------------------------');
        console.info(`${errPrefix}Successful response JSON RPC.`);
        console.info(errPrefix + `aryDaoSummaryObjs object:`);
        console.dir(aryDaoSummaryObjs, {depth: null, colors: true});

        if (aryDaoSummaryObjs.length < 1)
            throw new Error(`${errPrefix}The array of DAO summary objects is empty.`);
        if (aryDaoSummaryObjs.length > 1)
            throw new Error(`${errPrefix}The array of DAO summary objects contained more than one object.`);

        // Save the DAO summary field content.
        g_DaoSummaryObj = aryDaoSummaryObjs[0];

        // We must base64 encode the proposal ID or the smart contract
        //  won't find it.
        let base64ProposalId = btoa(g_ProposalGuid);

        // -------------------- RETRIEVE THE PROPOSAL DETAILS ------------
        const postDataObj_propdetails =
            {
                "params": [
                    `${useHash}`,
                    "getProposalSummary",
                    // [{type: "ByteArray", value: "main"}],
                    // [{type: "Integer", value: `${g_OwnerDaoGuid}`}],
                    // [{type: "ByteString", value: `${g_ProposalGuid}`}]
                    [
                        {type: "Integer", value: `${g_OwnerDaoGuid}`},
                        {type: "ByteArray", value: `${base64ProposalId}`}
                    ],
                    []
                ],
                "jsonrpc": "2.0",
                "id": 1234,
                "method": "invokefunction"
            }

        return xhrPost_promise(lookupRpcUrl(), postDataObj_propdetails);
    })
    .then(progressEvent => {
        const aryProposalSummaryObjs = decodeProposalSummaryListFromRpc(progressEvent);

        if (!(Array.isArray(aryProposalSummaryObjs) || aryProposalSummaryObjs.length < 1))
            throw new Error(`${errPrefix}Unable to find the details for the current proposal using DAO ID(${g_OwnerDaoGuid}) and proposal ID: ${g_ProposalGuid}`);

        if (aryProposalSummaryObjs.length > 1)
            throw new Error(`${errPrefix}There should be only one proposal summary using DAO ID(${g_OwnerDaoGuid}) and proposal ID: ${g_ProposalGuid}`);

        console.info('------------------------------------------------');
        console.info(`${errPrefix}Successful response JSON RPC(2).`);
        console.info(errPrefix + `aryProposalSummaryObjs object:`);
        console.dir(aryProposalSummaryObjs, {depth: null, colors: true});

        let strHtml = '';

        console.info(`${errPrefix}Number of proposals retrieved: ${aryProposalSummaryObjs.length} .`);

        strHtml = "<ul>";

        // Render the proposal summary.
        let proposalDetailsExtObj = aryProposalSummaryObjs[0];

        // Add some more content for the display.
        proposalDetailsExtObj.ownerDaoDisplayName = g_DaoSummaryObj.displayName;
        proposalDetailsExtObj.ownerDaoUrl = `/dao-details?dao_guid=${g_OwnerDaoGuid}`;

        const strHtmlOneProposal = g_ProposalDetailsHandlebarsTemplate(proposalDetailsExtObj);
        strHtml += strHtmlOneProposal;

        $("#proposal-summary-fields-as-details").html(strHtml);

        // Does this proposal have any assets on NeoFS?
        const strCompoundIdPairs = proposalDetailsExtObj.neofsCompoundIdPairs;

        let strNeoFsAssetsHtml = '';

        if (misc_shared_lib.isEmptySafeString(strCompoundIdPairs)) {
            // This proposal has no assets on NeoFS.
            strNeoFsAssetsHtml = `<p class="empty-list">(none)</p>`;
        } else {
            // Split apart the compound ID pairs list.
            const aryAssetDats = misc_shared_lib.splitAndTrim(strCompoundIdPairs, ',');

            if (aryAssetDats.length < 1)
                throw new Error(`${errPrefix}The attempt to split apart the NeoFS compound ID pairs failed.`);

            // Build a list of NeoFS asset links, one for each
            //  proposal asset in the proposal summary's
            //  list of compound ID pairs.
            strNeoFsAssetsHtml += "<ul>";

            for (let ndx = 0; ndx < aryAssetDats.length; ndx++) {
                // Now process each compound ID pair.
                const neoFsAssetObj = NeoFsAsset.Parse(aryAssetDats[ndx]);

                // Build the HTML for this line and accumulate it.
                const strHtmlOneAsset = g_NeoFsAssetsHandlebarsTemplate(neoFsAssetObj);
                strNeoFsAssetsHtml += strHtmlOneAsset;
            }

            strNeoFsAssetsHtml += "</ul>";
        }

        $('#neofs-assets-list').html(strNeoFsAssetsHtml += "</ul>");
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
    let errPrefix = '(proposal-details-page-support) ';

    console.info(`In Document ready handler.`)

    // Get the page URL arguments.
    const urlArgs = getUrlArguments();

    // We must have the GUID of the DAO that owns the proposal.
    g_OwnerDaoGuid = urlArgs["dao_guid"];

    if (!g_OwnerDaoGuid) {
        alert("The query URL is missing a valid DAO GUID.  Therefore, this page is not operational.");
        return;
    }

    // We must have a proposal GUID.
    g_ProposalGuid = urlArgs["proposal_guid"];

    if (!g_ProposalGuid) {
        alert("The query URL is missing a valid proposal GUID.  Therefore, this page is not operational.");
        return;
    }

    // Execute proposal operation button.
    $('#execute-proposal-operation-btn').click(
        function() {
            // Navigate to the execute proposal operation page using the
            //  the current DAO + PROPOSAL ID pair.
            window.location = `/execute-proposal-operation?dao_guid=${g_OwnerDaoGuid}&proposal_guid=${g_ProposalGuid}`;
            // return false;
        }
    );

    g_GlobalNamespaces.instance.initializeGlobals_promise(true, fetchAssetPriceAndCreateForm_daodetails);

    // Initialize the help system.
    initializeHelpSystem();

    // Compile the handlebars templates we use for later use.
    g_ProposalDetailsHandlebarsTemplate = Handlebars.compile($('#proposal-details-handlebars-template').html());
    g_NeoFsAssetsHandlebarsTemplate = Handlebars.compile($('#neofs-attached-asset-template').html());

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
