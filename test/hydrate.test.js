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

	test('hydrate with callback', done => {
		let routeResponse = testValue

		utils.createTestEnvironment({hydrate: hydrate}, (err, env) => {
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
					env.listen.close(done)
				})
		})
	})

	test('hydrate with promise', done => {
		let routeResponse = testValue

		utils.createTestEnvironment({hydrate: hydrateWithPromise}, (err, env) => {
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
					env.listen.close(done)
				})
		})
	})
})
