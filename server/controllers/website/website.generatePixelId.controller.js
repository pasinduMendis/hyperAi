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


exports.generatePixelId = async (req, res) => {
  const userId = req.userId;
  const { website_Id } = req.params;

  try {
    var webUserData = {
      FilterExpression: "id=:id AND begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":id": userId,
        ":pk": "USER#",
      },
    };
    var existingWebUser = await getDynamoScanSingleData(webUserData) 
    if (existingWebUser.Count === 0) {
      res.status(404).send({ message: "User not found" });
      return
    } else {
      var websiteData = {
        FilterExpression: "sk=:sk AND pk=:pk",
        ExpressionAttributeValues: {
          ":sk": "USER#" + userId,
          ":pk": "WEBSITE#"+website_Id,
        },
      };

      var website = await getDynamoScanSingleData(websiteData)

      if (website.Count === 0) { 
        res.status(403).send({ message: "failed.invalid website Id." })
        return
      } else { 
        res.status(200).send({ website: website.Items[0] });
        return
      }
    }
  } catch (err) {
    res.status(400).send({ message: "failed", error: err.message });
    return
  }
};



