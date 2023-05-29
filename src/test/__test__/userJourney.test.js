const app= require("../app")
const request=require("supertest")

 let accessToken=""

beforeAll(async () => {
    const response = await request(app).post("/.netlify/functions/auth/signIn").send({
        email: "trafficTest4@gmail.com",
        password: "12345"
    });
    accessToken = JSON.parse(response.text).accessToken;
}, 300000); 


describe("userJournry APIs", ()=>{
    it("get all manual user Journey API",async ()=>{
        const response=await request(app).get("/.netlify/functions/userJourneys/getJourneyByWebsiteId/f697c974-f319-47d4-a476-bc7433fb26de").set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')


    it("create manual user Journey API",async ()=>{
        const response=await request(app).post("/.netlify/functions/userJourneys/createJourney/f697c974-f319-47d4-a476-bc7433fb26de").send({
            
                steps: [
                    {
                        id: "",
                        url: "accently-mytest.netlify.app/",
                        metric: "pageVisit",
                        clickEvent: "",
                        stepName: "index vist"
                    },
                    {
                        id: "",
                        url: "accently-mytest.netlify.app/",
                        metric: "click",
                        clickEvent: "Submit",
                        stepName: "submit",
                        count: 0
                    }
                ],
                utm_params: "",
                source: "",
                funnelMode: "manual",

            
        }).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')


    it("get all automatic Journey API",async ()=>{
        const response=await request(app).post("/.netlify/functions/userJourneys/getJourneyByWebsiteIdAuto/f697c974-f319-47d4-a476-bc7433fb26de").send({
            
        }).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')


    it("get all automatic Journey with filter API",async ()=>{
        const response=await request(app).post("/.netlify/functions/userJourneys/getJourneyByWebsiteIdAuto/f697c974-f319-47d4-a476-bc7433fb26de").send({
            journey: [
                {
                    id: "",
                    url: "accently-mytest.netlify.app/",
                    metric: "pageVisit",
                    clickEvent: "",
                    stepName: "index vist"
                },
                {
                    id: "",
                    url: "accently-mytest.netlify.app/",
                    metric: "click",
                    clickEvent: "Submit",
                    stepName: "submit",
                    count: 0
                }
            ],
               
        }).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')

    it("update manual userjourney API",async ()=>{
        const response=await  request(app).put("/.netlify/functions/userJourneys/updateJourney/f697c974-f319-47d4-a476-bc7433fb26de/55bb66a2-4882-484a-a26b-32224273cb3e?").send({
            steps: [
                {
                    clickEvent: "",
                    id: "",
                    metric: "pageVisit",
                    stepName: "vist update test",
                    url: "accently-mytest.netlify.app/"
                },
                {
                    count: 0,
                    clickEvent: "Submit",
                    id: "",
                    metric: "click",
                    stepName: "Submit",
                    url: "accently-mytest.netlify.app/"
                },
                {
                    count: 0,
                    clickEvent: "",
                    id: "",
                    metric: "pageVisit",
                    stepName: "visitEarlyAcc",
                    url: "accently-mytest.netlify.app/early-access"
                },{
                    clickEvent: "",
                    id: "",
                    metric: "pageVisit",
                    stepName: "vist update test",
                    url: "accently-mytest.netlify.app/"
                }
            ]
               
        }).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')

    
    it("delete user Journey API",async ()=>{
        const response=await request(app).delete("/.netlify/functions/userJourneys/deleteJourney?journeyId=cea5471b-65d2-4e31-a075-7b3531dd5a20&websiteId=f697c974-f319-47d4-a476-bc7433fb26de").set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')
})