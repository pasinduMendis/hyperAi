require("dotenv").config();
const dynamoClient = require("../../db/dbconfig");


async function getDynamoScanMultipleleData(data) {

  var scanData=data
  let returnData = await dynamoClient.scan(scanData);

  //console.log("returnData :",returnData)
  if (
    typeof returnData.LastEvaluatedKey != "undefined"
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

exports.getCountWithTraffic = async (req, res) => {
const userId = req.userId;
const websiteId = req.params.websiteId;
const journeys = req.body.steps;
const refSource=req.body.source;
const utmParams=req.body.utm_params;
try {

  var pageEventsData = {
    FilterExpression: "sk=:sk AND begins_with(pk, :pk)",
    ExpressionAttributeValues: {
      ":sk": "WEBSITE#" + websiteId,
      ":pk": "PE#",
    },
  };
  var pageEvents1 = await getDynamoScanMultipleleData(pageEventsData)

  const testUtms=async (utmDb,utmJourney)=>{
      if(!utmDb){
          return false
      }
      let paramString = utmDb.split("?")[1]
      let queryString = new URLSearchParams(paramString);
      var utmParamString='?'
      var spaceReplace=''
      for (let pair of queryString.entries()) {
        if(pair[0]!='fbclid'){
          utmParamString=utmParamString=='?'?utmParamString+pair[0]+'='+pair[1]:utmParamString+'&'+pair[0]+'='+pair[1]
        }
        
      }
      spaceReplace=utmParamString.replace(/\ /g, '+')
      if(spaceReplace==utmJourney){
          return true
      }else{
          return false
      }
  }

  const getSessionIds = async (events) => {
    var arr = [];
    for (let i = 0; events.length > i; i++) {
      if (arr.indexOf(events[i].sessionId) == -1) {
        arr.push(events[i].sessionId);
      }
    }
    return arr;
  };


  //calculte date gap
  const calculateDateGap = async (today, eventDate) => {
    const dateGap = today.getTime() - eventDate.getTime();
    const result = dateGap / (1000 * 60 * 60 * 24);
    return result;
  };

  const groupDatabysession = async (events) => {
    const grouped = [];
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
      var filteredData = [];
      for (let i = 0; i < sortedArr.length; i++) {
        const gap = await calculateDateGap(
          new Date(),
          new Date(sortedArr[i].createdAt)
        );
        if (gap < 31) {
          filteredData.push(sortedArr[i]);
        }else{
          filteredData.push(sortedArr[i]);
        }
      }
      grouped.push({
        seesionId: sessions[i],
        items: filteredData,
      });
    }
    return grouped;
  };

  const mapData = async (journeySteps, events) => {
    var counts = {};
    var updateStepsResult = journeySteps;
    for (let i = 0; journeySteps.length > i; i++) {
      counts[`${i}`] = 0;
      updateStepsResult[i] = { ...updateStepsResult[i], count: 0 };
    }
    const groups = await groupDatabysession(events);
    for (let j = 0; groups.length > j; j++) {
      var tempArr = [];

      for (let i = 0; journeySteps.length > i; i++) {
        const result = await matchData(
          journeySteps[i],
          tempArr,
          groups[j].items,
          i
        );
        if (result.Tempcount == 0) {
          break;
        } else {
          counts[`${i}`] = counts[i]
            ? counts[i] + result.Tempcount
            : result.Tempcount;
          tempArr = result.NewprevEventArrIndex;
          updateStepsResult[i] = {
            ...updateStepsResult[i],
            count: counts[`${i}`],
          };
        }
      }
    }
    return updateStepsResult;
  };

  const matchData = async (journeyItem, prevEnventArrIndex, events,journeyStepIndex) => {
    var Tempcount = 0;
    var NewprevEventArrIndex = [];
    if (prevEnventArrIndex.length > 0) {
      
      for (let i = 0; prevEnventArrIndex.length > i; i++) {
        if(utmParams){
          const isUtmMatch=await testUtms(events[prevEnventArrIndex[i]]?.utm_params,utmParams)
          const isUtmMatch2=await testUtms(events[prevEnventArrIndex[i]]?.socialUtms,utmParams)
          
          if(journeyItem.metric == "pageVisit" &&
          journeyItem.metric == events[prevEnventArrIndex[i]]?.type &&
          journeyItem.url == events[prevEnventArrIndex[i]]?.baseURI && (isUtmMatch||isUtmMatch2)){
        Tempcount = Tempcount + 1;
        NewprevEventArrIndex.push(events[prevEnventArrIndex[i]] + 1);
          }else if (
            journeyItem.metric == "click" &&
            journeyItem.metric == events[prevEnventArrIndex[i]]?.type &&
            journeyItem.url == events[prevEnventArrIndex[i]]?.baseURI &&
            journeyItem.clickEvent == events[prevEnventArrIndex[i]]?.innerText && (isUtmMatch||isUtmMatch2)
          ) {
            Tempcount = Tempcount + 1;
          NewprevEventArrIndex.push(events[prevEnventArrIndex[i]] + 1);
          }
      }
      else if(refSource){
          if(journeyItem.metric == "pageVisit" &&
          journeyItem.metric == events[prevEnventArrIndex[i]]?.type &&
          journeyItem.url == events[prevEnventArrIndex[i]]?.baseURI && (events[prevEnventArrIndex[i]]?.source==refSource ||events[prevEnventArrIndex[i]]?.socialRef==refSource )){
            Tempcount = Tempcount + 1;
            NewprevEventArrIndex.push(prevEnventArrIndex[i] + 1);
          }else if (
            journeyItem.metric == "click" &&
            journeyItem.metric == events[prevEnventArrIndex[i]]?.type &&
            journeyItem.url == events[prevEnventArrIndex[i]]?.baseURI &&
            journeyItem.clickEvent == events[prevEnventArrIndex[i]]?.innerText && (events[prevEnventArrIndex[i]]?.source==refSource ||events[prevEnventArrIndex[i]]?.socialRef==refSource)
          ) {
            Tempcount = Tempcount + 1;
          NewprevEventArrIndex.push(prevEnventArrIndex[i] + 1);
          }
      }else if (
          journeyItem.metric == "pageVisit" &&
          journeyItem.metric == events[prevEnventArrIndex[i]]?.type &&
          journeyItem.url == events[prevEnventArrIndex[i]]?.baseURI
        ) {
          Tempcount = Tempcount + 1;
          NewprevEventArrIndex.push(prevEnventArrIndex[i] + 1);
        } else if (
          journeyItem.metric == "click" &&
          journeyItem.metric == events[prevEnventArrIndex[i]]?.type &&
          journeyItem.url == events[prevEnventArrIndex[i]]?.baseURI &&
          journeyItem.clickEvent == events[prevEnventArrIndex[i]]?.innerText
        ) {
          Tempcount = Tempcount + 1;
          NewprevEventArrIndex.push(prevEnventArrIndex[i] + 1);
        }
      }
      if (Tempcount != 0) {
        return { Tempcount, NewprevEventArrIndex };
      } else {
        return { Tempcount, NewprevEventArrIndex };
      }
    } else {
      for (let i = 0; events.length > i; i++) {
        
          if(utmParams){
              const isUtmMatch=await testUtms(events[i]?.utm_params,utmParams)
              const isUtmMatch2=await testUtms(events[i]?.socialUtms,utmParams)
              if(journeyItem.metric == "pageVisit" &&
              journeyItem.metric == events[i]?.type &&
              journeyItem.url == events[i]?.baseURI && (isUtmMatch||isUtmMatch2)){
                
                  Tempcount = Tempcount + 1;
                  NewprevEventArrIndex.push(i + 1);
              }else if (
                journeyItem.metric == "click" &&
                journeyItem.metric == events[i]?.type &&
                journeyItem.url == events[i]?.baseURI &&
                journeyItem.clickEvent == events[i]?.innerText && (isUtmMatch||isUtmMatch2)
              ) {
                Tempcount = Tempcount + 1;
                NewprevEventArrIndex.push(i + 1);
              }
          }
          else if(refSource){
              if(journeyItem.metric == "pageVisit" &&
              journeyItem.metric == events[i]?.type &&
              journeyItem.url == events[i]?.baseURI && (events[i]?.source==refSource ||events[i]?.socialRef==refSource )){
                  Tempcount = Tempcount + 1;
                  NewprevEventArrIndex.push(i + 1);
              }else if (
                journeyItem.metric == "click" &&
                journeyItem.metric == events[i]?.type &&
                journeyItem.url == events[i]?.baseURI &&
                journeyItem.clickEvent == events[i]?.innerText && (events[i]?.source==refSource ||events[i]?.socialRef==refSource)
              ) {
                
                Tempcount = Tempcount + 1;
                NewprevEventArrIndex.push(i + 1);
              }
          }
        else if (
          journeyItem.metric == "pageVisit" &&
          journeyItem.metric == events[i]?.type &&
          journeyItem.url == events[i]?.baseURI
        ) {
          Tempcount = Tempcount + 1;
          NewprevEventArrIndex.push(i + 1);
        } else if (
          journeyItem.metric == "click" &&
          journeyItem.metric == events[i]?.type &&
          journeyItem.url == events[i]?.baseURI &&
          journeyItem.clickEvent == events[i]?.innerText
        ) {
          Tempcount = Tempcount + 1;
          NewprevEventArrIndex.push(i + 1);
        }
      }
      if (Tempcount != 0) {
        return { Tempcount, NewprevEventArrIndex };
      } else {
        return { Tempcount, NewprevEventArrIndex };
      }
    }
  };

  const finalRes = await mapData(journeys, pageEvents1.Items);
  return res.status(200).send({ userJourney: finalRes });
} catch (error) {
  console.log(error);
  return res.status(500).send({ message: "An error occured!", error: error });
}
};
