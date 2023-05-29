const AWS = require('aws-sdk')
require('dotenv').config()

AWS.config.update({
  region: process.env.AWS_REGION_DEPLOY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID_DEPLOY,
  secretAccessKey: process.env.AWS_SEC_ACEESS_KEY_DEPLOY,
})

const client = new AWS.DynamoDB.DocumentClient()

module.exports = {
  get: (params) =>
    client.get({ ...params, TableName: 'hypertarget' }).promise(),
  put: (params) =>
    client.put({ ...params, TableName: 'hypertarget' }).promise(),
  query: (params) =>
    client.query({ ...params, TableName: 'hypertarget' }).promise(),
  update: (params) =>
    client.update({ ...params, TableName: 'hypertarget' }).promise(),
  delete: (params) =>
    client.delete({ ...params, TableName: 'hypertarget' }).promise(),
  scan: (params) =>
    client.scan({ ...params, TableName: 'hypertarget' }).promise(),
}
