const dynamoClient = require("../../db/dbconfig");
const { v4: uuidv4 } = require("uuid");


exports.requestDemo = async (req, res) => {
  try {
    let demoId = uuidv4();
    const newDemo = {
      ...req.body,
      pk: "DEMO#" + demoId,
      sk: "REQUESTDEMO#" + demoId,
      createdAt: new Date().toISOString(),
    };

    const demoData = {
      Item: newDemo,
    };
    await dynamoClient.put(demoData);

    res.status(200).send({
      message: "You have successfully created a demo!",
    });
  } catch (error) {
    console.log("Debugger -- error", error);
    res
      .status(500)
      .send({ message: "An unexpected error occured!", error: error });
  }
};

