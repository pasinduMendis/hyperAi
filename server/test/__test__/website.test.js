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


describe("website APIs", ()=>{
    it("get website by userId API",async ()=>{
        const response=await request(app).get("/.netlify/functions/website/getWebsiteByUserId").set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')


    it("page visit data collecting API",async ()=>{
        const response=await request(app).post("/.netlify/functions/website/initializeUrl").send({
            
                websiteId: "f697c974-f319-47d4-a476-bc7433fb26de",
                userId: "0dcdac2a-dde3-4bc0-acc3-c7fa9ab01fb6",
                uuId: "0380e657-fdaf-443b-a877-6d9177b5ca5b",
                isLoadedHyper: false,
                url: "accently-mytest.netlify.app/",
                domain: "https://accently-mytest.netlify.app/",
                utm_params: null,
                source: "",
                clickEvents: {
                    anchors: [
                        {
                            text: "Home",
                            nodename: "A"
                        },
                        {
                            text: "About Us",
                            nodename: "A"
                        },
                        {
                            text: "Mission",
                            nodename: "A"
                        },
                        {
                            text: "Pricing",
                            nodename: "A"
                        },
                        {
                            text: "Get Early Access",
                            nodename: "A"
                        },
                        {
                            text: "test ",
                            nodename: "A"
                        }
                    ],
                    buttons: [
                        {
                            text: "Test",
                            nodename: "BUTTON"
                        },
                        {
                            text: "TestRReaed",
                            nodename: "BUTTON"
                        },
                        {
                            text: "TestDTTDT",
                            nodename: "BUTTON"
                        },
                        {
                            text: "testXYZAOJHYYTGGF",
                            nodename: "BUTTON"
                        }
                    ],
                    formSubmits: [
                        {
                            text: "Submit",
                            nodename: "INPUT"
                        },
                        {
                            text: "Submit",
                            nodename: "INPUT"
                        }
                    ]
                },
                screenshot: "need to send screenshot as a base64image",
                cssLinks: [
                    "https://accently-mytest.netlify.app/css/normalize.css",
                    "https://accently-mytest.netlify.app/css/webflow.css",
                    "https://accently-mytest.netlify.app/css/accently.webflow.css",
                    "https://fonts.googleapis.com/css?family=Montserrat:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic%7CPT+Sans:400,400italic,700,700italic%7CRubik:300,regular,500,600,700,800,900%7CInter:100,200,300,regular,500,600,700,800,900%7CMulish:200,300,regular,500,600,700,800,900%7CManrope:200,300,regular,500,600,700,800%7CRoboto:100,300,regular,500,700,900%7CPoppins:300,regular,500,600,700,800,900%7CInter:300,regular,500,600,700,800,900%7CHind:regular,500,600,700%7CHind:300,regular%7CPlayfair+Display:regular,500,600,700,800,900%7CSpace+Grotesk:regular,500,600,700"
                ],
                socialRef: "",
                socialUtms: "null"
            
            
            
        })
        
        expect(response.statusCode).toEqual(200)
    },'300000')


    it("click event data collecting API",async ()=>{
        const response=await request(app).post("/.netlify/functions/website/trackEvent").send({
            
                websiteId: "f697c974-f319-47d4-a476-bc7433fb26de",
                userId: "0dcdac2a-dde3-4bc0-acc3-c7fa9ab01fb6",
                domain: "https://accently-mytest.netlify.app/",
                events: {
                    type: "click",
                    baseURI: "accently-mytest.netlify.app/",
                    innerText: "Submit",
                    outerText: "Submit",
                    eventLog: {
                        "__hj_mutation_summary_node_map_id__": 213
                    }
                },
                uuId: "6cc07a77-df02-413b-8ba4-b10d5fd98d5f",
                isLoadedHyper: true,
                socialRef: "",
                socialUtms: "null"
            
            
        })
        
        expect(response.statusCode).toEqual(200)
    },'300000')


    it("get generate pixelId API",async ()=>{
        const response=await request(app).get("/.netlify/functions//website/generatePixelId").set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')

    it("add domain API",async ()=>{
        const response=await request(app).post("/.netlify/functions/website/addDomain").send({
                domain: "www.accently-mytest.netlify.app"
               
        }).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')

    it("cverify pixel API",async ()=>{
        const response=await request(app).post("/.netlify/functions/website/verifyPixel").send({
            
                websiteId:"f697c974-f319-47d4-a476-bc7433fb26de"
            
        }).set("Authorization",accessToken)
        
        expect(response.statusCode).toEqual(200)
    },'300000')


})