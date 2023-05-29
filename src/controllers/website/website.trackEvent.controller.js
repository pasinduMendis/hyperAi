const dynamoClient = require("../../db/dbconfig");
const { v4: uuidv4 } = require("uuid");
const requestIp = require("request-ip");

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

exports.trackEvent = async (req, res) => {
  try {
    const { websiteId, uuId, isLoaded, events, userId,domain,socialRef } = req.body;
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
      if((domain.split('www.').join("")!=existingWebUser.Items[0].domain.split('www.').join(""))){
        res.status(400).send({ message: "invalid domain" });
        return
      }
    }}catch (err) {
      res.status(400).send({ message: err.message });
      return
    }
  try {
    const ip = requestIp.getClientIp(req);
  const { websiteId, uuId, isLoaded, events, userId,socialRef,socialUtms } = req.body;
  const eventId = uuidv4();
  const newEvent = {
    pk: "PE#" + eventId,
    sk: "WEBSITE#" + websiteId,
    websiteId: websiteId,
    sessionId: uuId,
    isLoaded: isLoaded,
    socialRef:socialRef,
    socialUtms:socialUtms,
    ipAddress: ip,
    createdAt: new Date().toISOString(),
    ...events,
  };

  let response = await dynamoClient.put({
    Item: newEvent,
  });

  
  res.status(200).send({ success: true, message: "Hyper Tracked" });
  return
  } catch (error) {
    res.status(400).send({ message: error.message });
    return
  }
  
};



