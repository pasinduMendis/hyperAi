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

//auto trackign jouney
exports.getAutoTrackJourneyByWebsiteId = async (req, res) => {
  const userId = req.userId;
  const websiteId = req.params.websiteId;
  const startDate=req.body.startDate?req.body.startDate:"1923-03-08"
  const endDate=req.body.endDate?req.body.endDate:"2123-03-11"


  try {
    //filter website data
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

    //filter page event data
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

const allClickEvents = (website) => {
  var clickText = [];
  var clickEventListReturn = [];
  if(website && website.pages){
    for(let i=0;i<website.pages.length;i++){
      clickText = []
      for(let k=0;k<website.pages[i].clickEvents.length;k++){
        if (!clickText.includes(website.pages[i].clickEvents[k].text) && website.pages[i].clickEvents[k].text !== "") {
          clickText.push(website.pages[i].clickEvents[k].text);
      }
      }
      clickEventListReturn.push({url:website.pages[i].pageUrl,events:clickText})
      clickText = []
    
}
  }
  return clickEventListReturn;
}

const allClickEventData=await allClickEvents(existingWebUser.Items[0])

const checkIsExistinEvent=(url,eventText,allClickEvents)=>{
  const availability=allClickEvents.findIndex(item => { return item.url == url && item.events.indexOf(eventText)!=-1});
  return availability
}


//get First page Data
const getFirstPage=async (pageEventData,domain,endDateFiter)=>{
  var userJourneyAuto1stStep={}
  var userJourneyAuto=[]
  var returnItemIds=[]
  for(let i=0;i<pageEventData.length;i++){
    if(pageEventData[i].type=="pageVisit" && (pageEventData[i].baseURI==domain+"/" || pageEventData[i].baseURI=="www."+domain+"/"|| "www."+pageEventData[i].baseURI==domain+"/")){
      returnItemIds.push(i)
      if (!userJourneyAuto1stStep?.url) {
        var ssArrFirst=await getUrlReatadeSSData(pageEventData[i].baseURI,sSlist,endDateFiter)
        userJourneyAuto1stStep={
          url:pageEventData[i].baseURI.split('?')[0],
          item_id:pageEventData[i].baseURI.split('?')[0].replace(/\s/g,''),
          ss:ssArrFirst,
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
        if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('facebook')){
          userJourneyAuto1stStep.faceBookCount=userJourneyAuto1stStep.faceBookCount+1
        }else if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('google')){
          userJourneyAuto1stStep.googleCount=userJourneyAuto1stStep.googleCount+1
        }else if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('tiktok')){
          userJourneyAuto1stStep.tiktokCount=userJourneyAuto1stStep.tiktokCount+1
        }else if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('twitter')){
          userJourneyAuto1stStep.twitterCount=userJourneyAuto1stStep.twitterCount+1
        }else{
          userJourneyAuto1stStep.otherCount=userJourneyAuto1stStep.otherCount+1
        }
        
      }else{
        //update total count
        userJourneyAuto1stStep.totalCount=userJourneyAuto1stStep.totalCount+1

        //update social Count
        if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('facebook')){
          userJourneyAuto1stStep.faceBookCount=userJourneyAuto1stStep.faceBookCount+1
        }else if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('google')){
          userJourneyAuto1stStep.googleCount=userJourneyAuto1stStep.googleCount+1
        }else if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('tiktok')){
          userJourneyAuto1stStep.tiktokCount=userJourneyAuto1stStep.tiktokCount+1
        }else if(pageEventData[i].source && pageEventData[i].source.toLowerCase().includes('twitter')){
          userJourneyAuto1stStep.twitterCount=userJourneyAuto1stStep.twitterCount+1
        }else{
          userJourneyAuto1stStep.otherCount=userJourneyAuto1stStep.otherCount+1
        }
      }
      
    }
  }
  userJourneyAuto.push(userJourneyAuto1stStep)
  return {firstStep:userJourneyAuto,returnItemIds:returnItemIds}
}

//create full journey
const createFullAutoUserJourney=async (pageEventData,domain,endDateFiter)=>{
      var allJourneys=[]
      var allreadyTestedIds=[]
      const {firstStep,returnItemIds}= await getFirstPage(pageEventData,domain,endDateFiter);
      allJourneys.push(firstStep)
      allreadyTestedIds=[...allreadyTestedIds,returnItemIds]
      var firstResult=await getChildData(firstStep[0].url,pageEventData,endDateFiter,returnItemIds,allreadyTestedIds)
      if(firstResult.resultData){
        allJourneys.push(firstResult.resultData)
        var loopResult=true
        var loopArr=firstResult.resultData
        var stepResults=[]
        var prevIds=firstResult.returnIds2
        allreadyTestedIds=[...allreadyTestedIds,...firstResult.returnIds2]
        var prevIdsNew=[]
        do {
          stepResults=[]
          prevIdsNew=[]
          for(let i=0;loopArr.length>i;i++){
            var result=await getChildData(loopArr[i].url,pageEventData,endDateFiter,prevIds,allreadyTestedIds)
            if(result.resultData){
              stepResults=[...stepResults,...result.resultData]
              prevIdsNew=[...prevIdsNew,...result.returnIds2]
              allreadyTestedIds=[...allreadyTestedIds,...result.returnIds2]
            }
          }

          if(stepResults.length==0){
            loopResult=false
            loopArr=stepResults
          }else{
            allJourneys.push(stepResults)
            loopArr=stepResults
            stepResults=[]
            prevIds=prevIdsNew
          }
          
        } while (loopResult);
      }
      return allJourneys
     
}

//get related child pages
const getChildData=async (url,events,endDateFiter,prevIds,allreadyTestedIds)=>{  //need to loop all available URLs
  if(url){
   //filter page event data
   var urlUpdate=url.replace("www.","")
   var itemsFilterRes=[]
   var returnIds=[]
   var clickCounts={}
  for(let i=0;prevIds.length>i;i++){
    if(events[prevIds[i]+1] && allreadyTestedIds.indexOf(prevIds[i]+1)==-1 && events[prevIds[i]+1].sessionId == events[prevIds[i]].sessionId){
      var item=events[prevIds[i]+1]
      item={...item,parentId:prevIds[i]}
    if((item.type=="pageVisit" && item.source.split("?")[0].replace("www.","") !=urlUpdate) && ((item.source && item.source.split("?")[0] == urlUpdate) || (item.source && item.source.split("?")[0] == "https://www."+urlUpdate) || (item.source && item.source.split("?")[0] == "https://www."+urlUpdate+"/") || (item.source && item.source.split("?")[0] == "https://"+urlUpdate) || (item.source && item.source.split("?")[0] == "https://"+urlUpdate+"/") )){
    itemsFilterRes.push(item)
    returnIds.push(prevIds[i]+1)
    }else if(item.type=="click" && events[prevIds[i]+2] && events[prevIds[i]+2].type=="pageVisit" && events[prevIds[i]+2].baseURI!=events[prevIds[i]].baseURI){
      var availableClickRes=await checkIsExistinEvent(item.baseURI,item.innerText,allClickEventData)
      if(availableClickRes !=-1){
        var item2=events[prevIds[i]+2]
      item2={...item2,parentId:prevIds[i]}
      if((item2.type=="pageVisit" && item2.source.split("?")[0].replace("www.","") !=urlUpdate) && ((item2.source && item2.source.split("?")[0] == urlUpdate) || (item2.source && item2.source.split("?")[0] == "https://www."+urlUpdate) || (item2.source && item2.source.split("?")[0] == "https://www."+urlUpdate+"/") || (item2.source && item2.source.split("?")[0] == "https://"+urlUpdate) || (item2.source && item2.source.split("?")[0] == "https://"+urlUpdate+"/") )){
        itemsFilterRes.push(item2)
        returnIds.push(prevIds[i]+2)
        clickCounts[`${events[prevIds[i]+2].baseURI}`]=clickCounts[`${events[prevIds[i]+2].baseURI}`]?clickCounts[`${events[prevIds[i]+2].baseURI}`]+1:1
      }
    }
      
    }
    
      }
  }
  if(itemsFilterRes.length>0){
    var result=await getUniqueUrlsData(itemsFilterRes,url,endDateFiter,events,clickCounts)
    return {resultData:result,returnIds2:returnIds}
  }else{
    return {resultData:null,returnIds2:returnIds}
  }
  
}
else{return {resultData:null,returnIds2:[]}}
  }

//get unique array of child data set
const getUniqueUrlsData = async (events,ParentUrl,endDateFiter,allEvents,clickCounts) => {

  var arr = [];
  var returnArr=[]
  for (let i = 0; events.length > i; i++) {
    var parent_id_part_1= allEvents[events[i].parentId].baseURI
    var parent_id_part_2= allEvents[events[i].parentId].innerText?allEvents[events[i].parentId].innerText:""
    var parent_id=parent_id_part_1+parent_id_part_2
    if(events[i].baseURI.split('?')[0] != ParentUrl && events[i].type=="pageVisit"){
      const itemIndex=arr.indexOf(events[i].baseURI.split('?')[0])
    if (itemIndex == -1) {
      var ssArr=await getUrlReatadeSSData(events[i].baseURI,sSlist,endDateFiter)
      arr.push(events[i].baseURI.split('?')[0]);
      var itemid_part_1= events[i].baseURI
        var  itemid_part_2= events[i].innerText?events[i].innerText:""
        var  itemid=itemid_part_1+itemid_part_2
      returnArr.push({
        url:events[i].baseURI.split('?')[0],
        ss:ssArr,
        parent_id:parent_id.replace(/\s/g,''),
        metric:"pageVisit",
        item_id:itemid.replace(/\s/g,''),
        parentUri:ParentUrl,
        clickCount:clickCounts[`${events[i].baseURI}`]?clickCounts[`${events[i].baseURI}`]:null,
        totalCount:1,
        faceBookCount:"",
        googleCount:"",
        tiktokCount:"",
        twitterCount:"",
        raditCount:"",
      })
    }else{
      returnArr[itemIndex].totalCount=returnArr[itemIndex].totalCount+1
    }}
    }
  
  return returnArr;
};

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
  var filterEnd=dateList[i]?dateList[i]:endDate
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

    const resResitl=await createFullAutoUserJourney(sortedfilteredEvents,existingWebUser.Items[0].domain,filterEnd)
  finalResultRes.push({result:resResitl,dateRange:i==0?`until ${filterEnd}`:i==dateList.length+1?`${filterStart} to present`:`${filterStart} to ${filterEnd}`})
}}

    return res.status(200).send({ userJourney: finalResultRes });


  } catch (error) {
    return res.status(500).send({ message: "An error occured!", error: error });
  }
};
