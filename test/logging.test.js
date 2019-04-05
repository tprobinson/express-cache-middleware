const random = require('random-words')
const utils = require('./utils')

// Mock console funcs
const fakeConsoleLog = jest.fn()
const fakeConsoleWarn = jest.fn()
const fakeConsoleError = jest.fn()
jest.spyOn(global.console, 'log').mockImplementation(fakeConsoleLog)
jest.spyOn(global.console, 'warn').mockImplementation(fakeConsoleWarn)
jest.spyOn(global.console, 'error').mockImplementation(fakeConsoleError)

describe('hydrate badly', () => {
  const testValue = random()
  const expectedValue = testValue.toUpperCase()

  const hydrateBadly = (res, data, cb) => {
    cb(null, data.toUpperCase())
    cb(null, data.toUpperCase())
  }

  const hydrateRepeatedly = (res, data, cb) => {
    cb(null, data.toUpperCase())
    return Promise.resolve(data.toUpperCase())
  }

  test('get warned for calling callback twice', async () => {
    let routeResponse = testValue

    const env = await utils.createTestEnvironment({hydrate: hydrateBadly})
    env.app.get('/', (req, res, next) => res.send(routeResponse))

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(expectedValue)
    expect(fakeConsoleWarn).toHaveBeenCalled()
    env.listen.close()
  })

  test('get warned for callbacking and promising', async () => {
    let routeResponse = testValue

    const env = await utils.createTestEnvironment({hydrate: hydrateRepeatedly})
    env.app.get('/', (req, res, next) => res.send(routeResponse))

    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(expectedValue)
    expect(fakeConsoleWarn).toHaveBeenCalled()
    env.listen.close()
  })
})
