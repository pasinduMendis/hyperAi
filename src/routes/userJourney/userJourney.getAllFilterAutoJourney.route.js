const controller = require('../../controllers/userJourney/userJourney.getAllFilterAutoJourney.controller')
const {
  websiteValidators,
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

app.post(
  '/userJourneys/getJourneyByWebsiteIdAutoFilterWithButton/:websiteId',
  [jwtValidator.verifyToken, websiteValidators.hasWebsiteId],
  controller.getAutoTrackJourneyByWebsiteIdWithFilterWithButtons
)

}
