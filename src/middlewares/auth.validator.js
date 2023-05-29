const dynamoClient = require('../db/dbconfig');

verifySignUpParams = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || name === '' || !email || email === '' || !password || password === '') {
    res.status(400).send({ message: "Missing required fields!" })
  }

  next()
}

verifySignInParams = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || email === '' || !password || password === '') {
    res.status(400).send({ message: "Missing required fields!" })
  }

  next()
}

verifySignInParamsGoogle = (req, res, next) => {
  const { email } = req.body;

  if (!email || email === '') {
    res.status(400).send({ message: "Missing required fields!" })
  }

  next()
}

checkDuplicateUsers = async (req, res, next) => {
  try {
    var userData = {
      FilterExpression: 'email=:email',
      ExpressionAttributeValues: {
        ':email': req.body.email,
      },
    }
    var existingUser = await dynamoClient.scan(userData)
    if (
      typeof existingUser.LastEvaluatedKey != "undefined" &&
      existingUser.Count == 0
    ) {
      userData.ExclusiveStartKey = existingUser.LastEvaluatedKey;
      for (let i = 0; i < 1; i++) {

        var result = await dynamoClient.scan(userData);
        existingUser.Count = existingUser.Count + result.Count;
        existingUser.Items = [
          ...existingUser.Items,
          ...result.Items,
        ];
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
    if (existingUser.Items.length > 0) {
      return res.status(400).send({ message: 'Email is already in use!' });
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).send({ message: 'An enexpected error occured', error: error });
  }
}

const authValidator = {
  verifySignInParams,
  verifySignUpParams,
  checkDuplicateUsers,
  verifySignInParamsGoogle
}

module.exports = authValidator;