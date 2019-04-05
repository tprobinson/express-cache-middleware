const random = require('random-words')
const utils = require('./utils')

describe('hydration errors', () => {
  const testValue = random()
  const expectedValue = testValue.toUpperCase()

  const hydrateWithError = (res, data, cb) => {
    cb(new Error(data.toUpperCase()))
  }

  const hydrateWithErrorPromise = async (res, data) => {
    throw new Error(data.toUpperCase())
  }

  test('hydrate with error with callback', async () => {
    let routeResponse = testValue

    const env = await utils.createTestEnvironment({hydrate: hydrateWithError})
    env.app.get('/', (req, res, next) => res.send(routeResponse))

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(500)
    expect(secondResponse.text).toMatch(`Error: ${expectedValue}`)
    env.listen.close()
  })

  test('hydrate with error with promise', async () => {
    let routeResponse = testValue

    const env = await utils.createTestEnvironment({hydrate: hydrateWithErrorPromise})
    env.app.get('/', (req, res, next) => res.send(routeResponse))

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(500)
    expect(secondResponse.text).toMatch(`Error: ${expectedValue}`)
    env.listen.close()
  })
})

describe('bad cache-manager backend test', () => {
  test('Errors when cache-manager cannot get', async () => {
    const env = await utils.createBogusGetEnvironment()
    env.app.get('/', (req, res, next) => {
      res.send('never seen')
    })

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(500)
    expect(firstResponse.text).toMatch('Error: Backend get error')
    env.listen.close()
  })

  test('Errors when cache-manager cannot set', async () => {
    const env = await utils.createBogusSetEnvironment()
    env.app.get('/', (req, res, next) => {
      res.send('never seen')
    })

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(500)
    expect(firstResponse.text).toMatch('Backend set error')
    env.listen.close()
  })
})
