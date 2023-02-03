/* eslint-disable @typescript-eslint/no-explicit-any */
interface CacheItem {
	// Memoize item status
	status?: 'pending' | 'resolved' | 'rejected';

	// Value if resolved
	value?: any;

	// Next request in waiting
	next?: any;

	// When this cache item was created
	timestamp?: number;
}

interface MemoizeOptions {
	// useCached: Will return the last resolved cached value
	useCached?: true | false | ((param: CacheItem) => boolean);

	// staleInMs: How long before we should check for new updates
	staleInMs?: number;

	// getKey: Default key definition
	// eslint-disable-next-line @typescript-eslint/ban-types
	getKey?: Function;

	// cache: Caching Map
	cache?: Map<string | number | symbol, any>;

	// cache Max Size
	cacheMaxSize?: number;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type MemoizeCallback = Function;

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
 * @param {number} [opts.cacheMaxSize=1000] - Maximum Cache Size
 * @returns {Function} The decorated callback function
 */
export default function Memoize(
	callback: MemoizeCallback,
	opts: MemoizeOptions = {}
) {
	// Disable all memoize
	const {MEMOIZE_DISABLE = false} = process.env;

	const {
		// useCached: Will return the last resolved cached value
		useCached = true,

		// staleInMs: How long before we should check for new updates
		staleInMs = 10000,

		// getKey: Default key definition
		getKey = JSON.stringify,

		// cache: Caching Map
		cache = new Map(),

		// cache Max Size
		cacheMaxSize = 1000,
	} = opts;

	// Default check for shouldUseCache
	// If we have a resolved value, but we want to keep it up to date set to true
	let shouldUseCache: (param: CacheItem) => boolean;

	// If the settings say it's a function use that instead
	if (typeof useCached === 'function') {
		// Update the condition to use the bespoke option
		shouldUseCache = useCached;
	} else {
		shouldUseCache = (item: CacheItem) =>
			item.status === 'resolved' && useCached;
	}

	/**
	 * Decorator
	 *
	 * @param {...*} args - Any number of arguments
	 * @returns {Promise} Value of the callback
	 */
	return async (...args: any) => {
		// Serialize the keys...
		const key = getKey(...args);

		// Find value based upon the key
		const item: CacheItem = cache.get(key) || {};

		// Has value resolved yet?
		if (item.status === 'pending') {
			// Return the promise
			return item.value;
		}

		// Serve the cached value?
		if (item.value && !MEMOIZE_DISABLE && shouldUseCache(item)) {
			// We're going to return the last resolved value
			// But first let's identify the next request
			// And ensure it's been long enough since the last one...
			if (
				!item.next &&
				item.timestamp &&
				item.timestamp <= Date.now() - staleInMs
			) {
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

		// Does the cache need a trim?
		if (cacheMaxSize && cache.size > cacheMaxSize) {
			for (const k of cache.keys()) {
				// Remove the first key and break
				cache.delete(k);
				break;
			}
		}

		// Return the item value
		return item.value;
	};
}
