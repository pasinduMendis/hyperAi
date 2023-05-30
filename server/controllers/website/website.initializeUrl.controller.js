const dynamoClient = require("../../db/dbconfig");
const { v4: uuidv4 } = require("uuid");
const requestIp = require("request-ip");
const S3 = require("aws-sdk/clients/s3");
const { default: axios } = require("axios");

async function getDynamoScanSingleData(data) {

  var scanData=data
  let returnData = await dynamoClient.scan(scanData);

  //console.log("returnData :",returnData)
  if (
    typeof returnData.LastEvaluatedKey != "undefined" &&
    returnData.Count == 0
  ) {
    scanData.ExclusiveStartKey = returnData.LastEvaluatedKey;
    //console.log("start");
    for (let i = 0; i < 1; i++) {
      //console.log("Scanning for more..." + i);

      var result = await dynamoClient.scan(scanData);
      //console.log(result);
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

exports.initializeUrl = async (req, res) => {
  const ip = requestIp.getClientIp(req);
  //console.log("ip is = " + ip);
  // const ip = req.clientIp;
  const { websiteId, userId, uuId, url, isLoaded, clickEvents,utm_params,domain,source,screenshot,socialRef,socialUtms,cssLinks } = req.body;
  //console.log("socialRef :",socialRef)
  var sessionStorageSaveSource={needupdate:false,data:""}
  try {
    var webUserData = {
      FilterExpression: "id=:id AND begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":id": userId,
        ":pk": "USER#",
      },
    };
    var existingWebUser = await getDynamoScanSingleData(webUserData)
    //console.log("existingWebUser :", existingWebUser);
    if (existingWebUser.Count === 0) {
      res.status(404).send({ message: "User not found" });
      return 
    } else {
      //console.log(domain)
      //console.log(existingWebUser.Items[0].domain)
      if((domain.split('www.').join("")!=existingWebUser.Items[0].domain.split('www.').join(""))){
        //console.log("not match")
        res.status(400).send({ message: "invalid domain" });
        return
      }
    }}catch (err) {
      res.status(400).send({ message: err.message });
      return
    }
//console.log("************************")
  const { buttons, anchors ,formSubmits} = clickEvents;
 // //console.log("formSubmits = ",[...buttons, ...anchors, ...formSubmits]);
  let responseStatus;
  let responseMssg;
  let responseError;

  if (websiteId && url) {
    try {
      let newUserId = uuidv4();
      const item = {
        pk: "PE#" + newUserId,
        sk: "WEBSITE#" + websiteId,
        createdAt: new Date().toISOString(),
        type: "pageVisit",
        baseURI: url,
        socialRef:socialRef,
        socialUtms:socialUtms,
        utm_params:utm_params,
        innerText: "",
        outerText: "",
        websiteId: websiteId,
        sessionId: uuId,
        source:source?source:"",
        isLoaded: isLoaded,
        ipAddress: ip,
      };

      await dynamoClient.put({
        Item: item,
      });

      var userDataUpdated = {
        FilterExpression: "sk=:sk AND pk=:pk",
        ExpressionAttributeValues: {
          ":sk": "USER#" + userId,
          ":pk": "WEBSITE#" + websiteId,
        },
      };
      var getWebUserUpdated = await getDynamoScanSingleData(userDataUpdated)

      if (getWebUserUpdated.Count == 0) {
        res.status(400).send({ message: "failed" });
        return
      }

      let pageEventUpdatedWebsite = getWebUserUpdated.Items[0];
      let upadtedPages;
      let upadtedReff;
      let updatedScreeshot;
      if (pageEventUpdatedWebsite?.pages?.length > 0) {
        var isAlreadyExist=false
        for(let i=0;i<pageEventUpdatedWebsite.pages.length;i++){
          if(pageEventUpdatedWebsite.pages[i].pageUrl==url && pageEventUpdatedWebsite.pages[i].utm_params==utm_params && pageEventUpdatedWebsite.pages[i].source==source){
            var isAlreadyExist=true
          }
          if(pageEventUpdatedWebsite.pages[i].pageUrl==url){
            pageEventUpdatedWebsite.pages[i].clickEvents=[...buttons, ...anchors, ...formSubmits]
          }
        }
        
        if (isAlreadyExist) {
          upadtedPages = pageEventUpdatedWebsite?.pages;
        } else {
          var existPages = pageEventUpdatedWebsite.pages;
          existPages.push({
            pageUrl: url,
            utm_params:utm_params,
            source:source?source:"",
            name: "",
            clickEvents: [...buttons, ...anchors, ...formSubmits],
          });
          upadtedPages = existPages;
        }
      } else {
        var arr = [];
        arr.push({
          pageUrl: url,
          name: "",
          utm_params:utm_params,
          source:source?source:"",
          clickEvents: [...buttons, ...anchors, ...formSubmits],
        });
        upadtedPages = arr;
      }

      if (pageEventUpdatedWebsite?.referrer?.length > 0) {
        var existReff=pageEventUpdatedWebsite.referrer
  
        if (!existReff.includes(source) && new URL(source).host != domain) {
          
          var existReff=pageEventUpdatedWebsite.referrer
          existReff.push(source);
          upadtedReff = existReff;
        } else {
          upadtedReff = pageEventUpdatedWebsite?.referrer;
        }
      } else {
        var arrRef = [];
        arrRef.push(source);
        upadtedReff = arrRef;
      }


      var ssData = {
        FilterExpression: "sk=:sk AND pk=:pk",
        ExpressionAttributeValues: {
          ":sk": "WEBSITE#" + websiteId,
          ":pk": "SS#" + url,
        },
      };
      var getSSData = await getDynamoScanSingleData(ssData)

      if (getSSData.Count == 0) {
        const cssTest=await compareCSS(cssLinks,"",domain)
          const htmlTest=await compareHTML(url,"")
          if(cssTest.isCssChange || htmlTest.isHtmlChange){
            const screenshotData=await saveScreenShaot(screenshot,url+uuidv4(),userId)
            let newSSId = uuidv4();
            var updateFinalSS=[]
            updateFinalSS.push({location:screenshotData.Location,createdAt: new Date().toISOString()})
                const itemSS = {
                  pk: "SS#" + url,
                  sk: "WEBSITE#" + websiteId,
                  id:newSSId,
                  screenshot:updateFinalSS,
                  pageUrl:url,
                  css:cssTest.newCss,
                  html:htmlTest.newHtml,
                };

                await dynamoClient.put({
                  Item: itemSS,
      });
          }else{
            
          }
      }
      else {
        var existScreenShots=getSSData.Items[0].screenshot?getSSData.Items[0].screenshot:[]
        const cssTest=await compareCSS(cssLinks,getSSData.Items[0].css?getSSData.Items[0].css:"",domain)
          const htmlTest=await compareHTML(url,getSSData.Items[0].html?getSSData.Items[0].html:"")
          if(cssTest.isCssChange || htmlTest.isHtmlChange){
            const screenshotData=await saveScreenShaot(screenshot,url+uuidv4(),userId)
            existScreenShots.push({location:screenshotData.Location,createdAt: new Date().toISOString()})

          const { AttributesSS } = await dynamoClient.update({
            Key: {
              pk: "SS#" + url,
              sk: "WEBSITE#" + websiteId,
            },
            UpdateExpression: "SET css = :css, html = :html, screenshot = :screenshot",
            ExpressionAttributeValues: {
              ":css": cssTest.newCss,
              ":html": htmlTest.newHtml,
              ":screenshot":existScreenShots,
            },
            ReturnValues: "ALL_NEW",
          });
        }else{
        }
        
      }


      ///////////////// set update userjourney page visit count  ///////////////
      if (pageEventUpdatedWebsite.userJourney) {

        const { Attributes } = await dynamoClient.update({
          Key: {
            pk: "WEBSITE#" + websiteId,
            sk: "USER#" + userId,
          },
          UpdateExpression: "SET pages = :pages, userJourney = :userJourney, referrer = :referrer",
          ExpressionAttributeValues: {
            ":pages": upadtedPages,
            ":userJourney": pageEventUpdatedWebsite.userJourney,
            ":referrer":upadtedReff,
          },
          ReturnValues: "ALL_NEW",
        });

        if (Attributes) {
          responseStatus = 200;
          responseMssg = "Updated";
          if((source && new URL(source).host.split('www.').join("") != domain.split('www.').join("") && url.split('www.').join("")==domain.split('www.').join("")+'/' ) || url.split('www.').join("")==domain.split('www.').join("")+'/' ){
            sessionStorageSaveSource={needupdate:true,data:{source:source,utm_params:utm_params}}
          }
          
        } else {
          responseStatus = 401;
          responseMssg = "An error occured";
          responseError = "DB update Failed";
        }
      } else {
        const { Attributes } = await dynamoClient.update({
          Key: {
            pk: "WEBSITE#" + websiteId,
            sk: "USER#" + userId,
          },
          UpdateExpression: "SET pages = :pages, referrer = :referrer",
          ExpressionAttributeValues: {
            ":pages": upadtedPages,
            ":referrer":upadtedReff,
          },
          ReturnValues: "ALL_NEW",
        });

        var userDataUpdated = {
          FilterExpression: "sk=:sk AND pk=:pk",
          ExpressionAttributeValues: {
            ":sk": "USER#" + userId,
            ":pk": "WEBSITE#" + websiteId,
          },
        };

        var getWebUserUpdated = await getDynamoScanSingleData(userDataUpdated)

        if (Attributes) {
          responseStatus = 200;
          responseMssg = "Updated";
          if((source && new URL(source).host.split('www.').join("") != domain.split('www.').join("") && url.split('www.').join("")==domain.split('www.').join("")+'/' ) || url.split('www.').join("")==domain.split('www.').join("")+'/' ){
            sessionStorageSaveSource={needupdate:true,data:{source:source,utm_params:utm_params}}
          }
        } else {
          responseStatus = 401;
          responseMssg = "An error occured";
          responseError = "DB update failed!";
        }
      }
    } catch (err) {
      responseStatus = 400;
      responseMssg = "An error occured";
      responseError = err;
    }

    if (responseError) {
      res
        .status(responseStatus)
        .send({ message: responseMssg, error: responseError });
    } else {
      res
        .status(responseStatus)
        .send({ message: responseMssg, error: responseError,sessionStorageSaveSource:sessionStorageSaveSource });
    }
  } else {
    res.status(400).send({ message: "Missing params" });
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

const saveScreenShaot=async(ss,ss_name,userId)=>{
  const s3 = new S3({
    accessKeyId: "AKIAUS7X35MCFI4RELBL",
    secretAccessKey: "wyat71rZI7rTW9hLaM7L8pHbMyvqvXaw0FA1iHQR",
    region: "us-east-1",
  });
  var buf = new Buffer(ss.replace(/^data:image\/\w+;base64,/, ""),'base64');
  var response=""
  const target = { Bucket: "hypertargets3bucket", Key: `${userId}/${ss_name}`, Body: buf,ContentEncoding: 'base64',ContentType: 'image/png'};
  await new Promise(async (resolve, reject) => {
    await s3
    .upload(target)
    .on("httpUploadProgress", (evt) => {
      //console.log(Math.round((evt.loaded / evt.total) * 100));
      if(Math.round((evt.loaded / evt.total) * 100)==100){
      }
    })
    .send((err,data) => {
      if (err){
        //console.log(err);
        reject()}
      //console.log(data)
      response=data;
      resolve()
    })
  })
    
    return response
}

const compareHTML=async(newoneLink,OldOne)=>{

  const res=await await axios.get(`https://${newoneLink}`).catch((err)=>{console.log("error :",err)})
  if (res.data != OldOne) {
    //console.log("HTML fragments are different,");
    return {isHtmlChange:true,newHtml:res.data}
    
  } else {
    //console.log("No HTML changes found.");
    return {isHtmlChange:false,newHtml:res.data}
  }
  }

  const compareCSS=async(newoneLink,OldOne,domain)=>{
    //console.log(1)
    var cssCode=""
    for(let i=0;i<newoneLink.length;i++){
      var checkResult=getHost(newoneLink[i])
    if(checkResult.host==domain){
      const res=await axios.get(newoneLink[i]).catch((err)=>{console.log("error :",err)})
      cssCode=cssCode+res.data
    }
  }
  
  if (cssCode != OldOne) {
    //console.log("CSS are different,");
    return {isCssChange:true,newCss:cssCode}
    
  } else {
    //console.log("No CSS changes found.");
    return {isCssChange:false,newCss:cssCode}
  }
  }

