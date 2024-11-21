import {Context } from "koa";
import cognitoApp from "../services/cognito";
import { UserService } from "../services/users";

interface authBody {
    name:string,
    email:string,
    password:string,
    role:"admin" | "usuario",
}

export default async (ctx: Context) => {
    try {

        const email = (ctx.request.body as authBody).email;
        const password= (ctx.request.body as authBody).password;
        var role = (ctx.request.body as authBody).role;
    
        if(!email || !password){ ctx.status = 404; ctx.body = {status:404,message:"email or password password"}; return }
    
        const cognito = new cognitoApp();
        const userService = new UserService();

        const findUser = await userService.findByEmail(email);

        if(findUser === null){
            //User not found on database

            var {role, name} = (ctx.request.body as authBody);

            if(!name || name === ""){ ctx.status = 404; ctx.body = {status:404,message:"name is required"}; return }
            if(role !== "admin" && role !== "usuario"){ role = "usuario" }

            const singUp = await cognito.signUp(email,password,role);
            const user = await userService.create({email,role,name,isOnboarded:false,createdAt:new Date(),updatedAt:new Date()},password);
        }

        const user = await cognito.signIn(email,password);

        ctx.status = user.status;
        ctx.body = user;

    } catch (err:any) {

        console.log(err)
        ctx.status = 500;
        ctx.body = {status:500,message:err.message};
        
    }
}