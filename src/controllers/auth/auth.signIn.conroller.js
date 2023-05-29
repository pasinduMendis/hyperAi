const dynamoClient = require("../../db/dbconfig");
const bcrypt = require("bcryptjs");
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

exports.signIn = async (req, res) => {
  try {
    var userData = {
      FilterExpression: "email=:email AND begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":email": req.body.email,
        ":pk": "USER#",
      },
    };
    var existingUser = await getUserData(userData)

    if (existingUser.Count == 0) {
      res.status(404).send({ message: "No user found" });
    } else {
      var user = existingUser.Items[0];
      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        res.status(400).send({ message: "Invalid password!" });
      } else {
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "1d",
        });

        delete user.password;

        res.status(200).send({
          message: "You have successfully logged in",
          user: user,
          accessToken: token,
        });
      }
    }
  } catch (error) {
    console.log("Debugger -- sign in -- error", error);
    res
      .status(500)
      .send({ message: "An unexpected error occured!", error: error });
  }
};