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
    expect(() => new ExpressCache(cacheManager.caching(utils.memoryCacheParams), { getCacheKey: true })).toThrow()
    expect(() => new ExpressCache(cacheManager.caching(utils.memoryCacheParams), { hydrate: true })).toThrow()
  })
})

describe('basic function test', () => {
  test('backend using send()', async () => {
    const testValue = random()
    const app = await utils.sendOnce(testValue)
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(testValue)
    await app.close()
  })

  test('backend using write()', async () => {
    const testValue = random()
    const app = await utils.writeOnce(testValue)
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(testValue)
    await app.close()
  })

  test('backend using json()', async () => {
    const testValue = random()
    const app = await utils.jsonOnce(testValue, { hydrate: async (req, res, data) => JSON.parse(data) })
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.body).toHaveProperty('message', testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.body).toHaveProperty('message', testValue)
    await app.close()
  })

  test('unicode string safety', async () => {
    const testUnicodeValue = '関係なく　文字。'
    const app = await utils.sendOnce(testUnicodeValue)
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testUnicodeValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(testUnicodeValue)
    await app.close()
  })

  test('binary data safety', async () => {
    // One-pixel transparent GIF
    const testBinaryValue = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

    const app = await utils.sendOnce(testBinaryValue)

    const firstResponse = await app.getAsBinary()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.body).toEqual(testBinaryValue)

    const secondResponse = await app.getAsBinary()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.body).toEqual(testBinaryValue)
    await app.close()
  })
})
