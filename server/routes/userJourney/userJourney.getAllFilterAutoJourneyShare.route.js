const controller = require('../../controllers/userJourney/userJourney.getAllFilterAutoJourneyShare.controller')
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
  '/userJourneys/getJourneyByWebsiteIdAutoFilterWithButtonShare/:websiteId',
  [ websiteValidators.hasWebsiteId],
  controller.getAutoTrackJourneyByWebsiteIdWithFilterWithButtonsShare
)

}
