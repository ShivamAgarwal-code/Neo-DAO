/** This function contains the details for a text element related to the current
 * 	cursor position and selection range.
 * 	
 * @param {Object} targetElement - The target element the cursor position and selection range object are
 * 		associated with.
 * @param {number} startPos - The starting position of the current selection range for the given target element
 * @param {number} endPos - The ending position of the current selection range for the given target element
 
 * @constructor
 */
function CaretInTextElement(targetElement, startPos, endPos) {
	var self = this;
	let methodName = self.constructor.name + '::' + 'constructor';
	let errPrefix = '(' + methodName + ') ';
	
	if (!targetElement)
		throw new Error(errPrefix + 'The target element is unassigned.');
	
	if (endPos < 0)
		startPos = endPos;
		
	if (startPos < 0)
		throw new Error(errPrefix + 'The start position is negative.');
	
	if (startPos > endPos)
		throw new Error(errPrefix + 'The start position is less than the end position.');
	
	/** @property {Object} - The target element this cursor position and selection range object are
	 * 		associated with.  */
	this.targetElement = targetElement;
	
	/** @property {number} - The starting position of the current selection range for the given target element */
	this.startPosition = startPos;
	
	/** @property {number} - The ending position of the current selection range for the given target element */
	this.endingPosition = endPos;
}

/**
 * This function gets the cursor position, and the selection range, forthe
 * 	target element.
 *
 * @param {Object} targetElement - The target element.
 *
 * @return { Object } - Returns the start and end position of the
 * 	range for the current selection in the target element.
 */
function getCursorPositionInTextElement (targetElement) {
	let methodName = self.constructor.name + '::' + 'getCursorPositionInTextElement ';
	let errPrefix = '(' + methodName + ') ';
	
	if (!targetElement)
		throw new Error(errPrefix + 'The target element is unassigned.');

	if (targetElement.selectionStart || targetElement.selectionStart == '0')
		return new CaretInTextElement(targetElement, targetElement.selectionStart, targetElement.selectionEnd);
	else
		return new CaretInTextElement(targetElement, 0, 0);
}

/**
 * This function sets the cursor position, and the selection range, in the
 * 	target element using the given start and end position.
 *
 * @param {Object} targetElement - The target element.
 * @param {number} startPos - The starting position of the selection range.
 * @param {number} [endPos] - The ending position of the selection range.  If omitted,
 * 	the end position is set to the start position so the cursor is positioned, but
 * 	a selection range is not established.
 *
 */
function setCursorPositionInTextElement(targetElement, startPos, endPos = -1) {
	let errPrefix = '(setCursorPositionInTextElement) ';
	
	if (!targetElement)
		throw new Error(errPrefix + 'The target element is unassigned.');
		
	if (endPos < 0)
		startPos = endPos;
		
	if (startPos < 0)
		throw new Error(errPrefix + 'The start position is negative.');
	
	if (startPos > endPos)
		throw new Error(errPrefix + 'The start position is less than the end position.');
	
	if (targetElement.setSelectionRange)
	{
		// Give the target element input focus.
		targetElement.focus();
		// Set the selection range.
		targetElement.setSelectionRange(startPos, endPos);
	}
}

function showDiv(divSelector) {
	jQuery(divSelector).removeClass('hide-me');
	jQuery(divSelector).addClass('show-me');
}

function hideDiv(divSelector) {
	jQuery(divSelector).removeClass('show-me');
	jQuery(divSelector).addClass('hide-me');
}
