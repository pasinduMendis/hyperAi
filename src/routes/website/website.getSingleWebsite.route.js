const controller = require('../../controllers/website/website.getwebsiteByUserId.controller')
const { jwtValidator } = require('../../middlewares')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    )
    next()
  })

  app.get(
    '/website/getWebsiteByUserId/:websiteId',
    [jwtValidator.verifyToken],
    controller.getWebsiteByUserId
  )

}
