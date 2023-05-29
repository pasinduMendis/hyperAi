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


describe("liveMetrics APIs", ()=>{
    it("liveMetric count API",async ()=>{
        const response=await request(app).post("/.netlify/functions/liveMetricsWithSource/f697c974-f319-47d4-a476-bc7433fb26de").send({
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
            source: ""
        }
        ).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')

})