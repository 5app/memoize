# Memoize

[![CircleCI](https://circleci.com/gh/5app/memoize.svg?style=shield)](https://circleci.com/gh/5app/memoize)

> In computing, memoization or memoisation is an optimization technique used primarily to speed up computer programs by storing the results of expensive function calls and returning the cached result when the same inputs occur again. Memoization has also been used in other contexts (and for purposes other than speed gains), such as in simple mutually recursive descent parsing.[1] Although related to caching, memoization refers to a specific case of this optimization, distinguishing it from forms of caching such as buffering or page replacement. In the context of some logic programming languages, memoization is also known as tabling.[2]

<cite>https://en.wikipedia.org/wiki/Memoization</cite>

# Usage

!Warning contrived example ahead...

```js
import got from 'got'; // simple http requst library for the purpose of demonstration
import memoize from '@5app/memoize';

// Let's decorate the got function
const memoGot = memoize(got);

// Simultaneously open two connections...
const link = 'https://github.com';
Promise.all([memoGot(link), memoGot(link)];

// Will call...
// GET https://github.com
// ... but that's it, it wont call it again the second request will piggy back off the first.
```

# Options `memoize(handler, {...options})`

-   `option.useCache` _(Boolean|Function)_: A truthy/fasly or a function to decide whether to use the cached record or not. Default `true`
-   `option.staleInMs` _Number_: The number of milliseconds before the cache is deemed stale. Results will still be served from the cache whilst an attempt to refresh the cache is made separatly. Default `10000` ms.
-   `option.getKey` _Function_: A function to create a key based upon the input of the function being memoized. Default: a serialization of all the arguments.
-   `option.cache` _Object_: Instance of a Map like object to store the cache. Default `new Map`
-   `options.cacheMaxSize` _Number_: The maximum number of entries to store in the cache. Default `1000`

## `option.useCache`

Whether to use cache this can be a Boolean value (useful to disable it when testing). Or a function e.g.

This snippet checks the cached value before deciding whether to use it...

```js
import memoize from '@5app/memoize';

const memoGot = memoize(got, {
	/**
 	 * @param {object} cached_response - Cached Object
	 * @param {number} cached_response.timestamp - Timestamp when request resolved
	 * @param {string} cached_response.status - 'pending', 'fullfilled', 'rejected'
	 * @param {Promise<*>} cached_response.value - Promise of the request
	 * @returns {Boolean}
	 */
	useCache({timestamp, status}) {
		// Set an expiry on the cache.
		// 2xx, 3xx response last for a full minute before being reused
		// 4xx, 5xx last only a second...
		const age = value.statusCode >= 400 ? 1000 : 60000;

		// Return true if the cache is un-expired, else false.
		return timestamp > Date.now() - AGE;
	}
}

// ...

// Use Memogot
// const req = memogot('link');
// ...

```

# Globally Disable

In testing to disable the memoize cache which can cause issues, use the `MEMOIZE_DISABLE` environment variable, e.g.

```bash
MEMOIZE_DISABLE=1
```

When set to a truthy value the memoize cache will be circumvented.
