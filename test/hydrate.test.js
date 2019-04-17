const random = require('random-words')
const util = require('util')
const utils = require('./utils')

describe('hydration test', () => {
  const testValue = random()
  const hydratedValue = testValue.toUpperCase()

  const hydrate = (req, res, data, cb) => {
    cb(null, data.toUpperCase())
  }

  const hydrateWithPromise = util.promisify(hydrate)

  const hydrateWithAsync = async (req, res, data) => {
    return data.toUpperCase()
  }

  const hydrateToJson = async (req, res, data) => JSON.parse(data)

  test('hydrate with callback', async () => {
    const app = await utils.sendOnce(testValue, { hydrate: hydrate })

    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(hydratedValue)
    await app.close()
  })

  test('hydrate with promise', async () => {
    const app = await utils.sendOnce(testValue, { hydrate: hydrateWithPromise })

    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(hydratedValue)
    await app.close()
  })

  test('hydrate with async', async () => {
    const app = await utils.sendOnce(testValue, { hydrate: hydrateWithAsync })

    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(hydratedValue)
    await app.close()
  })

  test('hydrate as JSON', async () => {
    const data = { [`${random()}`]: random() }
    const app = await utils.sendOnce(data, { hydrate: hydrateToJson })

    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.body).toEqual(data)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.body).toEqual(data)
    await app.close()
  })
})
