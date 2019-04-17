const util = require('util')
const ExpressCache = require('../src/index.js')
const express = require('express')
const request = require('supertest')
const cacheManager = require('cache-manager')

const binaryParser = (res, callback) => {
  res.setEncoding('binary')
  res.data = ''
  res.on('data', function (chunk) {
    res.data += chunk
  })
  res.on('end', function () {
    callback(null, Buffer.from(res.data, 'binary'))
  })
}

const memoryCacheParams = {
  store: 'memory', max: 10000, ttl: 3600
}

module.exports = {
  memoryCacheParams,
  createTestEnvironment: (options = {}) => new Promise((resolve, reject) => {
    const cacheMiddleware = new ExpressCache(
      cacheManager.caching(memoryCacheParams), options
    )

    const app = express()
    cacheMiddleware.attach(app)
    const listen = app.listen(() => resolve({ app, cacheMiddleware, listen }))
  }),

  serveOnce: async function(serveFunc, content, options = {}) {
    const env = await this.createTestEnvironment(options)
    env.app.get('/', serveFunc)
    const app = request(env.app)

    return {
      env,
      get: () => app.get('/'),
      getAsBinary: () => app.get('/').buffer().parse(binaryParser),
      close: util.promisify(env.listen.close.bind(env.listen)),
    }
  },

  createBrokenGetEnvironment: async function (options = {}) {
    const app = await this.sendOnce('never seen', options)
    app.env.cacheMiddleware.get = (key, getCb) => { getCb(new Error('Backend get error')) }
    app.env.cacheMiddleware.getAsync = async key => { throw new Error('Backend get error') }
    return app
  },
  createBrokenSetEnvironment: async function (options = {}) {
    const app = await this.sendOnce('never seen', options)
    app.env.cacheMiddleware.set = (key, value, setCb) => { throw new Error('Backend set error') }
    app.env.cacheMiddleware.setAsync = async (key, value) => { throw new Error('Backend set error') }
    return app
  },

  sendOnce: async function(content, options = {}) {
    let routeResponse = content
    const app = await this.serveOnce((req, res, next) => {
      res.send(routeResponse)
      routeResponse = 'should not see this value'
    }, content, options)
    return app
  },

  writeOnce: async function(content, options = {}) {
    let routeResponse = content
    const app = await this.serveOnce((req, res, next) => {
      res.write(routeResponse)
      res.end()
      routeResponse = 'should not see this value'
    }, content, options)
    return app
  },

  jsonOnce: async function(content, options = {}) {
    let routeResponse = content
    const app = await this.serveOnce((req, res, next) => {
      res.json({ message: routeResponse })
      routeResponse = 'should not see this value'
    }, content, options)
    return app
  },
}
