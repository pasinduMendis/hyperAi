const dynamoClient = require('../../db/dbconfig')
const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function getDynamoScanSingleData(data) {

  var scanData=data
  let returnData = await dynamoClient.scan(scanData);

  if (
    typeof returnData.LastEvaluatedKey != "undefined" &&
    returnData.Count == 0
  ) {
    scanData.ExclusiveStartKey = returnData.LastEvaluatedKey;

    for (let i = 0; i < 1; i++) {

      var result = await dynamoClient.scan(scanData);
      //console.log(result);
      returnData.Count = returnData.Count + result.Count;
      returnData.Items = [...returnData.Items, ...result.Items];
      if (
        typeof result.LastEvaluatedKey != "undefined" &&
        returnData.Count == 0
      ) {
        scanData.ExclusiveStartKey = result.LastEvaluatedKey;
        i = i - 1;
      } else {
        i = i + 1;
        break;
      }
    }
  }

  return returnData;
}

exports.createPayment = async (req, res) => {
    const userId = req.userId
    var userData = {
      FilterExpression: 'id=:id AND begins_with(pk, :pk)',
      ExpressionAttributeValues: {
        ':id': userId,
        ':pk': 'USER#',
      },
    }
    var existingUser = await getDynamoScanSingleData(userData)
    //check user availability in DB
    if (existingUser.Count == 0) {
      return res.status(404).send({
        message: 'user not found!',
      })
    }
  
    const body = req.body
    const paymentMethodReq = body.paymentMethodReq
    try {
  
      const customer = await stripe.customers.create({
        payment_method: paymentMethodReq.paymentMethod.id,
        email: body.billingDetails.email,
        name: body.billingDetails.name,
        invoice_settings: {
          default_payment_method: paymentMethodReq.paymentMethod.id,
        },
      })
  
      var subscription = ''
      if (body.packageName == 'basic' && body.packageType == 'monthly') {
        subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: process.env.SUBS_BASIC_M_KEY }], 
        })
      } else if (body.packageName == 'basic' && body.packageType == 'yearly') {
        subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: process.env.SUBS_BASIC_Y_KEY }], 
        })
      } else if (body.packageName == 'pro' && body.packageType == 'monthly') {
        subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: process.env.SUBS_PRO_M_KEY }], 
        })
      } else if (body.packageName == 'pro' && body.packageType == 'yearly') {
        subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: process.env.SUBS_PRO_Y_KEY }], 
        })
      } else {
        return res.status(400).send({
          message: 'please enter valid packageName & packageType.',
        })
      }
  
      const updateInfo = {
        Key: { pk: `USER#${userId}`, sk: `USERSK#${userId}` },
        UpdateExpression:
          'set #payments=:payments,#isSubscribed=:isSubscribed,#subscribed_package=:subscribed_package',
        ExpressionAttributeNames: {
          '#payments': 'payments',
          '#isSubscribed': 'isSubscribed',
          '#subscribed_package': 'subscribed_package',
        },
        ExpressionAttributeValues: {
          ':payments': {
            subscription_id: subscription.id,
            customer_id: customer.id,
            payment_method: paymentMethodReq.paymentMethod.id,
            createdDate: new Date().toString(),
          },
          ':isSubscribed': true,
          ':subscribed_package': {
            packageName: body.packageName,
            packageType: body.packageType,
          },
        },
      }
      await dynamoClient.update(updateInfo)
      return res.status(200).send({
        message: 'success!',
      })
    } catch (err) {
      return res.status(400).send({ error: err.message })
    }
  }