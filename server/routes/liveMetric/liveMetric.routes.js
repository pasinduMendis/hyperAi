const controller = require('../../controllers/liveMetrics/liveMetrics.controller')
const { jwtValidator } = require('../../middlewares')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    )
    next()
  })

  app.post('/liveMetricsWithSource/:websiteId', [jwtValidator.verifyToken], controller.getCountWithTraffic)
}
