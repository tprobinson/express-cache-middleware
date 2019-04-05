const ExpressCache = require('../src/index.js')
const random = require('random-words')
const cacheManager = require('cache-manager')

const utils = require('./utils')

describe('class construction options', () => {
  test('can instantiate class', () => {
    const cacheMiddleware = new ExpressCache(
      cacheManager.caching(utils.memoryCacheParams)
    )
    expect(cacheMiddleware).toEqual(expect.any(ExpressCache))
  })

  test('can add options to constructor', () => {
    const getCacheKeyFunc = req => req.url
    const cacheMiddleware = new ExpressCache(
      cacheManager.caching(utils.memoryCacheParams), {
        getCacheKey: getCacheKeyFunc
      }
    )
    expect(cacheMiddleware).toEqual(expect.any(ExpressCache))
    expect(cacheMiddleware).toHaveProperty('options.getCacheKey', getCacheKeyFunc)
  })

  test('construction fails without required parameters', () => {
    expect(() => new ExpressCache()).toThrow()
  })

  test('construction fails with incorrect parameters', () => {
    expect(() => new ExpressCache(cacheManager.caching(utils.memoryCacheParams), {getCacheKey: true})).toThrow()
    expect(() => new ExpressCache(cacheManager.caching(utils.memoryCacheParams), {hydrate: true})).toThrow()
  })
})

describe('basic function test', () => {
  const testValue = random()

  const testUnicodeValue = '関係なく　文字。'

  // One-pixel transparent GIF
  const testBinaryValue = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

  let env
  let lastRouteResponse
  let routeResponse
  beforeAll(async () => {
    env = await utils.createTestEnvironment()
    env.app.get('/', (req, res, next) => {
      res.send(routeResponse)
      lastRouteResponse = routeResponse
    })
  })

  afterEach(done => {
    env.cacheMiddleware.reset(done)
  })
  afterAll(done => {
    env.listen.close(done)
  })

  test('string response', async () => {
    routeResponse = testValue
    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(lastRouteResponse)
  })

  test('unicode string safety', async () => {
    routeResponse = testUnicodeValue
    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(lastRouteResponse)
  })

  test('binary data safety', async () => {
    routeResponse = testBinaryValue
    const firstResponse = await utils.getAsBinary(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.body).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.getAsBinary(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.body).toEqual(lastRouteResponse)
  })
})
