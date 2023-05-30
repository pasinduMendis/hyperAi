const dynamoClient = require("../../db/dbconfig");

exports.getDemo = async (req, res) => {
  try {
    var userDataGet = {
      FilterExpression: "begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":pk": "DEMO#",
      },
    };
    var existingUser = await dynamoClient.scan(userDataGet);
    if (typeof existingUser.LastEvaluatedKey != "undefined") {
      userDataGet.ExclusiveStartKey = existingUser.LastEvaluatedKey;
      for (let i = 0; i < 1; i++) {

        var result = await dynamoClient.scan(userDataGet);
        existingUser.Count = existingUser.Count + result.Count;
        existingUser.Items = [...existingUser.Items, ...result.Items];
        if (typeof result.LastEvaluatedKey != "undefined") {
          userDataGet.ExclusiveStartKey = result.LastEvaluatedKey;
          i = i - 1;
        } else {
          i = i + 1;
          break;
        }
      }
    }
    if (existingUser.Count == 0) {
      res.status(200).send({
        demo_list: [],
      });
    }

    res.status(200).send({
      demo_list: existingUser.Items,
    });
  } catch (error) {
    console.log("Debugger -- error", error);
    res
      .status(500)
      .send({ message: "An unexpected error occured!", error: error });
  }
};