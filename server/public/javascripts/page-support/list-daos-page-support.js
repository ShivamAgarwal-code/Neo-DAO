// This file contains the Javascript code that supports the list DAOS page.

// TEST DATA FOR TESTING THE CODE THAT INTERFACES WITH THE GREENFINCH API.

// const misc_shared_lib = require("../public/javascripts/misc/misc-shared-lib");
const g_IsGreenfinchTest = true;

const g_IsVerboseDebugging = false;

// Handlebars template for generating a DAO lien.
let g_ListDaosHandlebarsTemplate = null;

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
function fetchAssetPriceAndCreateForm_subprop(selectedValue) {
    let errPrefix = `(fetchAssetPriceAndCreateForm_subprop) `;

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
 * Client side test of the Ghostmarket API that retrieves a
 *  list of NFTs (assets).
 *
 * @return {Promise<Object>} - A promise that resolves to an object
 *  that contains the search results of the Ghostmarket API call
 *  that retrieves assets.
 */
function testGhostMarketAssetCall_promise() {
    let errPrefix = '(testGhostMarketAssetCall_promise) ';

    return new Promise(function(resolve, reject) {
        try	{
            // Get SomniumWave's NFTs from the Ghostmarket inventory.

            const assetRequestBuilerObj = new GmGetAssetCallBuilder();
            assetRequestBuilerObj.url_arg_creator = 'SOMNIUMWAVE';

            // TRUE means use the Ghostmarket TEST API, which will return
            //  search results for inventory/NFTs minted on EITHER the
            //  host blockchain MAIN or TEST network.
            const assetRequestUrl = assetRequestBuilerObj.buildRequestUrl(true);

            if (bVerbose) {
                console.log(`${errPrefix}Requesting assets from Ghostmarket using URL: ${assetRequestUrl}`);
            }

            xhrGet_promise(assetRequestUrl)
                .then(result => {
                    console.info(`${errPrefix}result of Ghostmarket API assets retrieval test: ${result}`);
                    console.info(errPrefix + `result object:`);
                    console.dir(result, {depth: null, colors: true});

                    resolve(result);
                })
                .catch(err => {
                    // Convert the error to a promise rejection.
                    let errMsg =
                        errPrefix + conformErrorObjectMsg(err);

                    reject(errMsg + ' - promise');
                });
        }
        catch(err) {
            // Convert the error to a promise rejection.
            let errMsg =
                errPrefix + conformErrorObjectMsg(err);

            reject(errMsg + ' - try/catch');
        }
    });
}

/**
 * Create the Alpaca form that lets the user enter the offer details.
 */
function createAlpacaForm_subprop(currentAssetSymbol, currentAssetPrice) {
    let errPrefix = `(createAlpacaForm_subprop) `;

    if (misc_shared_lib.isEmptySafeString(currentAssetSymbol))
        throw new Error(errPrefix + `The currentAssetSymbol parameter is empty.`);
    if (typeof currentAssetPrice !== 'number')
        throw new Error(errPrefix + `The value in the currentAssetPrice parameter is not a number.`);
    if (currentAssetPrice <= 0)
        throw new Error(errPrefix + `The current asset price is less than or equal to zero.`);


    // ------------------ ALPACA FORM --------------------

    const dateToday = misc_shared_lib.getToday();
    const dateTomorrow = misc_shared_lib.getToday(1);

    // Remove any existing elements with this ID (i.e. - clean up
    //  old forms).
    console.info(errPrefix + `Removing any existing Alpaca form instances.`);
    $(g_AlpacaDivId_selector).remove();

    // Recreate the removed element and attach it to the
    //  correct host DIV.
    $(g_AlpacaHostDivId_selector).append(`<div id="${g_AlpacaDivId}"></div>`);

    // Create a brand new form for the new cryptocurrency.
    console.info(errPrefix + `Creating a new Alpaca form for cryptocurrency: ${currentAssetSymbol}.`);

    // The default summoning time is now.
    let defaultSummoningTime = Date.now();

    // Data source for the depositToken field, that
    //  returns the currently selected asset symbol.
    const dataSrcCryptoSymbol = function(callback) {
        // const value = this.observable("/city").get();
        // callback(teamsMap[value]);

        callback(g_CurrentAssetSymbol);
    };

    // -------------------- ALPACA FORM DISABLED --------------------
    console.warn(`${errPrefix}This page does not need an Alpaca form yet.  Skipping form creation.`);
    return;

    // CREATE DAO FORM FIELD DECLARATION (Alpaca Forms)
    $(g_AlpacaDivId_selector).alpaca(
        {
            // Field names, initial values.
            "data": {
                "ownerAddress": 'not set',

                "ID": '',
                "displayName": '',

                "depositTokenSymbol": g_CurrentAssetSymbol,

                "dilutionBound": DEFAULT_DILUTION_BOUND,
                "gracePeriodLength": DEFAULT_GRACE_PERIOD_LENGTH,
                "membershipFee": DEFAULT_MEMBERSHIP_FEE,
                "minSummonerShares": DEFAULT_GRANTSDAO_MIN_SUMMONER_SHARES,
                "periodDuration": DEFAULT_PERIOD_DURATION,
                "processingReward": DEFAULT_PROCESSING_REWARD,
                "proposalDeposit": DEFAULT_PROPOSAL_DEPOSIT,
                "votingPeriodLength": DEFAULT_VOTING_PERIOD_LENGTH,

                "summoningTime": defaultSummoningTime,

                // This is a hidden field we use to trigger the
                //  update of any field that pulls its data
                //  from an external data source.  In our
                //  case, we want the readonly depositTokenSymbol
                //  field to update itself to the cryptocurrency
                //  asset currently selected in the form level
                //  list-box for those.
                //
                // Incrementing this field should trigger the necessary
                //  updates.
                "triggerUpdateCounter": g_UpdateCounter,
            },
            "schema": {
                "title": "Create DAO",
                "description": "Create a DAO",
                "type": "object",
                // Field definitions.
                "properties": {
                    "displayName": {
                        "type": "string",
                        "title": "Display Name",
                        // "enum":['PUT', 'CALL'],
                        "required": true,
                    },
                    // The deposit token is the selected via the cryptocurrency
                    //  selection box.
                    "depositTokenSymbol": {
                        "type": "string",
                        "title": "Default Token",
                        readonly: true,
                        "required": true,
                    },
                    "dilutionBound": {
                        "type": "number",
                        "title": "Dilution Bound",
                        "required": true,
                    },
                    "gracePeriodLength": {
                        "type": "number",
                        "title": "Grace Period Length",
                        "required": true,
                    },
                    "membershipFee": {
                        "type": "number",
                        "title": "Membership Fee",
                        "required": true,
                    },
                    "minSummonerShares": {
                        "type": "number",
                        "title": "Minimum number of shares to create DAO (for a GRANT related DAO only)",
                        "required": true,
                    },
                    "proposalDeposit": {
                        "type": "number",
                        "title": "Proposal Deposit",
                        "required": true,
                    },
                    "periodDuration": {
                        "type": "number",
                        "title": "Period Duration",
                        "required": true,
                    },
                    "processingReward": {
                        "type": "number",
                        "title": "Processing Reward",
                        "required": true,
                    },
                    "votingPeriodLength": {
                        "type": "number",
                        "title": "Voting Period Length",
                        "required": true,
                    },
                    // AUTOMATICALLY DERIVED FIELDS (HIDDEN).
                    "ownerAddress": {
                        "type": "string",
                        "title": "Owner Address",
                        "required": true,
                        "hidden": true,
                    },
                    "ID": {
                        "title": "DAO ID",
                        "required": true,
                        "hidden": true,
                    },
                    "summoningTime": {
                        // DO NOT USE TYPE "date"! You will get a FIELD_INSTANTATION_ERROR
                        //  from the Alpaca library.  Use the "format" property instead
                        //  (see below).
                        // "type": "date",
                        "title": "Summoning Time",

                        // TODO: Disabling this for now.  Getting an error
                        //  from the bootstrap-datetimepicker library.

                        /*
                        "format": "date",
                         */
                        "readonly": true,
                        "required": true,
                        // TODO: This doesn't work.
                        //
                        // Set it to read-only so only the datetimepicker control
                        //  can enter dates, to avoid having the user enter an
                        //  invalid date.
                        // "readonly": true,
                    },
                    "triggerUpdateCounter": {
                        "title": "TRIGGER UPDATE CONTAINER",
                        "required": true,
                        "hidden": true,
                    }
                }
            },
            "options": {
                // Add this to the top of the "options" section.  Without
                //  this form level validator property/function, the per-field
                //  validators will NOT fire!
                "validator": function(callback) {

                    const dateToday = new Date();

                    // Get the Alpaca form data object.
                    let formDataObj = this.getValue();

                    // Calculate the derived fields and check for errors.  If an error
                    //  occurs, build an object appropriate for the Alpaca callback
                    //  function and push it into the aryErrObjs variable.
                    let aryErrObjs = [];
                    // const offerType = getAlpacaFieldValue(this, "offerType");

                    // Derive the expiration date/time delta value by
                    // Update the hidden expiration date/time delta field.
                    // setAlpacaFieldValue(this, "expirationDateTimeDelta", expirationDateTimeDelta);

                    // Any errors?
                    if (aryErrObjs.length > 0) {
                        let errMsg = null;

                        // Yes.  Build an appropriate error message.
                        if (aryErrObjs.length <= 1)
                            errMsg = aryErrObjs[0];
                        else
                            errMsg = `Please fix the following errors first: \n` + aryErrObjs.join('\n');

                        callback({
                            "status": false,
                            "message": errMsg
                        });
                        return;
                    } else {
                        // Let the Alpaca handler know the form level validations passed.
                        callback({
                            "status": true
                        });
                    }
                },
                // FIELD LEVEL SETTINGS.
                "fields": {
                    "depositTokenSymbol": {
                        // NOTE: Changing the currentAssetSymbolSelected hidden field will update the
                        //  this field.
                        /*
                        "dependencies": {
                            "currentAssetSymbolSelected":
                        }
                         */
                        "dataSource": dataSrcCryptoSymbol,
                    },
                    "displayName": {
                        "validator": function(callback) {
                            validateStringField_basic(this, callback, this.getTitle());
                        }
                    },
                    "dilutionBound": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_DILUTION_BOUND, true);
                        }
                    },
                    "membershipFee": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), DEFAULT_MEMBERSHIP_FEE, MAX_NUMBER_OF_SHARES_AND_LOOT, false);
                        }
                    },
                    "minSummonerShares": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 0, DEFAULT_GRANTSDAO_MAX_SUMMONER_SHARES, false);
                        }
                    },
                    "periodDuration": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_PERIOD_DURATION, true);
                        }
                    },
                    "votingPeriodLength": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_VOTING_PERIOD_LENGTH, true);
                        }
                    },
                    "processingReward": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_PROCESSING_REWARD_TOKENS, true);
                        }
                    },
                    "proposalDeposit": {
                        "validator": function(callback) {
                            // The proposal deposit must not be less than the processing reward.
                            const proposalDeposit = this.getValue();
                            const processingReward = getAlpacaFieldValue(this, "processingReward");

                            if (proposalDeposit < processingReward) {
                                callback({
                                    "status": false,
                                    "message": `The proposal deposit must not be less than the processing reward.`
                                });
                                return;
                            }

                            // Do the range bound validation now.
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 1, MAX_PROCESSING_REWARD_TOKENS, true);
                        }
                    },
                    /*
                    "validator": function(callback) {
                        // Get this field's current value.
                        let value = this.getValue();

                        // Validation logic.
                        callback({
                            "status": true
                        });

                        // Get the value of another field on the form.
                        let age = this.getParent().childrenByPropertyId["age"].getValue();
                        // Validation logic.
                        if ((value === "beer" || value === "wine") && age < 21) {
                            callback({
                                "status": false,
                                "message": "You are too young to drink alcohol!"
                            });
                            return;
                        }
                        callback({
                            "status": true
                        });
                        return;
                         */
                },
                "form": {
                    /*
                    ROS: This block is only needed if the form data is submitted
                    directly to a back-end server.
                    "attributes":{
                        "action":"<some API URL>",
                        "method":"POST"
                    },
                     */
                    // ---------------- SUBMIT BUTTON ----------------
                    "buttons":{
                        "submit":{
                            "title": "Create This DAO",
                            "id": g_AlpacaSubmitButtonId,
                            "click": function(a, b, c) {
                                const formDataObj = this.getValue();

                                if (this.isValid(true)) {
                                    g_NeoLineHelper.instance.createDao_promise(formDataObj, formDataObj.depositTokenSymbol);

                                    // alert(`Submit the data to the NeoLine extension!`);
                                } else {
                                    alert("Invalid value: " + JSON.stringify(formDataObj, null, "  "));
                                }
                            }
                        }
                    },
                    // set this flag to TRUE if you don't want to show validation errors
                    //  to the user when the form is first presented.
                    "hideInitValidationError": false,
                },
                "helper": "Create a new DAO",
            },
            "postRender": function(control) {
                const fldTriggerUpdateCounter = control.childrenByPropertyId["triggerUpdateCounter"];
                const fldlDepositTokenSymbol = control.childrenByPropertyId["depositTokenSymbol"];

                // When fldTriggerUpdateCounter field changes, trigger
                //  a refresh of the depositTokenSymbol field.
                fldTriggerUpdateCounter.on("change", function() {
                    fldlDepositTokenSymbol.refresh();
                })

                // when the "validated" even is raised, enable the submit button
                control.on("validated", function(e) {
                    $(g_AlpacaSubmitButtonId_selector).prop("disabled", false);
                });
            }

            /*
            "postRender": function(control) {
                const fldlDepositToken = control.childrenByPropertyId["depositToken"];
                const fldCurrentAsset = control.childrenByPropertyId["currentAssetSymbolSelected"];

                // Subscribe depositToken field to changes
                //  in the currentAssetSymbolSelected field, which is updated
                //  automatically when the use selects a new cryptocurrency
                //  asset from the drop-down list for those.
                fldlDepositToken.subscribe(fldCurrentAsset, function(val) {
                    // The line below is from the Alpaca observables docs.
                    //  It shows how you can get the value of the field's
                    //  "enum" property from the "this" object.
                    // this.schema.enum = this.options.optionLabels = teams[val];

                    // Copy the current value of the currentAssetSymbolSelected field
                    //  into the depositToken field.
                    this.schema = val;

                    this.refresh();
                });
            }
             */

            /*
            "postRender": function(control) {
                // control.childrenByPropertyId["name"].getFieldEl().css("background-color", "lightgreen");
            }
             */
        });

    // Use jQuery directly to set the expiration date-time field
    //  to read-only so only the datetimepicker control can enter
    //  dates, to avoid having the user enter an invalid date.
    //  We tried the Alpaca declarations first but they didn't work.
    //  See above.
    $("#" + g_IdOfAlpacaExpirationDateTimeField).attr('readOnly', 'true');
}

/**
 * This function will be called when the Neoline object
 *  is ready.
 */
function doStart() {
    const errPrefix = `(doStart) `;

    const neoDaoScriptHash = lookUpScriptHashOrDie('NEODAO_TESTNET');

    const useHash = neoDaoScriptHash.startsWith('0x') ? neoDaoScriptHash : '0x' + neoDaoScriptHash;

    const postDataObj =
        {
            "params": [
                // "0x2fea7bf438c8b6c331552640773d5c8a1e0fb12a",
                `${useHash}`,
                "listAllDaos",
                // "listAllProposalsForDao",
                // "echo",
                // [{type: "ByteArray", value: "main"}],
                // [{type: "ByteArray", value: "xwdn5r6zgrzhd5qn2ws259lqjmbye16148pk47k394omlkhs"}],
                // [{type: "ByteArray", value: "REQUESTING DAOS LIST"}],
                [],
                []
            ],
            "jsonrpc": "2.0",
            "id": 1234,
            "method": "invokefunction"
        }

    // Trying direct approach.
    xhrPost_promise(lookupRpcUrl(), postDataObj)
        .then(progressEvent => {

            try {
                const aryDaoSummaryObjs = decodeDaoSummaryListFromRpc(progressEvent);

                let strHtml = `<p>(No DAOs have been created yet.)</p>`;

                if (aryDaoSummaryObjs.length > 0) {
                    console.info('------------------------------------------------');
                    console.info(`${errPrefix}Successful response JSON RPC.`);
                    console.info(errPrefix + `aryDaoSummaryObjs object:`);
                    console.dir(aryDaoSummaryObjs, {depth: null, colors: true});

                    strHtml = "<li>";

                    for (let ndx = 0; ndx < aryDaoSummaryObjs.length; ndx++) {
                        let displayObj = aryDaoSummaryObjs[ndx];
                        displayObj.daoDetailsUrl = `/dao-details?dao_guid=${displayObj.id}`;
                        const strOneLineHtml = g_ListDaosHandlebarsTemplate(displayObj);
                        strHtml += strOneLineHtml;
                    }

                    strHtml += "</li>";

                } else {
                    console.info(`${errPrefix}The results are empty.`)
                }

                $(`#daos-list-div-id`).html(strHtml);
            }
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
    let errPrefix = '(list-daos-page-support) ';

    console.info(`In Document ready handler.`)

    // Get the page URL arguments.
    const urlArgs = getUrlArguments();

    // Sample Click handler.
    $('#reorder-page-link-a').click(
        function() {
            return false;
        }
    );

    g_GlobalNamespaces.instance.initializeGlobals_promise(true, fetchAssetPriceAndCreateForm_subprop);

    /*
    // onbeforeunload event handler for the page.
    window.onbeforeunload =
        function (e) {
            // console.log(e.stringify());
            // Don't show the page exit confirmation dialog if the Submit button was
            //  the reason we are leaving the page.
            if (!gSubmitButtonCalling)
                return "Did you save any changes you made?";
        }

     */

    // Compile the handlebars templates we use for later use.
    g_ListDaosHandlebarsTemplate = Handlebars.compile($('#list-dao-handlebars-template').html());

    // Initialize the help system.
    initializeHelpSystem();

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
