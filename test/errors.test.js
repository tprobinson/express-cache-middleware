const random = require('random-words')
const utils = require('./utils')

describe('hydration errors', () => {
  const hydrateWithError = (req, res, data, cb) => {
    cb(new Error(data.toUpperCase()))
  }

  const hydrateWithErrorPromise = async (req, res, data) => {
    throw new Error(data.toUpperCase())
  }

  test('hydrate with error with callback', async () => {
    const testValue = random()
    const expectedValue = testValue.toUpperCase()

    const app = await utils.sendOnce(testValue, { hydrate: hydrateWithError })
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(500)
    expect(secondResponse.text).toMatch(`Error: ${expectedValue}`)
    await app.close()
  })

  test('hydrate with error with promise', async () => {
    const testValue = random()
    const expectedValue = testValue.toUpperCase()

    const app = await utils.sendOnce(testValue, { hydrate: hydrateWithErrorPromise })
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await app.get()
    expect(secondResponse.statusCode).toBe(500)
    expect(secondResponse.text).toMatch(`Error: ${expectedValue}`)
    await app.close()
  })
})

describe('bad cache-manager backend test', () => {
  test('Errors when cache-manager cannot get', async () => {
    const app = await utils.createBrokenGetEnvironment()
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(500)
    expect(firstResponse.text).toMatch('Error: Backend get error')
    await app.close()
  })
  test('Errors when cache-manager cannot set', async () => {
    const app = await utils.createBrokenSetEnvironment()
    const firstResponse = await app.get()
    expect(firstResponse.statusCode).toBe(500)
    expect(firstResponse.text).toMatch('Backend set error')
    await app.close()
  })
})
