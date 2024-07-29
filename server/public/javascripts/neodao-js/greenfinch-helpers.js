/**
 * This module contains the code for integrating with the  Greenfinch integration API.
 *
 * IMPORTANT:
 *
 *  You must call g_GreenfinchHelperObj.callFromDocumentReadyHandler()
 *  from your web page document ready handler!
 *
 * Also, this code is reliant on the Handlebars package.  Make sure you
 *  include it in your web page Javascript.
*/

// The DOM element ID of the default Handlebars template for rendering
//  Greenfinch a file asset result.
const DEFAULT_HANDLEBARS_TEMPLATE_NEOFS_FILE_ASSET = "neofs-recent-upload-template";

// The default port number to access the Greenfinch API.
const DEFAULT_GREENFINCH_API_PORT_NUMBER = 43520;

// The DOM element ID for the CLEAR button we dynamically create for the NeoFS
//  file box.
const DOM_ELEMENT_ID_NEOFS_FLE_BOX = "clear-neofs-file-box";

// A jQuery selector that selects the CLEAR button we dynamically create for the NeoFS
//  file box.
const g_ClearNeoFsButton_selector = "#" + DOM_ELEMENT_ID_NEOFS_FLE_BOX;

// The base URL for NeoFS on the TestNet.

// This is for the gateway.
const NEOFS_BASE_URL_TESTNET_GATEWAY = "https://http.testnet.fs.neo.org";

// This is direct to the NeoFS TestNet instance.  Doesn't always work for us
//  while the above does.
const NEOFS_BASE_URL_TESTNET = "https://testcdn.fs.neo.org";

/**
 * This object contains the content of a Greenfinch recent
 *  uploads API result object.
 *
 * @constructor
 */
function NeoFsRecentUpload() {
    const self = this;
    const methodName = self.constructor.name + '::' + `constructor`;
    const errPrefix = '(' + methodName + ') ';

    /** @property {string} - A randomly generated unique ID for this object. */
    this.id = misc_shared_lib.getSimplifiedUuid();

    /** @property {Date} - The date/time this object was created. */
    this.dtCreated = Date.now();

    // -------------------- BEGIN: SUMMARY FIELDS ------------

    // These fields make the most important fields in a NeoFS
    //  recent uploads API result object easily accessible.

    /** @property {string} - The container ID for the container
     *   this NeoFS asset belongs to. */
    this.containerId = null;

    /** @property {string} - The object ID for this NeoFS asset. */
    this.objectId = null;

    /** @property {string} - The primary file name of the original
     *  file that was the source of the NeoFS asset. */
    this.primaryFilename = null;

    /** @property {number} - The NeoFS timestamp for the asset.
     *  Format is Unix timestamp format (JS format div 1000).
     */
    this.timestamp = null;

    /** @property {string} - The container and object ID
     *  concatenated together.  This property exists
     *  to service a handlebars template. */
    this.compoundId = null;

    /** @property {string} - The timestamp as a human
     *  friendly string.  This property exists
     *  to service a handlebars template. */
    this.timestampAsDateStr = null;

    /** @property {string} - The URL that leads to the
     *  the asset on NeoFS. */
    this.neoFsUrl = null;

    // -------------------- END  : SUMMARY FIELDS ------------

    /**
     * Returns a string that concatenates the asset's container
     *  id and object ID.
     *
     * @param {boolean} bAppendPrimaryFilename - If TRUE,
     *  the Base64 encoded filename will be appended to
     *  the returned string.  If FALSE, it won't.
     *
     * @param {boolean} bBase64EncodeFilename - If TRUE,
     *  the primary filename is Base64 encoded
     *  to avoid serialization issues when storing
     *  the returned string in a smart contract.
     *  This value has no effect if bAppendPrimaryFilename
     *  is FALSE.
     *
     * @return {string}
     */
    this.buildCompoundId = function(bAppendPrimaryFilename=true, bBase64EncodeFilename=true) {
        const methodName = self.constructor.name + '::' + `buildCompoundId`;
        const errPrefix = '(' + methodName + ') ';

        if (typeof bAppendPrimaryFilename !== 'boolean')
        	throw new Error(`${errPrefix}The value in the bAppendPrimaryFilename parameter is not boolean.`);
        if (typeof bBase64EncodeFilename !== 'boolean')
        	throw new Error(`${errPrefix}The value in the bBase64EncodeFilename parameter is not boolean.`);

        let strRet = `${self.containerId}:${self.objectId}`;

        if (bAppendPrimaryFilename) {
            let useFilename = self.primaryFilename;

            if (bBase64EncodeFilename)
                useFilename = btoa(useFilename);

            strRet += `:${useFilename}`;
        }

        return strRet;
    }

    /**
     * Returns a string that represents our timestamp
     *  in a human friendly string.
     *
     * @return {string}
     */
    this.buildTimestampDateAsStr = function() {
        return self.timestampAsDate().toString();
    }

    /**
     * Return the NeoFS asset's timestamp as a Javascript Date()
     *  object.
     *
     * @return {Date}
     */
    this.timestampAsDate = function() {
        return new Date(self.timestamp * 1000);
    }


    /**
     * Returns a string representation of this object's content.
     *
     * @return {string}
     */
    this.toString = function() {
        const strDate = self.timestampAsDate().toString();

        return `name: ${self.primaryFilename}, ID: ${self.containerId}:${self.objectId}, date: ${strDate}.`;
    }

    /**
     * Returns a string representation of this object's content.
     *
     * @return {string}
     *
    this.toHtml = function() {
        const strDate = self.timestampAsDate().toString();

        return `name: ${self.primaryFilename}, ID: ${self.containerId}:${self.objectId}, date: ${strDate}.`;
    }
    */
}

/**
 * Return the base URL to NeoFS depending on whether or
 *  not we want to target the MainNet or TestNet.
 *
 * @return {string}
 */
function getNeoFsBaseUrl() {
    return NEOFS_BASE_URL_TESTNET_GATEWAY;
}

/**
 * Builds a NeoFS URL that will retrieve the asset whose
 *  container and object ID are given.
 *
 * @param {string} containerId - The ID of the
 *  asset's container.
 * @param {string} objectId - The object's ID.
 *
 * @return {string}
 */
function buildNeoFsUrl(containerId, objectId) {
    const errPrefix = `(buildNeoFsUrl) `;

    if (misc_shared_lib.isEmptySafeString(containerId))
        throw new Error(`${errPrefix}The containerId parameter is empty.`);
    if (misc_shared_lib.isEmptySafeString(objectId))
        throw new Error(`${errPrefix}The objectId parameter is empty.`);

    return `${getNeoFsBaseUrl()}/${containerId}/${objectId}`;
}

/**
 * Parse a result object from the Greenfinch recent uploads API
 *  call into one of our NeoFsRecentUpload objects.
 *
 * @param {object} srcGreenfinchResultObj - A Greenfinch
 *  recent uploads API result object.
 *
 * @constructor
 */
NeoFsRecentUpload.Parse = function(srcGreenfinchResultObj) {
    const errPrefix = `(GreenfinchRecentUpload.Parse) `;

    if (!misc_shared_lib.isNonNullObjectAndNotArray(srcGreenfinchResultObj))
        throw new Error(`${errPrefix}The srcGreenfincResultObj is not a valid object.`);

    let retObj = new NeoFsRecentUpload();

    retObj.srcGreenfinchResultObj = srcGreenfinchResultObj;
    retObj.containerId = srcGreenfinchResultObj.ParentID;
    retObj.objectId = srcGreenfinchResultObj.id;
    retObj.primaryFilename = srcGreenfinchResultObj.attributes.FileName;
    retObj.timestamp = srcGreenfinchResultObj.attributes.Timestamp;

    retObj.compoundId = retObj.buildCompoundId();
    retObj.timestampAsDateStr = retObj.buildTimestampDateAsStr();

    // Build the URL that can access the NeoF object.
    retObj.neoFsUrl = buildNeoFsUrl(retObj.containerId, retObj.objectId);

    return retObj;
}

/**
 * This object creates a Greenfinch aware file list box on
 *  your web page.  In your document ready event handler,
 *  create an instance of this object and keep a reference
 *  to it in a page level variable.
 *
 *  Example:
 *
 *      From your web page Javascript:
 *
 *          const mainFileBox = new NeoFsFileBox("neofs-file-box-div")
 *
 *     And, somewhere in your web page HTML:
 *
 *          <div id="neofs-file-box-div"></div>s
 *
 * @param {string} hostDivDomId - The DOM element ID of the
 *  DIV on your web page that will be the host for the
 *  content rendered by this object.
 * @param {number|null} [greenfinchPortNumber] - The port number
 *  for the Greenfinch API.  This is the port number
 *  that Greenfinch is listening on for requests. If
 *  this value is not provided or is NULL, then the default
 *  port number for Greenfinch will be used.
 *
 * @constructor
 */
function NeoFsFileBox(hostDivDomId, greenfinchPortNumber=null) {
    const self = this;
    const methodName = self.constructor.name + '::' + `constructor`;
    const errPrefix = '(' + methodName + ') ';

    /** @property {string} - A randomly generated unique ID for this object. */
    this.id = misc_shared_lib.getSimplifiedUuid();

    /** @property {Date} - The date/time this object was created. */
    this.dtCreated = Date.now();

    /** @property {string} - The DOM element ID of the DIV that we
     *   we will render our content into. */
    this.hostDivId = null;

    /** @property {string} - The jQuery selector to the DIV that we
     *   we will render our content into. */
    this.hostDiv_selector = null;

    /** @property {number} - The port number for accessing the Greenfinch
     *   API. */
    this.greenfinchApiPortNumber = DEFAULT_GREENFINCH_API_PORT_NUMBER;

    /** @property {string} - The jQuery selector that leads to the
     *   DOM element containig the Handlebars template for rendering
     *   a Greenfinch file asset result. */
    this.handlebarsTemplateSelector = `#${DEFAULT_HANDLEBARS_TEMPLATE_NEOFS_FILE_ASSET}`;

    /** @property {object} - After callFromDocumentReadyHandler()
     *  is called, this object will contain a compiled Handlebars
     *  template object that renders a Greenfinch recent upload
     *  object to block of HTML good for summary lists. */
    this.recentUploadSummaryHtml_template = null;

    /** @property {Date} - The date the last time the Greenfinch
     *   API was accessed.  Greenfinch will only return file
     *   results newer than this date. We initialize the
     *   "since" value to now, so that we only show files
     *   that are newly uploaded.
     */
    this.since = new Date();

    /** @property {boolean} - If TRUE, then verbose debugging
     *  output will be enabled.  If FALSE, then not. */
    this.IsVerboseDebugging = false;


    /** @property {array<NeoFsRecentUpload>} - An array of
     *   NeoFsRecentUpload objects containing the most recent
     *   upload results received from the Greenfinch PAI.s */
    this.aryNewUploads = [];

    /** @property {number} - All objects in the new uploads
     *   array FROM this index and upwards are considered
     *   new uploads. */
    this.ndxStartOfNewUploads = 0;

    /** @property {number|null} - When the user clears the
     *   contents of the recent uploads box, we
     *   note the size of the array so we don't
     *   show them the elements they cleared. */
    this.ndxSinceLastEraseOperation = null;

    /**
     * Build the full URL to get to the Greenfinch API using the
     *  currently set port number and "since" value.
     */
    this.buildGreenFinchApiUrl = function () {
        const methodName = self.constructor.name + '::' + `buildGreenFinchApiUrl`;
        const errPrefix = '(' + methodName + ') ';

        // TODO: The "since" value strategy is not working well
        //  so for now we have shifted to an array based
        //  approach.  That is why we always pass "0"
        //  for the "since" value.
        //s
        // Convert the Javascript date to a Unix timestamp.
        // const sinceVal = Math.floor(self.since.getTime() / 1000);
        const sinceVal = 0;

        const urlToGreenfinch = `http://localhost:${self.greenfinchApiPortNumber}/api/v1/readonly?since=${sinceVal}`;

        return urlToGreenfinch
    }

    /**
     * Builds a comma delimited list of NeoFS compound ID pairs and
     *  returns it.
     *
     * @param {boolean} bAppendPrimaryFilename - If TRUE,
     *  the Base64 encoded filename will be appended to
     *  the returned string.  If FALSE, it won't.
     * @param {boolean} bBase64EncodeFilename - If TRUE,
     *  the primary filename is Base64 encoded
     *  to avoid serialization issues when storing
     *  the returned string in a smart contract.
     *  This value has no effect if bAppendPrimaryFilename
     *  is FALSE.
     *
     * NOTE: Base64 encoding file names is recommended
     *  when storing the returned string in a smart
     *  contract, to avoid potential serialization issues
     *  when storing the returned string in a smart contract.
     *
     * @return {string}
     */
    this.getAssetNeoFsIdPairs = function(bAppendPrimaryFilename=true, bBase64EncodeFilename=true) {
        const methodName = self.constructor.name + '::' + `getAssetNeoFsIdPairs`;
        const errPrefix = '(' + methodName + ') ';

        if (typeof bAppendPrimaryFilename !== 'boolean')
        	throw new Error(`${errPrefix}The value in the bAppendPrimaryFilename parameter is not boolean.`);

        // Do we have any new uploads?
        let lastAryNdx = self.aryNewUploads.length - 1;
        const ndxOfLastEraseOperation = self.ndxSinceLastEraseOperation === null ? 0 : self.ndxSinceLastEraseOperation;
        const numNewUploads = (lastAryNdx - ndxOfLastEraseOperation) + 1;

        const aryCompoundIdPairs = [];

        if (numNewUploads > 0) {
            // Yes.  Return a comma delimited list of NeoFS compound ID pairs,
            //  one for each new upload.
            for (let ndx = ndxOfLastEraseOperation; ndx < self.aryNewUploads.length; ndx++) {
                const greenfinchResponseObj = self.aryNewUploads[ndx];

                if (!misc_shared_lib.isNonNullObjectAndNotArray(greenfinchResponseObj))
                    throw new Error(`${errPrefix}The greenfinchResponseObj at index(${ndx}) is not a valid object.`);

                const strCompoundId = greenfinchResponseObj.buildCompoundId(bAppendPrimaryFilename, bBase64EncodeFilename);
                aryCompoundIdPairs.push(strCompoundId);
            }

            const strCompoundIdsList = aryCompoundIdPairs.join(", ");
            return strCompoundIdsList;
        } else {
            // No.  Return an empty string.
            return "";
        }
    }

    /**
     * This function extracts the Greenfinch recent uploads array
     *  from an Ajax call to that API.
     *
     * @param {Object} progressResponse - A progressEvent object received
     *  from an AJAX request to the Greenfinch asset search API.
     *
     * @returns {Array<Object>|null} - If a valid Ghostmarket asset
     *  search results object is found in the progressEvent object,
     *  it is returned.  Otherwise NULL is returned.
     */
    this.extractGreenfinchResultsArray = function(progressResponse) {
        const methodName = self.constructor.name + '::' + `extractGreenfinchResultsArray`;
        const errPrefix = '(' + methodName + ') ';

        if (!misc_shared_lib.isNonNullObjectAndNotArray(progressResponse))
            return null;

        if (!('currentTarget' in progressResponse))
            return null;
        if (!('response' in progressResponse.currentTarget))
            return null;
        if (!Array.isArray(progressResponse.currentTarget.response))
            return null;
        if (!('children' in progressResponse.currentTarget.response[0]))
            return null;
        if (!Array.isArray(progressResponse.currentTarget.response[0].children))
            return null;

        return progressResponse.currentTarget.response[0].children;
    }

    /**
     * Given a Greenfinch API response object, return an array
     *  of summary objects that contain the salient fields of the
     *  original arrays entries.  The original source element is
     *  attached to the summary for reference purposes.
     *
     * @param {array<object>} aryNewUploads - The array of recent uploads returned
     *  by the Greenfinch API.
     * @param {boolean} bSortByTimestamp - If TRUE, the array will
     *  be returned sorted by their timestamps, oldest objects
     *  first.  If not, then will be returned in the order we
     *  received them from the Greenfinch API.
     *
     * @return {array<NeoFsRecentUpload>} - Returns an array
     *  NeoFsRecentUpload objects, one for each new upload.
     */
    this.greenfinchApiResultToRecentUploadObjs = function(aryNewUploads, bSortByTimestamp=true) {
        const methodName = self.constructor.name + '::' + `greenfinchApiResultToRecentUploadObjs`;
        const errPrefix = '(' + methodName + ') ';

        if (!Array.isArray(aryNewUploads))
            throw new Error(`${errPrefix}The aryNewUploads parameter value is not an array.`);
        if (typeof bSortByTimestamp !== 'boolean')
        	throw new Error(`${errPrefix}The value in the bSortByTimestamp parameter is not boolean.`);

        const aryGreenfinchSummaryObjs = [];

        for (let ndx = 0; ndx < aryNewUploads.length; ndx++) {
            const greenfinchResponseObj = aryNewUploads[ndx];

            if (!misc_shared_lib.isNonNullObjectAndNotArray(greenfinchResponseObj))
                throw new Error(`${errPrefix}The greenfinchResponseObj at index(${ndx}) is not a valid object.`);

            const summaryObj = NeoFsRecentUpload.Parse(greenfinchResponseObj);

            aryGreenfinchSummaryObjs.push(summaryObj);
        }

        // Timestamp sorting desired?
        if (bSortByTimestamp) {
            // Yes. Sort the array.
            aryGreenfinchSummaryObjs.sort(function(a, b)
            {
                return a.timestamp - b.timestamp;
            });
        }

        return aryGreenfinchSummaryObjs;
    }

    /**
     * Render the HTML snippet for a recent upload.
     *
     * @param {NeoFsRecentUpload} recentUploadObj - The NeoFS recent
     *  upload object.
     *
     * @return {string} - Returns a block of HTML that displays the
     *  salient fields in a NeoFS recent upload object.
     */
    this.renderRecentUploadSummaryHtml = function(recentUploadObj) {
        const methodName = self.constructor.name + '::' + `renderRecentUploadSummaryHtml`;
        const errPrefix = '(' + methodName + ') ';

        if (!(recentUploadObj instanceof NeoFsRecentUpload))
            throw new Error(`${errPrefix}The value in the recentUploadObj parameter is not a GreenfinchRecentUpload object.`);

        return self.recentUploadSummaryHtml_template(recentUploadObj);
    }

    /**
     * This function puts a waiting message into the host DIV.  Use
     *  it when we the new uploads array is empty or the user just
     *  "cleared" the Greenfinch file box.
     */
    this.showWaitingMessage = function() {
        const methodName = self.constructor.name + '::' + `showWaitingMessage`;
        const errPrefix = '(' + methodName + ') ';

        const strWaitingHtml = 'Please upload your proposal asset files to NeoFS using Greenfinch now.  Waiting...';

        $(self.hostDiv_selector).html(strWaitingHtml);
    }

    /**
     * This is the handler for the CLEAR button we dynamically add
     *  to the host DIV, to "clear" the recent uploads from the
     *  host DIV.
     */
    this.clearFileBox = function() {
        const methodName = self.constructor.name + '::' + `clearFileBox`;
        const errPrefix = '(' + methodName + ') ';

        // Reset the index that decides what new content should be
        //  shown to the user so we don't show them anymore the
        //  content they just "cleared".  Set the index to the
        //  index of the last element in the new uploads array.
        //  Any content in that array after that index will be
        //  considered new uploads.
        self.ndxSinceLastEraseOperation = self.aryNewUploads.length > 0 ? self.aryNewUploads.length - 1 : null;

        // Clear out the host DIV too.
        self.showWaitingMessage();
    }


    /**
     * This is the interval function that calls the Greenfinch API
     *  to get a list of the most recent uploads to NeoFS.
     */
    this.updateRecentUploadsList = function() {
        const methodName = self.constructor.name + '::' + `updateRecentUploadsList`;
        const errPrefix = '(' + methodName + ') ';

        try {
            self.fetchRecentGreenfinchUploads_promise()
                .then(progressResponse => {
                    const aryRawNewUploads = self.extractGreenfinchResultsArray(progressResponse);

                    if (aryRawNewUploads === null && self.ndxStartOfNewUploads === 0) {
                        // No new uploads.  Show the waiting for new uploads message.
                        self.showWaitingMessage();
                    } else {
                        // throw new Error(`${errPrefix}The value in the result parameter for the fetchRecentGreenfinchUploads_promise() call is not a valid Greenfinch API result.`);

                        const aryGreenfinchRecentUploadObjs = self.greenfinchApiResultToRecentUploadObjs(aryRawNewUploads);

                        // Does the new uploads list from Greenfinch have more records then we have?
                        if (aryGreenfinchRecentUploadObjs.length > self.aryNewUploads.length) {
                            // Rebuild the rendered content, but exclude any content the
                            //  user already cleared from the new uploads list.
                            // self.ndxStartOfNewUploads = self.aryNewUploads.length;

                            // Replace the current new uploads array contents.
                            self.aryNewUploads = [];

                            // Append these to our array of new uploads.
                            for (let ndx = 0; ndx < aryGreenfinchRecentUploadObjs.length; ndx++) {
                                const newUploadObj = aryGreenfinchRecentUploadObjs[ndx];

                                if (!(newUploadObj instanceof NeoFsRecentUpload))
                                    throw new Error(`${errPrefix}The value at array element (${ndx}) is not a GreenfinchRecentUpload object.`);

                                self.aryNewUploads.push(newUploadObj);
                            }

                            // Determine how many new uploads need to be rendered to the
                            //  host DIV. (i.e. - need to be shown to the user on the web page).
                            const lastAryNdx = self.aryNewUploads.length - 1;

                            let numNewUploadsToDisplay = self.aryNewUploads.length;

                            if (self.ndxSinceLastEraseOperation !== null)
                                // The user recently "cleared" the Greenfinch file box.
                                //  Don't show old content.
                                numNewUploadsToDisplay = lastAryNdx - self.ndxSinceLastEraseOperation;

                            if (numNewUploadsToDisplay > 0) {
                                if (self.IsVerboseDebugging) {
                                    console.warn(`${errPrefix}Number of new uploads detected: ${numNewUploadsToDisplay}`);
                                }

                                let strNewUploadsHtml = '\n';

                                // Start at the first new upload after the last one that was erased.
                                //  If no erase operation ever happened, start at index 0.
                                const nextAryNdx = self.ndxSinceLastEraseOperation === null ? 0 :  self.ndxSinceLastEraseOperation + 1;

                                for (let ndx = nextAryNdx; ndx < aryGreenfinchRecentUploadObjs.length; ndx++) {
                                    const recentUploadObj = aryGreenfinchRecentUploadObjs[ndx];

                                    // Render the HTML for this new upload.
                                    const strHtmlOneObj =
                                        self.renderRecentUploadSummaryHtml(recentUploadObj);

                                    // Accumulate the HTML.
                                    strNewUploadsHtml += strHtmlOneObj;
                                }

                                strNewUploadsHtml += '\n';

                                // Add a CLEAR button.
                                strNewUploadsHtml +=
                                    `
                                    <div class="greenfinch-file-asset-result borderlist">
                                        <input class="greenfinch-button" id="${DOM_ELEMENT_ID_NEOFS_FLE_BOX}" type="submit" value="CLEAR">
                                    </div>
                                    `;

                                // Show the new uploads on the web page.
                                $(self.hostDiv_selector).html(strNewUploadsHtml);

                                // Set the click handler for the CLEAR button.
                                $(g_ClearNeoFsButton_selector).click(self.clearFileBox)
                            }
                        }

                        // TODO: "since" value is currently not used.  See notes above in the
                        //  self.buildGreenFinchApiUrl() function.
                        //
                        // Need to update the "since" value to the current time, for the next call,
                        //  so we don't get the same results back.
                        self.since = new Date();
                    }

                })
                .catch(err => {
                    // Log the error message.
                    let errMsg =
                        errPrefix + misc_shared_lib.conformErrorObjectMsg(err);

                    console.error(`${errMsg}`);
                });
        }
        catch(err) {
            // Convert the error to a promise rejection.
            let errMsg =
                errPrefix + conformErrorObjectMsg(err);

            reject(errMsg + ' - try/catch');
        }
    }

    /**
     * This promise resolves to the most recent results returned
     *  by a call to the Greenfinch recent uploads API.
     *
     * @return {Promise<object} - Returns a JSON object
     *  containing a list of the recent uploads to
     *  NeoFS made by the user using Greenfinch.
     */
    this.fetchRecentGreenfinchUploads_promise = function() {
        const methodName = self.constructor.name + '::' + `fetchRecentGreenfinchUploads_promise`;
        const errPrefix = '(' + methodName + ') ';

        return new Promise(function(resolve, reject) {
            try	{
                // TODO: Later, update the "since" parameter to the time we last
                //  made a call to the API.
                let sinceVal = 0;

                if (g_IsGreenfinchTest) {
                    // Just use the sample data instead of consulting the
                    //  Greenfinch API.
                    resolve(g_GreenfinchSampleData);
                } else {
                    // Get the latest NeoFS uploads from the Greenfinch API.
                    const greenfinchRequestUrl = self.buildGreenFinchApiUrl();

                    if (self.IsVerboseDebugging) {
                        console.log(`${errPrefix}Requesting assets from the Greenfinch recent uploads API using URL: ${greenfinchRequestUrl}`);
                    }

                    xhrGet_promise(greenfinchRequestUrl)
                        .then(result => {
                            if (self.IsVerboseDebugging) {
                                console.info(`${errPrefix}result of Greenfinch API request for a list of recently uploaded NeoFS assets: ${result}`);
                                console.info(errPrefix + `result object:`);
                                console.dir(result, {depth: null, colors: true});
                            }

                            resolve(result);
                        })
                        .catch(err => {
                            // Log the error to the console.
                            let errMsg =
                                errPrefix + conformErrorObjectMsg(err);

                            console.error(errMsg)
                        });
                }

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
     * This function MUST called to initialize certain objects
     *  that are used when interfacing with the Greenfinch APi(s).
     *
     * IMPORTANT: This function MUST be called from the host web
     *  page's document ready handler, since certain page elements
     *  mukst be fully rendered before this method is called.
     */
    this.callFromDocumentReadyHandler = function() {
        const methodName = self.constructor.name + '::' + `initializeGreenFinchHelper`;
        const errPrefix = '(' + methodName + ') ';

        // Make sure the default handlebars template for rendering each
        //  Greenfinch file result exists.
        if (!(document.getElementById(DEFAULT_HANDLEBARS_TEMPLATE_NEOFS_FILE_ASSET)))
            throw new Error(`${errPrefix}Unable to find the page element with the default Greenfinch handlebars template using DOM element ID: ${DEFAULT_HANDLEBARS_TEMPLATE_NEOFS_FILE_ASSET}`);

        try {
            // Make sure the DIV we will render our content into exists.
            if (!document.getElementById(hostDivDomId))
                throw new Error(`${errPrefix}Unable to find the host DIV element using DIV ID: ${hostDivDomId}`);

            // Save the value.
            this.hostDivId = hostDivDomId;
            this.hostDiv_selector = `#${this.hostDivId}`;

            // Compile the handlebars templates we use for later use.
            self.recentUploadSummaryHtml_template = Handlebars.compile($(self.handlebarsTemplateSelector).html());

            console.info(self.recentUploadSummaryHtml_template);

            // Start the interval function that keeps the file list
            //  box updated by polling the Greenfinch API
            //  periodically.
            setInterval(self.updateRecentUploadsList, 1000);
        } catch(err) {
            console.error(err);
        }
    }

    // ------------------------ CONSTRUCTOR CODE ------------------

    if (misc_shared_lib.isEmptySafeString(hostDivDomId))
        throw new Error(`${errPrefix}The hostDivDomId parameter is empty.`);
}



