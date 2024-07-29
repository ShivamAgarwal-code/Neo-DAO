/**
 * This file contains some code to centralize various functions needed across the server side code.
 */
 
// Singleton pattern.
const g_GlobalItems = new function ()
{
	const self = this;
}();

module.exports = {
	g_GlobalItems: g_GlobalItems
}