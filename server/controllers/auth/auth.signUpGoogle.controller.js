const dynamoClient = require("../../db/dbconfig");
const { v4: uuidv4 } = require("uuid");
var jwt = require("jsonwebtoken");

async function getUserData(user) {

  var userData=user
  let existingUser = await dynamoClient.scan(userData);

  if (
    typeof existingUser.LastEvaluatedKey != "undefined" &&
    existingUser.Count == 0
  ) {
    userData.ExclusiveStartKey = existingUser.LastEvaluatedKey;
    for (let i = 0; i < 1; i++) {

      var result = await dynamoClient.scan(userData);
      existingUser.Count = existingUser.Count + result.Count;
      existingUser.Items = [...existingUser.Items, ...result.Items];
      if (
        typeof result.LastEvaluatedKey != "undefined" &&
        existingUser.Count == 0
      ) {
        userData.ExclusiveStartKey = result.LastEvaluatedKey;
        i = i - 1;
      } else {
        i = i + 1;
        break;
      }
    }
  }

  return existingUser;
}

exports.signUpGoogle = async (req, res) => {
  try {
    let userId = uuidv4();
    const new_user = {
      pk: "USER#" + userId,
      sk: "USERSK#" + userId,
      createdAt: new Date().toISOString(),
      name: req.body.name ? req.body.name : req.body.email,
      email: req.body.email,
      provider: "google",
      id: userId,
      type: "USER",
      cards: [],
      payments: [],
      isSubscribed: false,
      subscribed_package: "",
    };

    const userData = {
      Item: new_user,
    };
    const addUser = await dynamoClient.put(userData);

    var userDataGet = {
      FilterExpression:
        "#email=:email AND #provider=:provider AND begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":email": req.body.email,
        ":pk": "USER#",
        ":provider": "google",
      },
      ExpressionAttributeNames: {
        "#provider": "provider",
        "#email": "email",
      },
    };
    var newUser = await getUserData(userDataGet)

    if (newUser.Count != 0) {
      var user = newUser.Items[0];
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(200).send({
        message: "You have successfully logged in",
        user: user,
        accessToken: token,
      });
    } else {
      res.status(400).send({ message: "failed!" });
    }
  } catch (error) {
    console.log("Debugger -- sign up -- error", error);
    res
      .status(500)
      .send({ message: "An unexpected error occured!", error: error });
  }
};