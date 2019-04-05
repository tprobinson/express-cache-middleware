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
  binaryParser,

  get: app => request(app).get('/'),
  getAsBinary: app => request(app).get('/').buffer().parse(binaryParser),
  createTestEnvironment: (options = {}) => new Promise((resolve, reject) => {
    const cacheMiddleware = new ExpressCache(
      cacheManager.caching(memoryCacheParams), options
    )

    const app = express()
    cacheMiddleware.attach(app)
    const listen = app.listen(() => resolve({app, cacheMiddleware, listen}))
  }),
  createBogusGetEnvironment: (options = {}) => new Promise((resolve, reject) => {
    const cacheMiddleware = new ExpressCache(
      cacheManager.caching(memoryCacheParams), options
    )

    cacheMiddleware.get = (key, getCb) => { getCb(new Error('Backend get error')) }

    const app = express()
    cacheMiddleware.attach(app)
    const listen = app.listen(() => resolve({app, cacheMiddleware, listen}))
  }),
  createBogusSetEnvironment: (options = {}) => new Promise((resolve, reject) => {
    const cacheMiddleware = new ExpressCache(
      cacheManager.caching(memoryCacheParams), options
    )

    cacheMiddleware.set = (key, value, setCb) => { setCb(new Error('Backend set error')) }

    const app = express()
    cacheMiddleware.attach(app)
    const listen = app.listen(() => resolve({app, cacheMiddleware, listen}))
  }),
}
