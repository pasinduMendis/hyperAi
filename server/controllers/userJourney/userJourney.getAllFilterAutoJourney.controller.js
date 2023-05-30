const jwt = require("jsonwebtoken");
require("dotenv").config();
const dynamoClient = require("../../db/dbconfig");

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

async function getDynamoScanMultipleleData(data) {

  var scanData=data
  let returnData = await dynamoClient.scan(scanData);

  if (
    typeof returnData.LastEvaluatedKey != "undefined"
  ) {
    scanData.ExclusiveStartKey = returnData.LastEvaluatedKey;

    for (let i = 0; i < 1; i++) {

      var result = await dynamoClient.scan(scanData);

      returnData.Count = returnData.Count + result.Count;
      returnData.Items = [...returnData.Items, ...result.Items];
      if (
        typeof result.LastEvaluatedKey != "undefined"
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

//auto tracking filter
exports.getAutoTrackJourneyByWebsiteIdWithFilterWithButtons = async (req, res) => {
  const userId = req.userId;
  const websiteId = req.params.websiteId;
  const startDate=req.body.startDate?req.body.startDate:"1923-03-08"
  const endDate=req.body.endDate?req.body.endDate:"2123-03-11"
  const journeyList=req.body.journey?req.body.journey:[]


  try {
    if(journeyList.length==0){
      return res.status(400).send({
        message: "not url provided in to the body!",
      });
    }
    var webUserData = {
      FilterExpression: "sk=:sk AND pk=:pk",
      ExpressionAttributeValues: {
        ":sk": "USER#" + userId,
        ":pk": "WEBSITE#" + websiteId,
      },
     
    };
    var existingWebUser = await getDynamoScanSingleData(webUserData)
    if (existingWebUser.Count === 0) {
      return res.status(400).send({
        message: "website not found!",
      });
    }

    var pageEventsData = {
      FilterExpression: "sk=:sk AND begins_with(pk, :pk) AND #createdAt BETWEEN :lastUpdateFrom AND :lastUpdateTo",
      ExpressionAttributeNames: {
        "#createdAt": "createdAt",
      },
      ExpressionAttributeValues: {
        ":sk": "WEBSITE#" + websiteId,
        ":pk": "PE#",
        ":lastUpdateFrom":startDate,
        ":lastUpdateTo" : endDate,
      },
    };
    var pageEvents1 = await getDynamoScanMultipleleData(pageEventsData)


//get All SS DATa
const getRelatedAllImages=async(website_id)=>{
  var pageEventsData = {
    FilterExpression: "sk=:sk AND begins_with(pk, :pk)",
    ExpressionAttributeValues: {
      ":sk": "WEBSITE#" + website_id,
      ":pk": "SS#",
    },
  };
  var pageEvents1 = await getDynamoScanMultipleleData(pageEventsData)

  return pageEvents1.Items
}


const sSlist=await getRelatedAllImages(websiteId)

//get SS changed Date list
const getSSupadteDateList=async (ss_list)=>{
  var arrayReturn=[]

  for(let i=0;i<ss_list.length;i++){
    for(let j=0;j<ss_list[i].screenshot.length;j++){
      var sscreatedDate=ss_list[i].screenshot[j].createdAt.split('T')[0]
      if(!arrayReturn.includes(sscreatedDate) && sscreatedDate<=endDate && sscreatedDate>=startDate){
        arrayReturn.push(sscreatedDate)
      }
  }
}
arrayReturn.sort((a, b) => new Date(a) - new Date(b));
return arrayReturn
}

const ssDateList=await getSSupadteDateList(sSlist)
const dateList=[startDate,...ssDateList,endDate]


//get First page Data
const getFirstPage=async (pageEventData,endDateFiter,firstUrlOfJourney)=>{
  var userJourneyAuto1stStep={}
  var userJourneyAuto=[]
  var returnIds=[]
  if(firstUrlOfJourney.metric=="pageVisit"){
    for(let i=0;i<pageEventData.length;i++){
    if((pageEventData[i].baseURI==firstUrlOfJourney.url+"/" || 
    pageEventData[i].baseURI=="www."+firstUrlOfJourney.url+"/"||
     "www."+pageEventData[i].baseURI==firstUrlOfJourney.url+"/" ||
     pageEventData[i].baseURI==firstUrlOfJourney.url || 
    pageEventData[i].baseURI=="www."+firstUrlOfJourney.url||
     "www."+pageEventData[i].baseURI==firstUrlOfJourney.url) && pageEventData[i].type==firstUrlOfJourney.metric
     ){
      returnIds.push(i)
      if (!userJourneyAuto1stStep?.url) {
        var ssArrFirst=await getUrlReatadeSSData(pageEventData[i].baseURI,sSlist,endDateFiter)
        var itemid_part_1= pageEventData[i].baseURI
              var  itemid_part_2= firstUrlOfJourney.clickEvent?firstUrlOfJourney.clickEvent:""
              var  itemid=itemid_part_1+itemid_part_2
        userJourneyAuto1stStep={
          url:pageEventData[i].baseURI,
          ss:ssArrFirst,
          item_id:itemid.replace(/\s/g,''),
          metric:firstUrlOfJourney.metric,
          clickEvent:firstUrlOfJourney.clickEvent?firstUrlOfJourney.clickEvent:"",
          parentUri:"",
          totalCount:1,
          faceBookCount:0,
          googleCount:0,
          tiktokCount:0,
          twitterCount:0,
          raditCount:0,
          otherCount:0
        }

        //update social Count
        if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('facebook')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('facebook')))){
          userJourneyAuto1stStep.faceBookCount=userJourneyAuto1stStep.faceBookCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('google')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('google')))){
          userJourneyAuto1stStep.googleCount=userJourneyAuto1stStep.googleCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('tiktok')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('tiktok')))){
          userJourneyAuto1stStep.tiktokCount=userJourneyAuto1stStep.tiktokCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('twitter')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('twitter')))){
          userJourneyAuto1stStep.twitterCount=userJourneyAuto1stStep.twitterCount+1
        }else{
          userJourneyAuto1stStep.otherCount=userJourneyAuto1stStep.otherCount+1
        }
        
      }else{
        //update total count
        userJourneyAuto1stStep.totalCount=userJourneyAuto1stStep.totalCount+1

        //update social Count
        if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('facebook')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('facebook')))){
          userJourneyAuto1stStep.faceBookCount=userJourneyAuto1stStep.faceBookCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('google')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('google')))){
          userJourneyAuto1stStep.googleCount=userJourneyAuto1stStep.googleCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('tiktok')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('tiktok')))){
          userJourneyAuto1stStep.tiktokCount=userJourneyAuto1stStep.tiktokCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('twitter')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('twitter')))){
          userJourneyAuto1stStep.twitterCount=userJourneyAuto1stStep.twitterCount+1
        }else{
          userJourneyAuto1stStep.otherCount=userJourneyAuto1stStep.otherCount+1
        }
      }
      
    }
  }
}else{
  for(let i=0;i<pageEventData.length;i++){
    if((pageEventData[i].baseURI==firstUrlOfJourney.url+"/" || 
    pageEventData[i].baseURI=="www."+firstUrlOfJourney.url+"/"||
     "www."+pageEventData[i].baseURI==firstUrlOfJourney.url+"/" ||
     pageEventData[i].baseURI==firstUrlOfJourney.url || 
    pageEventData[i].baseURI=="www."+firstUrlOfJourney.url||
     "www."+pageEventData[i].baseURI==firstUrlOfJourney.url) 
     && pageEventData[i].type==firstUrlOfJourney.metric && pageEventData[i].innerText==firstUrlOfJourney.clickEvent
     ){
      returnIds.push(i)
      if (!userJourneyAuto1stStep?.url) {
        var itemid_part_1= pageEventData[i].baseURI
        var  itemid_part_2= firstUrlOfJourney.clickEvent?firstUrlOfJourney.clickEvent:""
        var  itemid=itemid_part_1+itemid_part_2
        userJourneyAuto1stStep={
          url:pageEventData[i].baseURI,
          ss:"",
          metric:firstUrlOfJourney.metric,
          item_id:itemid.replace(/\s/g,''),
          clickEvent:firstUrlOfJourney.clickEvent?firstUrlOfJourney.clickEvent:"",
          parentUri:"",
          totalCount:1,
          faceBookCount:0,
          googleCount:0,
          tiktokCount:0,
          twitterCount:0,
          raditCount:0,
          otherCount:0
        }

        //update social Count
        if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('facebook')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('facebook')))){
          userJourneyAuto1stStep.faceBookCount=userJourneyAuto1stStep.faceBookCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('google')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('google')))){
          userJourneyAuto1stStep.googleCount=userJourneyAuto1stStep.googleCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('tiktok')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('tiktok')))){
          userJourneyAuto1stStep.tiktokCount=userJourneyAuto1stStep.tiktokCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('twitter')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('twitter')))){
          userJourneyAuto1stStep.twitterCount=userJourneyAuto1stStep.twitterCount+1
        }else{
          userJourneyAuto1stStep.otherCount=userJourneyAuto1stStep.otherCount+1
        }
        
      }else{
        //update total count
        userJourneyAuto1stStep.totalCount=userJourneyAuto1stStep.totalCount+1

        //update social Count
        if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('facebook')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('facebook')))){
          userJourneyAuto1stStep.faceBookCount=userJourneyAuto1stStep.faceBookCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('google')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('google')))){
          userJourneyAuto1stStep.googleCount=userJourneyAuto1stStep.googleCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('tiktok')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('tiktok')))){
          userJourneyAuto1stStep.tiktokCount=userJourneyAuto1stStep.tiktokCount+1
        }else if((pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('twitter')||(pageEventData[i].socialRef && pageEventData[i].socialRef.toLowerCase().includes('twitter')))){
          userJourneyAuto1stStep.twitterCount=userJourneyAuto1stStep.twitterCount+1
        }else{
          userJourneyAuto1stStep.otherCount=userJourneyAuto1stStep.otherCount+1
        }
      }
      
    }
  }
}
  if(userJourneyAuto1stStep.totalCount){
  userJourneyAuto.push(userJourneyAuto1stStep)
  return {firstStep:userJourneyAuto,firstStepIds:returnIds}
}

  else{
    var ssArrFirst=await getUrlReatadeSSData(firstUrlOfJourney,sSlist,endDateFiter)
    userJourneyAuto1stStep={
      url:firstUrlOfJourney.url,
      ss:ssArrFirst,
      parentUri:"",
      totalCount:0,
      faceBookCount:0,
      googleCount:0,
      tiktokCount:0,
      twitterCount:0,
      raditCount:0,
      otherCount:0
    }
    userJourneyAuto.push(userJourneyAuto1stStep)
    return userJourneyAuto
  }
}

//create full journey
const createFullAutoUserJourney=async (pageEventData,endDateFiter,journey)=>{
      var allJourneys=[]
      var {firstStep,firstStepIds}= await getFirstPage(pageEventData,endDateFiter,journey[0]);
      allJourneys.push(firstStep)
      var prevReturnIds=firstStepIds
      for(let i=1;journey.length>i;i++){
        
        var {outputResult,retrurnIds}=await getNextStepData(pageEventData,endDateFiter,journey[i],prevReturnIds)

        prevReturnIds=retrurnIds?retrurnIds:[]
        if(outputResult==false){
          for(let k=i;journey.length>k;k++){
            if(journey[k].metric!="pageVisit"){

              var parent_id_part_1= journey[k-1].url
              var parent_id_part_2= journey[k-1].clickEvent?journey[k-1].clickEvent:""
              var parent_id=parent_id_part_1+parent_id_part_2
              var itemid_part_1= journey[k].url
              var  itemid_part_2= journey[k].clickEvent?journey[k].clickEvent:""
              var  itemid=itemid_part_1+itemid_part_2
              var  pushResutl=[{
                url:journey[k].url,
                metric:"click",
                item_id:itemid.replace(/\s/g,''),
                clickEvent:journey[k].clickEvent?journey[k].clickEvent:"",
                ss:"",
                parentUri:journey[k-1].url,
                parent_id:parent_id.replace(/\s/g,''),
                totalCount:0,
                faceBookCount:"",
                googleCount:"",
                tiktokCount:"",
                twitterCount:"",
                raditCount:"",
              }]
              allJourneys.push(pushResutl)
            }else
            {var result3=await getAfterCount0DataSS(journey[k].url,sSlist,endDateFiter,journey[k-1])
            allJourneys.push(result3)}
          }
          break
        }else{
        allJourneys.push(outputResult)
        }
      }
      return allJourneys
     
}

//get related child pages
const getNextStepData=async (pageEventData,endDateFiter,journeyItem,prevReturnIds)=>{  
   var returnArr=[]
   var retrurnIds=[]
   if(journeyItem.metric=="pageVisit"){

    for(let i=0;prevReturnIds.length>i;i++){
    if(pageEventData[prevReturnIds[i]+1]){
    var item=pageEventData[prevReturnIds[i]+1]
    var pageEventBaseUpdate=item.baseURI.replace("www.","")
    if((pageEventBaseUpdate==journeyItem.url || 
      item.baseURI==journeyItem.url+"/" ||
      item.baseURI==journeyItem.url ||
      pageEventBaseUpdate==journeyItem.url.replace("www.","") ||
      pageEventBaseUpdate==journeyItem.url.replace("www.","")+"/"
     )){
      retrurnIds.push(prevReturnIds[i]+1)
      if (returnArr.length==0) {
        var parent_id_part_1= pageEventData[prevReturnIds[i]].baseURI
    var parent_id_part_2= pageEventData[prevReturnIds[i]].innerText?pageEventData[prevReturnIds[i]].innerText:""
    var parent_id=parent_id_part_1+parent_id_part_2
      var ssArr=await getUrlReatadeSSData(item.baseURI,sSlist,endDateFiter)
      var itemid_part_1= item.baseURI
        var  itemid_part_2= journeyItem.clickEvent?journeyItem.clickEvent:""
        var  itemid=itemid_part_1+itemid_part_2
      returnArr.push({
        url:item.baseURI,
        metric:journeyItem.metric,
        ss:ssArr,
        clickEvent:journeyItem.clickEvent?journeyItem.clickEvent:"",
        item_id:itemid.replace(/\s/g,''),
        parentUri:pageEventData[prevReturnIds[i]].baseURI,
        parent_id:parent_id.replace(/\s/g,''),
        totalCount:1,
        faceBookCount:"",
        googleCount:"",
        tiktokCount:"",
        twitterCount:"",
        raditCount:"",
      })
    }else{
      returnArr[0].totalCount=returnArr[0].totalCount+1
    }
  
    }
  }
}
}
else{
  for(let i=0;prevReturnIds.length>i;i++){
    if(pageEventData[prevReturnIds[i]+1]){
    var item=pageEventData[prevReturnIds[i]+1]
    var pageEventBaseUpdate=item.baseURI.replace("www.","")
    if((pageEventBaseUpdate==journeyItem.url || 
      item.baseURI==journeyItem.url+"/" ||
      item.baseURI==journeyItem.url ||
      pageEventBaseUpdate==journeyItem.url.replace("www.","") ||
      pageEventBaseUpdate==journeyItem.url.replace("www.","")+"/"
     ) && item.type==journeyItem.metric && item.innerText == journeyItem.clickEvent){
      retrurnIds.push(prevReturnIds[i]+1)
    
    if (returnArr.length==0) {
      var parent_id_part_1= pageEventData[prevReturnIds[i]].baseURI
    var parent_id_part_2= pageEventData[prevReturnIds[i]].innerText?pageEventData[prevReturnIds[i]].innerText:""
    var parent_id=parent_id_part_1+parent_id_part_2
    var itemid_part_1= item.baseURI
        var  itemid_part_2= journeyItem.clickEvent?journeyItem.clickEvent:""
        var  itemid=itemid_part_1+itemid_part_2
      returnArr.push({
        url:item.baseURI,
        metric:"click",
        clickEvent:journeyItem.clickEvent?journeyItem.clickEvent:"",
        item_id:itemid.replace(/\s/g,''),
        ss:"",
        parentUri:pageEventData[prevReturnIds[i]].baseURI,
        parent_id:parent_id.replace(/\s/g,''),
        totalCount:1,
        faceBookCount:"",
        googleCount:"",
        tiktokCount:"",
        twitterCount:"",
        raditCount:"",
      })
    }else{
      returnArr[0].totalCount=returnArr[0].totalCount+1
    }
    
    }
  }
}
}
  if(returnArr.length>0){
  return {outputResult:returnArr,retrurnIds:retrurnIds}
}else{
  return  {outputResult:false,retrurnIds:[]}
}
    
}

const getAfterCount0DataSS=async(journeyItem,sSlist,endDateFiter,parent)=>{
  var returnArr=[]
  var ssArr=await getUrlReatadeSSData(journeyItem,sSlist,endDateFiter)
    returnArr.push({
      url:journeyItem,
      metric:"pageVisit",
      item_id:journeyItem,
      clickEvent:"",
      ss:ssArr,
      parentUri:parent.url,
      parent_id:(parent.url),
      totalCount:0,
      faceBookCount:"",
      googleCount:"",
      tiktokCount:"",
      twitterCount:"",
      raditCount:"",
    })
    return returnArr
}


//get needed ss data
const getUrlReatadeSSData=async (url,relatedAllSS,dateEnd)=>{
  var screenshot=[]
  var availableSSData=[]
  for(let i=0;relatedAllSS.length>i;i++){
    var item=relatedAllSS[i]
    if(item.pk=="SS#"+url){
      availableSSData=[...item.screenshot]
      for(let k=0;item.screenshot.length>k;k++){
        var ssInfo=item.screenshot[k]
        if(ssInfo.createdAt.split('T')[0]<dateEnd && (screenshot.length==0 || screenshot[0].createdAt.split('T')[0]<ssInfo.createdAt.split('T')[0])){
          screenshot=[ssInfo]
        } 

    }
  }
}

if(screenshot.length==0 && availableSSData[availableSSData.length-1]?.createdAt.split('T')[0]<startDate){
  screenshot=[availableSSData[availableSSData.length-1]]
}else if(screenshot.length==0){
  screenshot=[availableSSData[0]]
}
  return screenshot
}

//get relavent events for Date range
const getRelevantFilterPageEvents=async(events,date1,date2)=>{
  var arrayReturn=[]
  for(let j=0;j<events.length;j++){
    var eventCreatedDate=events[j].createdAt.split('T')[0]
    if(eventCreatedDate<date2 &&  eventCreatedDate>=date1){
      arrayReturn.push(events[j])
    }
}
return arrayReturn
}

var finalResultRes=[]
for(let i=1;i<dateList.length;i++){
  var filterStart=dateList[i-1]
  var filterEnd=dateList[i]
  const filteredEvents=await getRelevantFilterPageEvents(pageEvents1.Items,filterStart,filterEnd)

  const getSessionIds = async (events) => {
    var arr = [];
    for (let i = 0; events.length > i; i++) {
      if (arr.indexOf(events[i].sessionId) == -1) {
        arr.push(events[i].sessionId);
      }
    }
    return arr;
  };

  const groupDatabysession = async (events) => {
    var grouped = [];
    const sessions = await getSessionIds(events);
    for (let i = 0; sessions.length > i; i++) {
      const items = events.filter((item) => item.sessionId == sessions[i]);
      const timeArray = items;
      function compare(a, b) {
        if (a.createdAt < b.createdAt) {
          return -1;
        }
        if (a.createdAt > b.createdAt) {
          return 1;
        }
        return 0;
      }

      const sortedArr = timeArray.sort(compare);
      
      grouped=[...grouped,...sortedArr]
      }
    return grouped;
  };

  if(filteredEvents.length>0){

    const sortedfilteredEvents = await groupDatabysession(filteredEvents);

    const resResitl=await createFullAutoUserJourney(sortedfilteredEvents,filterEnd,journeyList)
    var returnResult=[]
for(let i=0;i<resResitl.length;i++){
  if(resResitl[i] && resResitl[i+1] && resResitl[i][0].metric=="pageVisit" && resResitl[i+1][0].metric=="click"){
    var item=resResitl[i][0]
    item={...item,clickCount:resResitl[i+1][0].totalCount,parent_id:returnResult[returnResult.length-1]?returnResult[returnResult.length-1][0].item_id:""}
    returnResult.push([item])
  }
  else if(resResitl[i] && resResitl[i][0].metric=="pageVisit"){
    var item=resResitl[i][0]
    item={...item,parent_id:returnResult[returnResult.length-1]?returnResult[returnResult.length-1][0].item_id:""}
    returnResult.push(resResitl[i])
  }
  
}
  finalResultRes.push({result:returnResult,dateRange:i==0?`until ${filterEnd}`:i==dateList.length+1?`${filterStart} to present`:`${filterStart} to ${filterEnd}`})
}}



    return res.status(200).send({ userJourney: finalResultRes });


  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "An error occured!", error: error });
  }
};