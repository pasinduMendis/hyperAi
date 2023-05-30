const jwtValidator = require('./jwt.validator')
const websiteValidators = require('./website.validator')
const authValidator = require('./auth.validator')
const userJourneyValidators = require('./userJourney.validator')

module.exports = {
  jwtValidator,
  websiteValidators,
  authValidator,
  userJourneyValidators,
}
