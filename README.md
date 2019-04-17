# express-cache-middleware

An Express middleware designed to intercept responses and cache them.

<!-- TOC START min:1 max:3 link:true asterisk:false update:true -->
- [express-cache-middleware](#express-cache-middleware)
- [Usage](#usage)
  - [Options](#options)
    - [getCacheKey](#getcachekey)
    - [hydrate](#hydrate)
- [Changelog](#changelog)
<!-- TOC END -->


[![https://nodei.co/npm/express-cache-middleware.svg?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/express-cache-middleware.svg?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/express-cache-middleware)

[![Dependency Status](https://david-dm.org/tprobinson/express-cache-middleware.svg)](https://david-dm.org)
[![Coverage Status](https://coveralls.io/repos/github/tprobinson/express-cache-middleware/badge.svg?branch=master)](https://coveralls.io/github/tprobinson/express-cache-middleware?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/tprobinson/express-cache-middleware/badge.svg?targetFile=package.json)](https://snyk.io/test/github/tprobinson/express-cache-middleware?targetFile=package.json)

master: [![Build Status](https://travis-ci.org/tprobinson/express-cache-middleware.svg?branch=master)](https://travis-ci.org/tprobinson/express-cache-middleware)
[![Inline docs](http://inch-ci.org/github/tprobinson/express-cache-middleware.svg?branch=master)](http://inch-ci.org/github/tprobinson/express-cache-middleware)


# Usage

To use this middleware, first instantiate it. The first argument to the constructor must be a [cache-manager](https://www.npmjs.com/package/cache-manager) `.caching()` instance, initialized with any backend you choose. The second argument is an optional object of options.

```js
const express = require('express')
const ExpressCache = require('express-cache-middleware')
const cacheManager = require('cache-manager')

const cacheMiddleware = new ExpressCache(
	cacheManager.caching({
		store: 'memory', max: 10000, ttl: 3600
	})
)
```

Then, attach it to your Express app instance or Router. Any routes attached to the app or Router after this will be intercepted and cached.

```js
// Layer the caching in front of the other routes
cacheMiddleware.attach(app)

// Attach the routes to be cached
app.all('*', (req, res) => {
	// ... do something expensive like a fetch() here ...
	res.send('response')
})

app.listen()
```

Please see the options for important information about handling incoming and outgoing data.

## Options

### getCacheKey

A function to get the cache key from the request. Provided with one argument: the request object from Express.

By default, this is a function that returns the request URL.

You may want to customize this function if you anticipate that there are things in your URL that you don't want in your cache key. For example, you can remove irrelevant query parameters or subdirectories by parsing the URL here and returning the cache key.

### hydrate

Because this middleware is backend-agnostic, it makes no assumptions about what you want to do with cached data. By default, it just passes the streamed data out as the response, and what this data actually is will depend on your chosen cache-manager backend since no metadata side-channel is available.

This usually ends up as a response with `Content-Type: application/octet-stream`, which is not often what people want. To fix this, `hydrate` is run before the content is returned.

`hydrate` is called with four arguments:

* `req`, the Express request object
* `res`, the Express response object
* `data`. the data returned from cache
* `cb`, an optional callback function

Set any headers or perform any transformations on the returned data. Then, call the callback with `(err, result)` or return a Promise.

**Note:** `hydrate` is not called for the first response, where your route returns its original content-- only for cache hits.

Example for handling image responses:
```js
const fileType = require('file-type')
const cacheMiddleware = new ExpressCache(
	cacheManager.caching({
		store: 'memory', max: 10000, ttl: 3600
	}), {
		hydrate: (req, res, data, cb) => {
			// Use file-type library to guess MIME type from Buffer.
			const guess = fileType(data.slice(0, 4101))
			if( guess ) {
				res.contentType(guess.mime)
			}

			cb(null, data)
		}
	}
)

// or with Promises:
const hydrateWithPromise = (res, data) => {
	return Promise.resolve(data)
}

// or with async/await:
const hydrateAsync = async (res, data) => {
	return data
}
```

Example for handling mixed content responses:
```js
const hydrateManyThings = async (req, res, data) => {
  // Parse as JSON first
  try {
    JSON.parse(data)
    res.contentType('application/json')
    return data
  } catch ( err ) {}

  const guess = fileType(data.slice(0, 4101))
  if( guess ) {
    res.contentType(guess.mime)
  }
  return data
}

```

# Changelog

*1.0.1*
Removes mung's json as it was setting cache multiple times. `send` will catch json as well.
Alters Promise detection from `hydrate` functions-- `async` was not being detected as Promises.
Updated dev dependencies, added babel-jest-assertions to ensure the tests are running properly, and minor linting


*1.0.0*
First full release, using fork of express-mung
