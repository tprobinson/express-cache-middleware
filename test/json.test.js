const random = require('random-words')
const utils = require('./utils')

describe('json test', () => {
	const data = {[`${random()}`]: random()}
	const hydrateToJson = (res, data) => new Promise((resolve, reject) => {
		resolve(JSON.parse(data))
	})

	let env
	let lastRouteResponse
	let routeResponse
	beforeAll(done => utils.createTestEnvironment({hydrate: hydrateToJson}, (err, stuff) => {
		if( err ) { return done(err) }
		env = stuff
		env.app.get('/', (req, res, next) => {
			res.json(routeResponse)
			lastRouteResponse = routeResponse
		})
		done()
	}))

	afterEach(done => {
		env.cacheMiddleware.reset(done)
	})
	afterAll(done => {
		env.listen.close(done)
	})

	test('data response', done => {
		routeResponse = data
		return utils.get(env.app)
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(routeResponse)
				routeResponse = 'cached'
				return utils.get(env.app)
			})
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(lastRouteResponse)
				done()
			})
	})
})
