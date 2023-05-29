const controller = require('../../controllers/website/website.verifyPixel.controller')
const { websiteValidators } = require('../../middlewares')
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
    '/website/verifyPixel',
    [jwtValidator.verifyToken, websiteValidators.hasValidFields],
    controller.verifyPixel
  )

}
