import dotenv from "dotenv";
dotenv.config();

import Koa from "koa";
import Router from "koa-router";
import {Context,Next} from "koa";
import bodyParser from "koa-bodyparser";
import cognitoApp from "./services/cognito";

const app = new Koa();
const router = new Router();

app.use(bodyParser());

router.post("/auth",require("../src/controllers/post.auth").default);
router.get("/me",require("./midlewares/validateUser").default,require("../src/controllers/get.me").default);

router.post("/test-register",async(ctx:Context,next:Next)=>{
    const Cognito = new cognitoApp();

    const singUp = await Cognito.signUp(ctx.request.body.email,ctx.request.body.password);

    return ctx.body = singUp;
})

router.post("/test-login",async(ctx:Context,next:Next)=>{
    const Cognito = new cognitoApp();

    const singUp = await Cognito.login(ctx.request.body.email,ctx.request.body.password);

    return ctx.body = singUp;
})

router.post("/test-user-data",async(ctx:Context,next:Next)=>{
    const Cognito = new cognitoApp();

    const singUp = await Cognito.getUserData(ctx.request.headers.authorization.split(' ')[1]);

    return ctx.body = singUp;
})

app.use(router.routes());

app.listen(3000, () => {console.log("Koa server is running on port 3000")});