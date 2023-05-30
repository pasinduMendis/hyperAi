const dynamoClient = require("../../db/dbconfig");
const { v4: uuidv4 } = require("uuid");

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

exports.addValidDomain = async (req, res) => {
  try {
    const userId = req.userId;
  const { domain } = req.body;

  var webUserData = {
    FilterExpression: "id=:id AND begins_with(pk, :pk)",
    ExpressionAttributeValues: {
      ":id": userId,
      ":pk": "USER#",
    },
  };
  var existingWebUser = await getDynamoScanSingleData(webUserData)
  if (existingWebUser.Count === 0) {
    res.status(400).send({ message: "User not found" });
    return
  } 

/*   var websiteData = {
    FilterExpression: "sk=:sk AND begins_with(pk, :pk)",
    ExpressionAttributeValues: {
      ":sk": "USER#" + userId,
      ":pk": "WEBSITE#",
    },
  };

  var website = await getDynamoScanSingleData(websiteData)

  if (website.Count != 0) {
    const updatedWebPages=filterDomainLinks(website.Items[0].pages,domain)
    const websiteInfo = {
      Key: { pk: `WEBSITE#${website.Items[0].websiteId}`, sk: `USER#${userId}` },
      UpdateExpression:
        "set #domain=:domain,#pages=:pages",
      ExpressionAttributeNames: {
        "#domain": "domain",
        "#pages" : "pages",
      },
      ExpressionAttributeValues: {
        ":domain": domain,
        ":pages": updatedWebPages,
      },
    };
  
    const updatewebsite = await dynamoClient.update(websiteInfo);
  }  */
  const websiteId = uuidv4();
  const item = {
    pk: "WEBSITE#" + websiteId,
    sk: "USER#" + userId,
    createdAt: new Date().toISOString(),
    websiteId: websiteId,
    id: userId,
    domain:domain,
    pages: [],
    pageEvents: [],
  };

  await dynamoClient.put({
    Item: item,
  });

  const updateInfo = {
    Key: { pk: `USER#${userId}`, sk: `USERSK#${userId}` },
    UpdateExpression:
      "set #domain=:domain",
    ExpressionAttributeNames: {
      "#domain": "domain",
    },
    ExpressionAttributeValues: {
      ":domain": Array.isArray(existingWebUser.Items[0].domain)?[...existingWebUser.Items[0].domain,domain]:(existingWebUser.Items[0].domain?[existingWebUser.Items[0].domain,domain]:[domain]),
    },
  };

  const update = await dynamoClient.update(updateInfo);
 
  res.status(200).send({ success: true, message: "domain updated",websiteId:websiteId });
  return
  } catch (error) {
    console.log(error)
    res.status(400).send({ message: error.message });
    return
  }
  
};


const getHost = (urlString)=> {
  try { 
      const url=new URL(urlString)
      return {pageUrl: url.host+url.pathname,
          utm_params:url.search,
        host:url.host}; 
  }
  catch(e){ 
    try { 
      const url=new URL("https://"+urlString);
      return {pageUrl: url.host+url.pathname,
        utm_params:url.search,}; 
    }
    catch(err){ 
      return false; 
    }
  }
}

const filterDomainLinks=(pages,domain)=>{
  var updatedPages=[]
  for(page of pages){
    var checkResult=getHost(page.pageUrl)
    if(checkResult !=false && checkResult.host==domain){
      updatedPages.push(
        {
          name:page.name,
          utm_params:checkResult.utm_params,
          clickEvents:page.clickEvents,
          pageUrl:checkResult.pageUrl
        }
        )
    }
  }
  return updatedPages;
}

