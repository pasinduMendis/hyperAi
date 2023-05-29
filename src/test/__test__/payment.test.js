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

describe("payment APIs", ()=>{
    it("check is subscribed API",async ()=>{
        const response=await request(app).post("/.netlify/functions/payment/isSubscribed").send({
            email:"trafficTest4@gmail.com"
        }
        ).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')

})