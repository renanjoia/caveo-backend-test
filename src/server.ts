import dotenv from "dotenv";
dotenv.config();

import Koa from "koa";
import Router from "koa-router";
import {Context,Next} from "koa";
import bodyParser from "koa-bodyparser";
import cognitoApp from "./services/cognito";
import {AppDataSource} from "./database/data-source";
import { User } from "./entities/User";

const app = new Koa();
const router = new Router();

app.use(bodyParser());

router.post("/auth",require("./controllers/post.auth").default);
router.get("/me",require("./midlewares/validateIsValidUser").default,require("./controllers/get.me").default);
router.get("/users",require("./midlewares/validateIsValidUser").default,require("./midlewares/validateIsAdminUserScope").default,require("./controllers/get.users").default);
router.put("/edit-account",require("./midlewares/validateIsValidUser").default,require("./controllers/put.edit-account").default);

app.use(router.routes());

const start = async ()=>{
    console.log(process.env.DB_HOST)
    try {
        await AppDataSource.initialize();
        console.log("Data source initialized");

        app.listen(80, () => {console.log("Koa server is running on port 80")});

        
    } catch (error:any) {
        console.log(error)
    }
}

start()