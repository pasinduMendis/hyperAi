const controller = require('../../controllers/payment/checkIsSubscribed.controller')
const { jwtValidator } = require('../../middlewares')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    )
    next()
  })

  app.post(
    '/payment/isSubscribed',
    [jwtValidator.verifyToken],
    controller.IsSubscribed
  )
}
