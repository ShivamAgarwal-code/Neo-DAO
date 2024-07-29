// This module contains code that is shared by all code INCLUDING the common and miscellaneous
//  modules.  The only put functions that have no dependencies here since the reason this
//  module exists is to isolate code in a way that prevents cyclic dependencies between
//  modules.

// This method returns TRUE if the current environment variable settings indicate that
//  we are on our local Linux development station.  Otherwise FALSE is returned.
function isDevEnv()
{
    if (typeof process.env.LINUX_DEV === undefined || process.env.LINUX_DEV == null)
    	// Not on development Linux station.
        return false;

    // Is the environment variable set to the value TRUE?
    let bIsDevEnv = process.env.LINUX_DEV === 'true';

    return bIsDevEnv;
}

module.exports = {
	isDevEnv: isDevEnv
}