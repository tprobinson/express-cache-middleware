const random = require('random-words')
const utils = require('./utils')

describe('hydration test', () => {
  const testValue = random()
  const expectedValue = testValue.toUpperCase()

  const hydrate = (res, data, cb) => {
    cb(null, data.toUpperCase())
  }

  const hydrateWithPromise = (res, data) =>
    new Promise((resolve, reject) =>
      hydrate(res, data, (err, data) => err ? reject(err) : resolve(data))
    )

  test('hydrate with callback', async () => {
    let routeResponse = testValue

    const env = await utils.createTestEnvironment({hydrate: hydrate})
    env.app.get('/', (req, res, next) => res.send(routeResponse))

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(expectedValue)
    env.listen.close()
  })

  test('hydrate with promise', async () => {
    let routeResponse = testValue

    const env = await utils.createTestEnvironment({hydrate: hydrateWithPromise})
    env.app.get('/', (req, res, next) => res.send(routeResponse))

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(expectedValue)
    env.listen.close()
  })
})
