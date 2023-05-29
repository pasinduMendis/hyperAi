const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')

var corsOptions = {
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true, //access-control-allow-credentials:true
  optionsSuccessStatus: 200,
}

const app = express()
const router = express.Router()

app.options('*', cors());
app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
app.use(bodyParser.json({limit: '50mb'}));

app.use(express.urlencoded())
app.use(express.json())
app.use(
  cors(corsOptions)
)

require('./routes/auth/auth.signIn.routes')(router);
require('./routes/auth/auth.signInFacebook.routes')(router);
require('./routes/auth/auth.signInGoogle.routes')(router);
require('./routes/auth/auth.signUp.routes')(router);
require('./routes/auth/auth.signUpFacebook.routes')(router);
require('./routes/auth/auth.signUpGoogle.routes')(router);
require('./routes/userJourney/userJourney.getAllFilterAutoJourney.route')(router)
require('./routes/userJourney/userJourney.getAllFilterAutoJourneyShare.route')(router)
require('./routes/userJourney/userJourney.getAutoJourney.route')(router)
require('./routes/userJourney/userJourney.getAutoJourneyShare.route')(router)
require('./routes/userJourney/userJourney.shareAllowUpdate.route')(router)
require('./routes/userJourney/userJourney.shareAllowInvitationListUpdate.routes')(router)
require('./routes/payment/checkIsSubscribed.route')(router)
require('./routes/payment/createPayment.route')(router)
require('./routes/liveMetric/liveMetric.routes')(router)
require('./routes/requestDemo/requestDemoCreate.route')(router)
require('./routes/requestDemo/getRequestDemo.route')(router)
require('./routes/website/website.addDomain.route')(router)
require('./routes/website/website.generatePixelId.route')(router)
require('./routes/website/website.getwebsiteByUserId.route')(router)
require('./routes/website/website.initializeUrl.route')(router)
require('./routes/website/website.trackEvent.route')(router)
require('./routes/website/website.verifyPixel.route')(router)
require('./routes/website/website.getSingleWebsite.route')(router)


app.use('/.netlify/functions/', router)

module.exports = app
module.exports.handler = serverless(app)

const PORT = process.env.APPPORT || 9000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})

