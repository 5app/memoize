# Memoize
[![CircleCI](https://circleci.com/gh/5app/memoize.svg?style=shield)](https://circleci.com/gh/5app/memoize)

> In computing, memoization or memoisation is an optimization technique used primarily to speed up computer programs by storing the results of expensive function calls and returning the cached result when the same inputs occur again. Memoization has also been used in other contexts (and for purposes other than speed gains), such as in simple mutually recursive descent parsing.[1] Although related to caching, memoization refers to a specific case of this optimization, distinguishing it from forms of caching such as buffering or page replacement. In the context of some logic programming languages, memoization is also known as tabling.[2]

<cite>https://en.wikipedia.org/wiki/Memoization</cite>

# Usage

!Warning contrived example ahead...

```js
const got = require('got'); // simple http requst library for the purpose of demonstration
const memoize = require('@5app/memoize');

// Let's say we're going to decorate an add function... it's 
const memoGot = memoize(got);

// Simultaneously open two connections...
const link = 'https://github.com';
Promise.all([memoGot(link), memoGot(link)];

// only one request is actually made, the second will piggy back off the first.
```

# Options `memoize(handler, {...options})`

## `option.useCache`

Whether to use cache this can be a Boolean value (useful to disable it when testing). Or a function e.g.

This snippet checks the cached value before deciding whether to use it... 

```js
const memoize = require('@5app/memoize');
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


