const random = require('random-words')
const utils = require('./utils')

// Mock console funcs
// const fakeConsoleLog = jest.fn()
const fakeConsoleWarn = jest.fn()
// const fakeConsoleError = jest.fn()
// jest.spyOn(global.console, 'log').mockImplementation(fakeConsoleLog)
jest.spyOn(global.console, 'warn').mockImplementation(fakeConsoleWarn)
// jest.spyOn(global.console, 'error').mockImplementation(fakeConsoleError)

describe('hydrate badly', () => {
  const hydrateBadly = (req, res, data, cb) => {
    cb(null, data.toUpperCase())
    cb(null, data.toUpperCase())
  }

  const hydrateRepeatedly = (req, res, data, cb) => {
    cb(null, data.toUpperCase())
    return Promise.resolve(data.toUpperCase())
  }

  test('get warned for calling callback twice', async () => {
    const testValue = random()
    const hydratedValue = testValue.toUpperCase()

    const env = await utils.sendOnce(testValue, { hydrate: hydrateBadly })
    const firstResponse = await env.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await env.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(hydratedValue)
    expect(fakeConsoleWarn).toHaveBeenCalled()
    await env.close()
  })

  test('get warned for callbacking and promising', async () => {
    const testValue = random()
    const hydratedValue = testValue.toUpperCase()

    const env = await utils.sendOnce(testValue, { hydrate: hydrateRepeatedly })
    const firstResponse = await env.get()
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.text).toEqual(testValue)

    const secondResponse = await env.get()
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.text).toEqual(hydratedValue)
    expect(fakeConsoleWarn).toHaveBeenCalled()
    await env.close()
  })
})
