const dynamoClient = require("../../db/dbconfig");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");


exports.signUp = async (req, res) => {
  try {
    let userId = uuidv4();
    const newUser = {
      pk: "USER#" + userId,
      sk: "USERSK#" + userId,
      createdAt: new Date().toISOString(),
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      provide: "credentials provider",
      id: userId,
      type: "USER",
      cards: [],
      payments: [],
      isSubscribed: false,
      subscribed_package: "",
    };

    const userData = {
      Item: newUser,
    };
    const r = await dynamoClient.put(userData);

    var userDataGet = {
      FilterExpression: "email=:email AND begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":email": req.body.email,
        ":pk": "USER#",
      },
    };
    var existingUser = await dynamoClient.scan(userDataGet);
    if (
      typeof existingUser.LastEvaluatedKey != "undefined" &&
      existingUser.Count == 0
    ) {
      userDataGet.ExclusiveStartKey = existingUser.LastEvaluatedKey;
      for (let i = 0; i < 1; i++) {

        var result = await dynamoClient.scan(userDataGet);
        existingUser.Count = existingUser.Count + result.Count;
        existingUser.Items = [...existingUser.Items, ...result.Items];
        if (
          typeof result.LastEvaluatedKey != "undefined" &&
          existingUser.Count == 0
        ) {
          userDataGet.ExclusiveStartKey = result.LastEvaluatedKey;
          i = i - 1;
        } else {
          i = i + 1;
          break;
        }
      }
    }
    var user = existingUser.Items[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    delete user.password;

    res.status(200).send({
      message: "You have successfully created a new account!",
      user: user,
      accessToken: token,
    });
  } catch (error) {
    console.log("Debugger -- sign up -- error", error);
    res
      .status(500)
      .send({ message: "An unexpected error occured!", error: error });
  }
};