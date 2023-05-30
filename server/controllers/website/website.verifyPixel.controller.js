const dynamoClient = require("../../db/dbconfig");

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

exports.verifyPixel = async (req, res) => {
  const userId = req.userId;
  const websiteId = req.body.websiteId;

  var webUserData = {
    FilterExpression: "sk=:sk AND pk=:pk",
    ExpressionAttributeValues: {
      ":sk": "USER#" + userId,
      ":pk": "WEBSITE#" + websiteId,
    },
  };

  var existingWebUser = await getDynamoScanSingleData(webUserData)

  if (existingWebUser.Count === 0) {
    res.status(404).send({ message: "Website data not found" });
    return
  } else {
    let website = existingWebUser.Items[0];
    res.status(200).send({
      verified: website.pages && website.pages.length > 0,
    });
    return
  }
};



