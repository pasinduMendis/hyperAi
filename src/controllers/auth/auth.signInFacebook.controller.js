const dynamoClient = require("../../db/dbconfig");
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

exports.signInFacebook = async (req, res) => {

  try {
    var userData = {
      FilterExpression:
        "#email=:email AND #provider=:provider AND begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":email": req.body.email,
        ":pk": "USER#",
        ":provider": "facebook",
      },
      ExpressionAttributeNames: {
        "#provider": "provider",
        "#email": "email",
      },
    };
    var existingUserGoogle = await getUserData(userData)

    if (existingUserGoogle.Count === 0) {
      return res.status(400).send({ message: "no user found!" });
    }
    var user = existingUserGoogle.Items[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).send({
      message: "You have successfully logged in",
      user: user,
      accessToken: token,
    });
  } catch (error) {
    console.log("Debugger -- sign in -- error", error);
    res
      .status(500)
      .send({ message: "An unexpected error occured!", error: error });
  }
};