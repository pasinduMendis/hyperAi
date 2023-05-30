const controller = require('../../controllers/userJourney/userJourney.shareAllowInvitationListUpdate.controller')
const {
  jwtValidator,
} = require('../../middlewares')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    )
    next()
  })

  app.put(
    '/userJourneys/shareAllowUpdateInvitations/:websiteId',
    [jwtValidator.verifyToken],
    controller.shareAllowUpdate
  )


}
