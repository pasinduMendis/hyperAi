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


exports.IsSubscribed = async (req, res) => {
    try {
        var userData = {
            FilterExpression: 'email=:email AND begins_with(pk, :pk)',
            ExpressionAttributeValues: {
                ':email': req.body.email,
                ':pk': 'USER#',
            },
        }
        var existingUser = await getDynamoScanSingleData(userData)
        
        if (existingUser.Count == 0) {
            res.status(404).send({ message: "No user found" })
        } else {
            var user = existingUser.Items[0]
            res.status(200).send({
              message: 'payment status',
              isSubscribed: user.isSubscribed,
          })
            }
        
    } catch (error) {
        console.log("Debugger -- error", error)
        res.status(500).send({ message: 'An unexpected error occured!', error: error });
    }
  }