import {Context } from "koa";
import cognitoApp from "../services/cognito";

interface authBody {
    email:string,
    password:string,
    code:string
}

export default async (ctx: Context) => {
    try {

        const email = (ctx.request.body as authBody).email;
        const password= (ctx.request.body as authBody).password;
        const code = (ctx.request.body as authBody).code;
    
        if(!email || !password){ ctx.status = 404; ctx.body = {status:404,message:"email or password password"}; return }
    
        const cognito = new cognitoApp();
        const user:any = await cognito.login(email,password);
        console.log(user.getIdToken().payload);
        //console.log(user.getIdToken().payload); Can be used to get user scopes and groups

        ctx.body = {status:200,access_token:user.getAccessToken().getJwtToken()};
    } catch (err) {
        console.log(err)

        if(err.message){
            ctx.status = 401;
            ctx.body = {status:401,message:err.message};
            return
        }

        ctx.status = 500;
        ctx.body = {status:500,message:"Internal server error"};
        
    }
}