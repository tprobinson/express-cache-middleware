const util = require('util')
const intercept = require('express-mung')

/**
  * @external {ExpressApp} https://expressjs.com/en/api.html#app
  */

/**
  * @external {ExpressRequest} https://expressjs.com/en/api.html#req
  */

/**
  * @external {ExpressResponse} https://expressjs.com/en/api.html#res
  */

/**
  * @external {CacheManager} https://www.npmjs.com/package/cache-manager
  */

/**
 * A dummy function for the getCacheKey option
 * @param  {ExpressRequest} req
 * @return {*} The same URL as was passed in
 */
function passthroughUrl(req) {
  return req._parsedUrl.path
}

/**
 * A dummy function for the hydrate option
 * @param  {ExpressResponse} res  Passed-in Express response
 * @param  {Buffer|string}   data The data returned from cache
 * @return {[Promise]}            Alternative to calling callback, return a Promise
 */
async function passthroughResponse(req, res, data) {
  return data
}

/**
 * A function to handle the hydration process
 * @param  {ExpressResponse} res      Passed-in Express response
 * @param  {Buffer|string}   data     Data coming from cache to be hydrated
 * @param  {Function}        hydrate  Function to invoke on data
 * @return {[Promise]}
 */
function hydrateHandler(req, res, data, hydrate) {
  return new Promise((resolve, reject) => {
    let finishCalled = false
    const finish = (err, result) => {
      if( finishCalled ) {
        console.warn('Finish already called -- do not return a promise and call the callback from the same hydrate function!')
        return
      }
      finishCalled = true
      if( err ) { reject(err) }
      resolve(result)
    }

    const hydratePromise = hydrate(req, res, data, finish)
    if( typeof hydratePromise.then === 'function' ) {
      hydratePromise.then(result => finish(null, result), err => finish(err))
    }
  })
}

/**
 * An object that specifies default values for constructor options
 * @type {Object}
 */
const defaultOptions = {
  getCacheKey: passthroughUrl,
  hydrate: passthroughResponse,
}

class CacheMiddleware {
  /**
   * constructor function
   * @param {CacheManager} cacheManager        A `.caching()` response from a cache-manager instance
   * @param {Object}       [options={}]        A passed-in object of options. Merged with defaultOptions
   * @param {?function}    options.getCacheKey A function to process an incoming request into a cache key.
   *   Good for sanitizing a request to the most unique data, e.g. removing useless query params
   * @param {?function}    options.hydrate     A function to process an outgoing cache response.
   *   Since the backend can return data any way it chooses, this is important.
   */
  constructor(cacheManager, options = {}) {
    if( !cacheManager ) {
      throw new Error('Must be constructed with a cache-manager as the first argument!')
    }
    this.cache = cacheManager

    this.options = Object.assign({}, defaultOptions, options)
    if( typeof this.options.getCacheKey !== 'function' ) {
      throw new Error('getCacheKey option must be a function!')
    }

    if( typeof this.options.hydrate !== 'function' ) {
      throw new Error('hydrate option must be a function!')
    }

    // Bind cache API functions to our object for direct access.
    ['get', 'set', 'mget', 'mset', 'del', 'setex', 'reset', 'keys', 'ttl'].forEach(op => {
      if( op in this.cache ) {
        this[op] = this.cache[op]
        this[`${op}Async`] = util.promisify(this.cache[op])
      }
    })
  }

  /**
   * A function to attach this middleware to an Express instance.
   * This is necessary because there are multiple layers to attach.
   * Perhaps if mung ever gets a single total interception middleware, we can just return the route.
   * @param  {ExpressApp} app The Express app instance.
   */
  attach(app) {
    // Intercept request to get from cache if possible
    app.use(this.cacheRoute.bind(this))

    // Any requests after this will be stored in cache.
    // TODO: figure out if I should homogenize requests by invoking hydrate here
    // app.use(intercept.json((json, req, res) => this.cacheSet(req.cacheKey, json)))
    // json is not needed since it invokes send on its own.
    app.use(intercept.write((buffer, encoding, req, res) => this.cacheSet(req.cacheKey, buffer)))
    app.use(intercept.send((chunk, req, res) => this.cacheSet(req.cacheKey, chunk)))
  }

  /**
   * An incoming request middleware, to retrieve data from cache or pass to the actual backend.
   * @param  {ExpressRequest}  req
   * @param  {ExpressResponse} res
   * @param  {Function}        next A callback to invoke when we don't have a cached response
   */
  async cacheRoute(req, res, next) {
    try {
      const cacheKey = this.options.getCacheKey(req)
      req.cacheKey = cacheKey
      const result = await this.cacheGet(cacheKey)
      if( result ) {
        // If returning from cache, all we have is the raw data. Hydrate it.
        const hydratedData = await hydrateHandler(req, res, result, this.options.hydrate)
        res.send(hydratedData)
        return
      }
      next()
    } catch (err) {
      next(err)
    }
  }

  /**
   * For cacheRoute's use, a wrapper for the underlying cacheManager func.
   * @param  {string}   key The cache key to retrieve
   * @param  {Function} cb  Callback to invoke when complete
   * @return {Promise}
   */
  async cacheGet(key) {
    const value = await this.getAsync(key)
    return value
  }

  /**
   * For cacheRoute's use, a wrapper for the underlying cacheManager func.
   * @param  {string}   key The cache key to store
   * @param  {*}        value The value to store
   * @return {Promise}
   */
  cacheSet(key, value) {
    this.set(key, value)
    return value
  }
}

module.exports = CacheMiddleware
