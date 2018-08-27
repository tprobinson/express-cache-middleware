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
		expect(() => new ExpressCache(cacheManager.caching(utils.memoryCacheParams), {getCacheKey: true})).toThrow()
		expect(() => new ExpressCache(cacheManager.caching(utils.memoryCacheParams), {hydrate: true})).toThrow()
	})
})

describe('basic function test', () => {
	const testValue = random()

	const testUnicodeValue = '関係なく　文字。'

	// One-pixel transparent GIF
	const testBinaryValue = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

	let env
	let lastRouteResponse
	let routeResponse
	beforeAll(done => utils.createTestEnvironment({}, (err, stuff) => {
		if( err ) { return done(err) }
		env = stuff
		env.app.get('/', (req, res, next) => {
			res.send(routeResponse)
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

	test('string response', done => {
		routeResponse = testValue
		return utils.get(env.app)
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.text).toEqual(routeResponse)
				routeResponse = 'cached'
				return utils.get(env.app)
			})
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.text).toEqual(lastRouteResponse)
				done()
			})
	})

	test('unicode string safety', done => {
		routeResponse = testUnicodeValue
		return utils.get(env.app)
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.text).toEqual(routeResponse)
				routeResponse = 'cached'
				return utils.get(env.app)
			})
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.text).toEqual(lastRouteResponse)
				done()
			})
	})

	test('binary data safety', done => {
		routeResponse = testBinaryValue
		return utils.getAsBinary(env.app)
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(routeResponse)
				routeResponse = 'cached'
				return utils.getAsBinary(env.app)
			})
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(lastRouteResponse)
				done()
			})
	})
})
