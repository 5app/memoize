/**
 * Memoize
 * Memoization or memoisation is an optimization technique used primarily to speed up
 * computer programs by storing the results of expensive function calls and returning
 * the cached result when the same inputs occur again.
 *
 * This function acts as a javascript decorator around functions so they can be used as documented
 *
 * It handles updates (reruns) when
 * - The previous result is regarded as stale
 * - The previous result returned a rejected promise
 *
 *
 * @param {Function} callback - Function to wrap
 * @param {object} opts - Options
 * @param {boolean|Function} [opts.useCached=true] - Whether to serve from previous resolved cached responses
 * @param {number} [opts.staleInMs=10000] - Number of milliseconds before the item is regarded as stale
 * @param {Function} [opts.getKey=JSON.stringify] - Function used to define the key for use
 * @param {object} [opts.cache=new Map()] - Caching function uses Map by default
 * @returns {Function} The decorated callback function
 */
function Memoize(callback, opts = {}) {
	const {
		// useCached: Will return the last resolved cached value
		useCached = true,

		// staleInMs: How long before we should check for new updates
		staleInMs = 10000,

		// getKey: Default key definition
		getKey = JSON.stringify,

		// cache: Caching Map
		cache = new Map(),
	} = opts;

	// Default check for shouldUseCache
	// If we have a resolved value, but we want to keep it up to date set to true
	let shouldUseCache = item => item.status === 'resolved' && useCached;

	// If the settings say it's a function use that instead
	if (typeof useCached === 'function') {
		// Update the condition to use the bespoke option
		shouldUseCache = useCached;
	}

	/**
	 * Decorator
	 *
	 * @param {...*} args - Any number of arguments
	 * @returns {Promise} Value of the callback
	 */
	return async (...args) => {
		// Serialize the keys...
		const key = getKey(...args);

		// Find value based upon the key
		const item = cache.get(key) || {};

		// Has value resolved yet?
		if (item.status === 'pending') {
			// Return the promise
			return item.value;
		}

		// Serve the cached value?
		if (item.value && shouldUseCache(item)) {
			// We're going to return the last resolved value
			// But first let's identify the next request
			// And ensure it's been long enough since the last one...
			if (!item.next && item.timestamp <= Date.now() - staleInMs) {
				const next = callback(...args);
				item.next = next;
				next.then(
					() => {
						// Overwrite the value based upon a positive response
						item.value = next;
						item.timestamp = Date.now();
					},
					() => ({
						// Do nothing if it's unsuccessful
					})
				).finally(() => {
					// Finally cleanup the next marker
					delete item.next;
				});
			}

			// Return the resolved response
			return item.value;
		}

		// Else call the handler
		const value = callback(...args);

		// Update the item with the request
		item.value = value;

		// Set a timestamp
		item.timestamp = Date.now();

		// Set default status
		item.status = 'pending';

		// Update it's status when it, resolves/rejects
		value.then(
			() => {
				item.status = 'resolved';
			},
			() => {
				item.status = 'rejected';
			}
		);

		// Store the promise for use later...
		cache.set(key, item);

		// Return the item value
		return item.value;
	};
}

module.exports = Memoize;
