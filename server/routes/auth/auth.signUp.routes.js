const controller = require("../../controllers/auth/auth.signUp.controller");
const { authValidator } = require("../../middlewares");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });
    app.post("/auth/signUp" ,[authValidator.verifySignUpParams, authValidator.checkDuplicateUsers], controller.signUp);

}