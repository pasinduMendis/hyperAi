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

exports.getWebsiteByUserId = async (req, res) => {
  try {
    const userId = req.userId;
    const { websiteId } = req.params;
 

    var websiteData = {
      FilterExpression: "sk=:sk AND pk=:pk",
      ExpressionAttributeValues: {
        ":sk": "USER#" + userId,
        ":pk": "WEBSITE#"+websiteId,
      },
    };

    var website = await getDynamoScanSingleData(websiteData)
 

    if (website.Count === 0) {
      return res.status(400).send({
        message: "website not found!",
      });
    } else {
      res.status(200).send({
        website: website.Items[0],
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "An unexpected error occured!", error: error });
  }
};



