// This file contains the Javascript code that supports the submit proposal page (DAO).

// TEST DATA FOR TESTING THE CODE THAT INTERFACES WITH THE GREENFINCH API.

const g_IsGreenfinchTest = false;

const g_IsVerboseDebugging = false;

const DEFAULT_APPLICANT = '';
const MAX_SHARES_REQUESTED = 1000000; // The maximum number of shares tokenss a proposer may request.
const MAX_LOOT_REQUESTED = 1000000; // The maximum number of loot tokens a proposer may request.
const MAX_TRIBUTE_OFFERED = 1000000; // The maximum number of tribute tokens that may be offered with a proposal
const MIN_DESCRIPTION_LENGTH = 10; // The minimum description length for a proposal.

const g_GreenfinchSampleData =
    [{"id":"","Type":"","size":0,"BasicAcl":0,"ExtendedAcl":{"version":{"major":0,"minor":0},"containerID":null,"records":[]},"attributes":null,"errors":null,"ParentID":"","children":[{"id":"6f8SCS75JazQD9gRQ2A6AJLta56hy9hj4eLLUbyCyJsf","Type":"object","size":11,"BasicAcl":0,"ExtendedAcl":{"version":{"major":0,"minor":0},"containerID":null,"records":[]},"attributes":{"FileName":"C:\\Users\\rober\\Documents\\NEO\\GreenFinch\\TEST-FILES\\TEST-FILE-3.txt","Timestamp":"1651211086","X_EXT":"txt"},"errors":null,"ParentID":"EVch4VTLHnUJFvLhrkfacsNwn6MQraZbopXzqKseV9wA","children":null,"PendingDeleted":false},{"id":"6fLHfCJYu21imvUeyEf9oHQEX6MwPfkYLJDvGCPpvpKe","Type":"object","size":11,"BasicAcl":0,"ExtendedAcl":{"version":{"major":0,"minor":0},"containerID":null,"records":[]},"attributes":{"FileName":"C:\\Users\\rober\\Documents\\NEO\\GreenFinch\\TEST-FILES\\TEST-FILE-5.txt","Timestamp":"1651212501","X_EXT":"txt"},"errors":null,"ParentID":"EVch4VTLHnUJFvLhrkfacsNwn6MQraZbopXzqKseV9wA","children":null,"PendingDeleted":false},{"id":"BHgmpaQLTaRX5rT9oano9c4rNQZwGjd9JjkAqhVMENwE","Type":"object","size":12,"BasicAcl":0,"ExtendedAcl":{"version":{"major":0,"minor":0},"containerID":null,"records":[]},"attributes":{"FileName":"C:\\Users\\rober\\Documents\\NEO\\GreenFinch\\TEST-FILES\\TEST-FILE-6.txt","Timestamp":"1651213154"},"errors":null,"ParentID":"EVch4VTLHnUJFvLhrkfacsNwn6MQraZbopXzqKseV9wA","children":null,"PendingDeleted":false},{"id":"294DxBy4egYwbqmmDeWgGFu7r1uNLQjBfuiY1793cAjU","Type":"object","size":30,"BasicAcl":0,"ExtendedAcl":{"version":{"major":0,"minor":0},"containerID":null,"records":[]},"attributes":{"FileName":"C:\\Users\\rober\\Documents\\NEO\\GreenFinch\\TEST-FILES\\TEST-FILE-1.txt","Timestamp":"1651173756","X_EXT":"txt"},"errors":null,"ParentID":"EVch4VTLHnUJFvLhrkfacsNwn6MQraZbopXzqKseV9wA","children":null,"PendingDeleted":false},{"id":"33eQEYhNy9x3ePbbQgCDTgLVvfY4aDzhqWwj6t9V23Rk","Type":"object","size":11,"BasicAcl":0,"ExtendedAcl":{"version":{"major":0,"minor":0},"containerID":null,"records":[]},"attributes":{"FileName":"C:\\Users\\rober\\Documents\\NEO\\GreenFinch\\TEST-FILES\\TEST-FILE-4.txt","Timestamp":"1651211939","X_EXT":"txt"},"errors":null,"ParentID":"EVch4VTLHnUJFvLhrkfacsNwn6MQraZbopXzqKseV9wA","children":null,"PendingDeleted":false},{"id":"4DbBKPW8E8rgeVx7v9DS2yxgYyGr2g3qJJiiYpb9nekh","Type":"object","size":30,"BasicAcl":0,"ExtendedAcl":{"version":{"major":0,"minor":0},"containerID":null,"records":[]},"attributes":{"FileName":"C:\\Users\\rober\\Documents\\NEO\\GreenFinch\\TEST-FILES\\TEST-FILE-1-download-from-neofs.txt","Timestamp":"1651175601","X_EXT":"txt"},"errors":null,"ParentID":"EVch4VTLHnUJFvLhrkfacsNwn6MQraZbopXzqKseV9wA","children":null,"PendingDeleted":false}],"PendingDeleted":false}];

// Create an instance of a Greenfinch file box because we want to know
//  when the user has uploaded new assets to NeoFS using Greenfinch.
//  We pass the NeoFsFileBox constructor the DOM element ID
//  where we want the new NeoFS file assets to be rendered.
let g_GreenfinchFileBox = new NeoFsFileBox("neofs-file-box");

let bVerbose = false;

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

// The GUID of the DAO the proposal is being submitted to.
let g_DaoGuid = null;

// -------------------- BEGIN: DEFAULT PROPOSAL SETTINGS ------------

// -------------------- END  : DEFAULT PROPOSAL SETTINGS ------------

// -------------------- BEGIN: PROPOSAL SETTINGS LIMITS ------------

// -------------------- END  : PROPOSAL SETTINGS LIMITS ------------

// Counts the number of Alpaca form updates.
let g_UpdateCounter = 0;

// Moved to global namespaces module.
// let g_CurrentAssetSymbol = null;

// Handlebars templates.  The document ready handler will initialize these variables.
// (none)

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

            // If the Alpaca form has not been created yet, do so now.
            if (!g_IsAlpacaForObjCreated) {
                createAlpacaForm_subprop(g_CurrentAssetSymbol, 0);
                g_IsAlpacaForObjCreated = true;
            } else {
                // Update the Alpaca form field that will trigger any Alpaca
                //  controls dependent on it.
                const control = $(g_AlpacaFormObjId_selector).alpaca("get");
                // control.getControlEl().css("border", "5px blue solid");
                g_UpdateCounter++;
                control.childrenByPropertyId['triggerUpdateCounter'].setValue(g_UpdateCounter);
            }
        })
        .catch(err => {
            // Log the error message to the console.
            let errMsg =
                errPrefix + misc_shared_lib.conformErrorObjectMsg(err);

            console.error(errMsg);
        });
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
function createAlpacaForm_subprop(currentAssetSymbol) {
    let errPrefix = `(createAlpacaForm_subprop) `;

    if (misc_shared_lib.isEmptySafeString(currentAssetSymbol))
        throw new Error(errPrefix + `The currentAssetSymbol parameter is empty.`);

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

    // The default proposal time is now.
    let defaultProposalSubmissionTime = Date.now();

    // Data source for the depositToken field, that
    //  returns the currently selected asset symbol.
    const dataSrcCryptoSymbol = function(callback) {
        // const value = this.observable("/city").get();
        // callback(teamsMap[value]);

        callback(g_CurrentAssetSymbol);
    };

    // CREATE PROPOSAL FORM FIELD DECLARATION (Alpaca Forms)
    $(g_AlpacaDivId_selector).alpaca(
        {
            // Field names, initial values.
            "data": {
                "applicant": DEFAULT_APPLICANT,  // For membership proposals.  The address of the person to be added to the DAO.
                "sharesRequested": 0, // The number of NEO tokens requested by the proposal.
                "lootRequested": 0, // The number of GAS tokens requested by the proposal.
                "tributeOffered": 0,  // We are using GAS for tributes.
                "paymentRequested": 0,  // We are using GAS for payment requests.
                "details": '(Put proposal details here)', // A description of the proposal.

                "startingPeriod": 0,

                // Hidden fields.
                "daoGuid": g_DaoGuid,

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
                "title": "Submit Proposal",
                "description": "Submit a proposal to this DAO",
                "type": "object",
                // Field definitions.
                "properties": {
                    "details": {
                        "type": "string",
                        "title": `Proposal description.  Must be at least ${MIN_DESCRIPTION_LENGTH} characters in length`,
                        "required": true,
                    },
                    "applicant": {
                        "type": "string",
                        "title": "Applicant Address.  For membership applications only.",
                        "required": false,
                    },
                    "sharesRequested": {
                        "type": "number",
                        "title": "The number of NEO tokens requested.",
                        "required": true,
                    },
                    "lootRequested": {
                        "type": "number",
                        "title": "The number of GAS tokens requested.",
                        "required": true,
                    },
                    "paymentRequested": {
                        "type": "number",
                        "title": "Number of GAS tokens requested for paying non-members.",
                        "required": true,
                    },
                    "tributeOffered": {
                        "type": "number",
                        "title": "Tribute amount, in GAS tokens.",
                        "required": true,
                    },
                    // AUTOMATICALLY DERIVED FIELDS (HIDDEN).

                    // We need to carry the GUID of the DAO this
                    //  proposal is being submitted to.
                    "daoGuid": {
                        "type": "string",
                        "title": "Dao GUID",
                        "required": true,
                        "hidden": true,
                    },
                    /*
                    // AUTOMATICALLY DERIVED FIELDS (HIDDEN).
                    "triggerUpdateCounter": {
                        "title": "TRIGGER UPDATE CONTAINER",
                        "required": true,
                        "hidden": true,
                    }

                     */
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
                    let aryErrMsg = [];
                    const strDetails = getAlpacaFieldValue(this, "details");

                    if (strDetails.trim().length < MIN_DESCRIPTION_LENGTH)
                        aryErrMsg.push(`The proposal description must be at least ${MIN_DESCRIPTION_LENGTH} characters in length.`)

                    // Derive the expiration date/time delta value by
                    // Update the hidden expiration date/time delta field.
                    // setAlpacaFieldValue(this, "expirationDateTimeDelta", expirationDateTimeDelta);

                    // Any errors?
                    if (aryErrMsg.length > 0) {
                        let errMsg = null;

                        // Yes.  Build an appropriate error message.
                        if (aryErrMsg.length <= 1)
                            errMsg = aryErrMsg[0];
                        else
                            errMsg = `Please fix the following errors first: \n` + aryErrMsg.join('\n');

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
                    /*  The applicant field may be empty.
                    "applicant": {
                        "validator": function(callback) {
                            validateStringField_basic(this, callback, this.getTitle());
                        }
                    },
                     */
                    "sharesRequested": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 0, MAX_SHARES_REQUESTED, false);
                        }
                    },
                    "lootRequested": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 0, MAX_LOOT_REQUESTED, false);
                        }
                    },
                    "paymentRequested": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 0, MAX_LOOT_REQUESTED, false);
                        }
                    },
                    "tributeOffered": {
                        "validator": function(callback) {
                            validateRangeBoundNumericField(this, callback, this.getTitle(), 0, MAX_TRIBUTE_OFFERED, false);
                        }
                    },
                    // TODO: Fix this problem after the hackathon.
                    /*
                    ROS: Because this is the last field, we can't
                    seem to find a way to clear the error condition
                    since that usually gets cleared when the edit
                    box loses focus.  Disabling for now and letting
                    the top level validation handler check for that
                    error condition.
                    "details": {
                        "validator": function(callback) {
                            validateStringField_basic(this, callback, this.getTitle(), MIN_DESCRIPTION_LENGTH);
                        }
                    },
                     */

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
                            "title": "Submit Proposal",
                            "id": g_AlpacaSubmitButtonId,
                            "click": function(a, b, c) {
                                const formDataObj = this.getValue();

                                if (this.isValid(true)) {
                                    // Grab the NeoFS assets from the NeoFsFileBox and
                                    //  add them to the form object.
                                    formDataObj.neofsCompoundIdPairs = g_GreenfinchFileBox.getAssetNeoFsIdPairs();

                                    g_NeoLineHelper.instance.submitProposal_promise(formDataObj);

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
                "helper": "Submit a new proposal",
                /*
                Can't get TEXTAREA to work yet.  Doesn't show on page.
                // ROS: Textarea's are handled differently, being declared
                //  in the "options" block and not the "schema" block.
                "details": {
                    "type": "textarea",
                    "label": "Description.  Describe your proposal here.",
                },
                 */
            },
            "postRender": function(control) {
                /*
                const fldTriggerUpdateCounter = control.childrenByPropertyId["triggerUpdateCounter"];

                // When fldTriggerUpdateCounter field changes, execute this code.
                fldTriggerUpdateCounter.on("change", function() {
                    // fldlDepositTokenSymbol.refresh();
                })

                // when the "validated" even is raised, enable the submit button
                control.on("validated", function(e) {
                    $(g_AlpacaSubmitButtonId_selector).prop("disabled", false);
                });
                 */
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

// Document ready handler.
$(document).ready(function (){
    let errPrefix = '(submit-proposal-page-support) ';

    // Get the page URL arguments.
    const urlArgs = getUrlArguments();

    // We must have a DAO GUID.
    g_DaoGuid = urlArgs["dao_guid"];

    if (!g_DaoGuid) {
        alert("The query URL is missing a valid DAO GUID.  Therefore, this form is not operational.");
        return;
    }

    // Click handler for CREATE PROPOSAL button.
    /*
    $('#create-new-proposal-btn').click(
        function() {
            // Navigate to the submit proposal page with the
            //  current GUID.

            return false;
        }
    );
     */

    // onbeforeunload event handler for the page.
    window.onbeforeunload =
        function (e) {
            // console.log(e.stringify());
            // Don't show the page exit confirmation dialog if the Submit button was
            //  the reason we are leaving the page.
            if (!gSubmitButtonCalling)
                return "Did you save any changes you made?";
        }

    // Initialize the help system.
    initializeHelpSystem();

    // Initialize the Greenfinch file box.
    g_GreenfinchFileBox.callFromDocumentReadyHandler();

    // Create the Alpaca form.
    createAlpacaForm_subprop(g_CurrentAssetSymbol);
    g_IsAlpacaForObjCreated = true;

    // Put this last in case it fails.
    // g_GlobalNamespaces.instance.initializeGlobals_promise(true, fetchAssetPriceAndCreateForm_subprop);
});

