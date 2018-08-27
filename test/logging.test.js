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

	test('get warned for calling callback twice', done => {
		let routeResponse = testValue

		utils.createTestEnvironment({hydrate: hydrateBadly}, (err, env) => {
			if( err ) { return done(err) }
			env.app.get('/', (req, res, next) => res.send(routeResponse))

			return utils.get(env.app)
				.then(response => {
					expect(response.statusCode).toBe(200)
					expect(response.text).toEqual(testValue)
					routeResponse = 'cached'
					return utils.get(env.app)
				})
				.then(response => {
					expect(response.statusCode).toBe(200)
					expect(response.text).toEqual(expectedValue)
					expect(fakeConsoleWarn).toHaveBeenCalled()
					env.listen.close(done)
				})
		})
	})
})
