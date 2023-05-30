require("dotenv").config();
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

//update journey
exports.shareAllowUpdate = async (req, res) => {
  const { websiteId } = req.params;
  const userId = req.userId;
  const { shareAllow } = req.body;
  var websiteData = {
    FilterExpression: "sk=:sk AND pk=:pk",
    ExpressionAttributeValues: {
      ":sk": "USER#" + userId,
      ":pk": "WEBSITE#" + websiteId,
    },
  };
  try {
    var web1 = await getDynamoScanSingleData(websiteData)

    if (web1.Count === 0) {
      res.status(404).send({
        message: "website not found!",
      });
    } else{
        const updateInfo = {
          Key: { pk: `WEBSITE#${websiteId}`, sk: `USER#${userId}` },
          UpdateExpression: "SET shareAllow = :shareAllow ",
          ExpressionAttributeValues: {
            ":shareAllow": shareAllow,
          },
          ReturnValues: "ALL_NEW",
        };
        const update = await dynamoClient.update(updateInfo);
        res.status(200).send({ message: "Updated Successfully",result:shareAllow });
      }
    
  } catch (error) {
    res.status(400).send({ message: "An error occured!", error: error });
  }
};