const app= require("../app")
const request=require("supertest")

describe("Auth APIs",()=>{
    it("test user sign up API",async ()=>{
        const response=await request(app).post("/.netlify/functions/auth/signUp").send({
            name :"test",
            email:"testtesttest0000910558@gmail.com",
            password:"12345"
        }
        )
        
        expect(response.statusCode).toEqual(200)
    },'300000')

    it("test user sign in API",async ()=>{
        const response=await request(app).post("/.netlify/functions/auth/signIn").send({
            email: "trafficTest4@gmail.com",
            password: "12345"
        })
        expect(response.statusCode).toEqual(200)
    },'300000')
})
