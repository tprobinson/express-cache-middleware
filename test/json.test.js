const random = require('random-words')
const utils = require('./utils')

describe('json test', () => {
  const data = {[`${random()}`]: random()}
  const hydrateToJson = async (res, data) => JSON.parse(data)

  let env
  let lastRouteResponse
  let routeResponse
  beforeAll(async () => {
    env = await utils.createTestEnvironment({hydrate: hydrateToJson})
    env.app.get('/', (req, res, next) => {
      res.json(routeResponse)
      lastRouteResponse = routeResponse
    })
  })

  afterEach(done => {
    env.cacheMiddleware.reset(done)
  })
  afterAll(done => {
    env.listen.close(done)
  })

  test('data response', async () => {
    routeResponse = data
    const firstResponse = await utils.get(env.app)
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.body).toEqual(routeResponse)
    routeResponse = 'cached'

    const secondResponse = await utils.get(env.app)
    expect(secondResponse.statusCode).toBe(200)
    expect(secondResponse.body).toEqual(lastRouteResponse)
  })
})
