// This file contains code for an object that can be used
//  to facilitate field persistence on a web page.  Just
//  add the class 'persistent-field' to any input field
//  you want persisted, and make sure you create an object
//  of this type in the document READY event handler.

// The class name we use for any DOM elements we want to
//  persist to the cookie store.
const CLASS_NAME_PERSISTENT_FIELD = 'persistent-field';

/** This object provides cookie based field persistence to a page
 *	 that requires this feature.
 */
function PersistentFieldsManager() {
	const self = this;
	let methodName = self.constructor.name + '::' + `constructor`;
	let errPrefix = '(' + methodName + ') ';

	/** @property {string} - A randomly generated unique ID for this object. */
	this.id = misc_shared_lib.getSimplifiedUuid();
	
	/** @property {Date} - The date/time this object was created. */
	this.dtCreated = Date.now();
	
	/**
	 * Given an array of DOM element IDs, restore the associated
	 *  page element text values from the cookie store.
	 *
	 * @param {Array<string>} aryFieldElementIDs - An array of field DOM element IDs.
	 */
	this.restoreFields = function(aryFieldElementIDs) {
		let errPrefix = `(restoreFields) `;
		
		if (!Array.isArray(aryFieldElementIDs))
			throw new Error(errPrefix + `The aryFieldElementIDs parameter value is not an array.`);
			
		if (aryFieldElementIDs.length < 1)
			throw new Error(errPrefix + `The array of field element IDs is empty.`);
			
		for (let ndx = 0; ndx < aryFieldElementIDs.length; ndx++) {
			let cookieId = aryFieldElementIDs[ndx];
			
			if (misc_shared_lib.isEmptySafeString(cookieId))
				throw new Error(errPrefix + `The cookieId value at array ndx(${ndx}) is empty.`);
			
			let cookieVal = getCookieValue(cookieId);
			
			console.info(errPrefix, `CookieId("${cookieId}"): ${cookieVal}`);
	
			// Set the element's text value to the cookie value.
			if (!misc_shared_lib.isEmptySafeString(cookieVal)) {
				// The HTML5 input element for the files list must be
				//  handled differently.
				let domElement = $(`#${cookieId}`).get()[0];
				
				let bIsHtml5FileInputElement = (domElement.type === 'file' && domElement.tagName === 'INPUT');
				
				if (bIsHtml5FileInputElement)
					// Push the file into the HTML5 file input control's file collection.
					domElement.files[0] = cookieVal;
				else
					$(`#${cookieId}`).val(cookieVal);
			}
		}
		
	}
	
	/**
	 * Given an array of DOM element IDs, set the cookie store
	 *  from the the associated page element current text values.
	 *
	 * @param {Array<string>} aryFieldElementIDs - An array of field DOM element IDs.
	 */
	this.saveFields = function(aryFieldElementIDs) {
		let errPrefix = `(saveFields) `;
		
		if (!Array.isArray(aryFieldElementIDs))
			throw new Error(errPrefix + `The aryFieldElementIDs parameter value is not an array.`);
			
		if (aryFieldElementIDs.length < 1)
			throw new Error(errPrefix + `The array of field element IDs is empty.`);
			
		for (let ndx = 0; ndx < aryFieldElementIDs.length; ndx++) {
			let cookieId = aryFieldElementIDs[ndx];
			
			if (misc_shared_lib.isEmptySafeString(cookieId))
				throw new Error(errPrefix + `The cookieId value at array ndx(${ndx}) is empty.`);
				
			let currentVal = $(`#${cookieId}`).val();
			
			setCookieValue(cookieId, currentVal);
		}
	}
	
	/**
	 * This function builds an array of all the DOM elements
	 *  that have the 'persistent-field' class name.
	 */
	this.getPersistentFieldIDs = function() {
		const errPrefix = `(getPersistentFieldIDs) `;
		
		let listPersistentFieldIds = $(`.${CLASS_NAME_PERSISTENT_FIELD}`).map(function() {
			return this.id;
		}).get();
		
		return listPersistentFieldIds;
	}
	
	
	/**
	 * Restore certain fields to the enhanced chat page from the cookie store.
	 * 	We use the element ID as the cookie ID.
	 */
	this.restorePage = function() {
		self.restoreFields(self.getPersistentFieldIDs());
	}
	
	/**
	 * Save certain fields to the enhanced chat page from the cookie store.
	 * 	We use the element ID as the cookie ID.
	 *
	 * NOTE: We should call this function any time any of the text element
	 *  fields on the page are changed.  Use the class 'persistent-field'
	 *  for any text elements that should be saved to the cookie store
	 *  when their value is changed.
	 */
	this.savePage = function() {
		self.saveFields(self.getPersistentFieldIDs());
	}
	
	// ----------------------- CONSTRUCTOR CODE -----------------------
	
	// Restore previous DOM element values for those marked with the
	//  persistent field class name.
	self.restorePage();
	
	// Attach our savePage() function to any DOM elements that
	//  are persisted to the cookie store.
	$(`.${CLASS_NAME_PERSISTENT_FIELD}`).change(self.savePage);
	
	$(window).bind('beforeunload', function(){
		self.savePage();
		return 'Message won\'t be shown but it should help save the page.';
	});
	
}