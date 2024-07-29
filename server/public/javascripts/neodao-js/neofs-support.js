// This module contains code for working with NeoFS objects.

/**
 * This object contains the details of a NeoFS object.
 *
 * @param {string} srcFilename - The original file name
 *  the object is source from.
 * @param {string} containerId - The asset's NeoFS container ID
 * @param {string} objectId - The asset's NeoFS object ID
 *
 */
function NeoFsAsset(srcFilename, containerId, objectId, ) {
    const self = this;
    const methodName = self.constructor.name + '::' + `constructor`;
    const errPrefix = '(' + methodName + ') ';

    if (misc_shared_lib.isEmptySafeString(srcFilename))
        throw new Error(`${errPrefix}The srcFilename parameter is empty.`);
    if (misc_shared_lib.isEmptySafeString(containerId))
        throw new Error(`${errPrefix}The containerId parameter is empty.`);
    if (misc_shared_lib.isEmptySafeString(objectId))
        throw new Error(`${errPrefix}The objectId parameter is empty.`);

    /** @property {string} - A randomly generated unique ID for this object. */
    this.id = misc_shared_lib.getSimplifiedUuid();

    /** @property {Date} - The date/time this object was created. */
    this.dtCreated = Date.now();

    /** @property {string} - The original file name
     *  the object is source from. */
    this.srcFilename = srcFilename;

    /** @property {string} - Just the primary file name taken
     *   from the srouce file name property. */
    this.primaryFilename = NeoFsAsset.extractPrimaryFilename(srcFilename);

    /** @property {string} - The asset's NeoFS container ID */
    this.containerId = containerId;

    /** @property {string} - The asset's NeoFS object ID */
    this.objectId = objectId;

    /** @property {string} - The URL that retrieves this
     *  asset from NeoFS. */
    this.neoFsUrl = buildNeoFsUrl(self.containerId, self.objectId);
}

/**
 * This function returns just the primary file name from a
 *  NeoFS full source file path.
 *
 * @return {string}
 */
NeoFsAsset.extractPrimaryFilename = function(theFilename) {
    const errPrefix = `(NeoFsAsset::extractPrimaryFilename) `;

    if (misc_shared_lib.isEmptySafeString(theFilename))
        throw new Error(`${errPrefix}The theFilename parameter is empty.`);

    return theFilename.split(/[\\\/]/).pop();
}

/**
 * Parse a string containing a NeoFS compound ID pair into
 *  a NeoFsAsset object.
 *
 * @param {string} strCompoundIdPair - The string to parse
 * @param {boolean} bDecodeBase64Filename - If TRUE,
 *  the default, the file name will be base64 decoded.
 *  If FALSE, it won't.  File names retrieved from the
 *  smart contract usually are Base64 encoded to
 *  prevent serialization related errors.
 *
 * @returns {NeoFsAsset} - Returns a valid NeoFsAsset object
 *  or throws an error if the string is not formatted properly.
 *
 */
NeoFsAsset.Parse = function(strCompoundIdPair, bDecodeBase64Filename=true) {
    let errPrefix = '(NeoFsAsset::Parse) ';

    if (misc_shared_lib.isEmptySafeString(strCompoundIdPair))
        throw new Error(`${errPrefix}The strCompoundIdPair parameter is empty.`);
    if (typeof bDecodeBase64Filename !== 'boolean')
    	throw new Error(`${errPrefix}The value in the bDecodeBase64Filename parameter is not boolean.`);

    const aryParts = misc_shared_lib.splitAndTrim(strCompoundIdPair, ':');

    if (aryParts.length !== 3)
        throw new Error(`${errPrefix}The attempt to split the string containing ID pair failed: "${strCompoundIdPair}"`);

    let useFilename = aryParts[2];

    if (bDecodeBase64Filename)
        useFilename = atob(useFilename);

    return new NeoFsAsset(useFilename, aryParts[0], aryParts[1]);
}