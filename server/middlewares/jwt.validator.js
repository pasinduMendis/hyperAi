const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  let token = req.headers['authorization']

  if (!token) {
    res.status(403).send({ message: 'Missing access token!' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    console.log("error : ", err,"Decoded : ", decoded)
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' })
    }
    req.userId = decoded.id;
    next()
  })
}

const jwtValidator = {
  verifyToken,
}

module.exports = jwtValidator
