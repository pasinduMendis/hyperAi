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

require('../../src/routes/auth/auth.signIn.routes')(router);
require('../../src/routes/auth/auth.signInFacebook.routes')(router);
require('../../src/routes/auth/auth.signInGoogle.routes')(router);
require('../../src/routes/auth/auth.signUp.routes')(router);
require('../../src/routes/auth/auth.signUpFacebook.routes')(router);
require('../../src/routes/auth/auth.signUpGoogle.routes')(router);
require('../../src/routes/userJourney/userJourney.createManualJourney.route')(router)
require('../../src/routes/userJourney/userJourney.deleteManualJourney.route')(router)
require('../../src/routes/userJourney/userJourney.getAllFilterAutoJourney.route')(router)
require('../../src/routes/userJourney/userJourney.getAllManulaJourney.route')(router)
require('../../src/routes/userJourney/userJourney.getAutoJourney.route')(router)
require('../../src/routes/userJourney/userJourney.updateManulJourney.route')(router)
require('../../src/routes/payment/checkIsSubscribed.route')(router)
require('../../src/routes/payment/createPayment.route')(router)
require('../../src/routes/liveMetric/liveMetric.routes')(router)
require('../../src/routes/requestDemo/requestDemoCreate.route')(router)
require('../../src/routes/requestDemo/getRequestDemo.route')(router)
require('../../src/routes/website/website.addDomain.route')(router)
require('../../src/routes/website/website.generatePixelId.route')(router)
require('../../src/routes/website/website.getwebsiteByUserId.route')(router)
require('../../src/routes/website/website.initializeUrl.route')(router)
require('../../src/routes/website/website.trackEvent.route')(router)
require('../../src/routes/website/website.verifyPixel.route')(router)


app.use('/.netlify/functions/', router)




module.exports=app;
