import {Context } from "koa";
import cognitoApp from "../services/cognito";

interface authBody {
    email:string,
    password:string,
    role:"admin" | "usuario"
}

export default async (ctx: Context) => {
    try {

        const email = (ctx.request.body as authBody).email;
        const password= (ctx.request.body as authBody).password;
        const role= (ctx.request.body as authBody).role;
    
        if(!email || !password){ ctx.status = 404; ctx.body = {status:404,message:"email or password password"}; return }
    
        const cognito = new cognitoApp();
        
        const trySignUp = await cognito.signUp(email,password,role);
        
        const user = await cognito.signIn(email,password);

        ctx.status = user.status;
        ctx.body = user;

    } catch (err) {

        console.log(err)
        ctx.status = 500;
        ctx.body = {status:500,message:err.message};
        
    }
}