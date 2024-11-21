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

router.post("/test-register",async(ctx:Context,next:Next)=>{
    const Cognito = new cognitoApp();

    interface authBody {
        email:string,
        password:string,
        role:"admin" | "usuario"
    }

    const { email, password, role } = ctx.request.body as authBody;

    const singUp = await Cognito.signUp(email,password,role);

    return ctx.body = singUp;
})

router.post("/test-login",async(ctx:Context,next:Next)=>{
    const Cognito = new cognitoApp();

    interface authBody {
        email:string,
        password:string
    }

    const { email, password } = ctx.request.body as authBody;

    const singUp = await Cognito.signIn(email,password);

    return ctx.body = singUp;
})

router.post("/test-user-data",async(ctx:Context,next:Next)=>{
    const Cognito = new cognitoApp();

    interface authHeaders {
        authorization:string
    }

    const { authorization } = ctx.request.headers as authHeaders;

    const singUp = await Cognito.getUserData(authorization.split(' ')[1]);

    return ctx.body = singUp;
})

router.post("/create-user-on-db",async(ctx:Context,next:Next)=>{
    
    const userRepository = AppDataSource.getRepository(User);
    try {
        
        const user = userRepository.create({
            name:"Renan Joia",
            email:"renanvieirajoia@gmail.com",
            role:"admin",
            isOnboarded:false,
            createdAt:new Date(),
            updatedAt:new Date()
        });

        await userRepository.save(user);

        return ctx.body = {status:200,user:user};
    } catch (err:any) {
        console.log(err)
        const usuarios = await userRepository.find();
        return ctx.body = {status:500,usuarios:usuarios};
    }
})

app.use(router.routes());

const start = async ()=>{
    console.log(process.env.DB_HOST)
    try {
        await AppDataSource.initialize();
        console.log("Data source initialized");

        app.listen(3000, () => {console.log("Koa server is running on port 3000")});

        
    } catch (error:any) {
        console.log(error)
    }
}

start()