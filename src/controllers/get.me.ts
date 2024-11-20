import {Context } from "koa";
import cognitoApp from "../services/cognito";

interface authHeaders {
    authorization:string
}

export default async (ctx: Context) => {
    try {

        const authorization = (ctx.request.body as authHeaders).authorization.split(' ')[1];
        
        if(!authorization){ ctx.status = 404; ctx.body = {status:404,message:"Authorization header not found"}; return }
    
        const cognito = new cognitoApp();
        const user:any = await cognito.signIn(email,password);

        //console.log(user.getIdToken().payload); Can be used to get user scopes and groups

        ctx.body = {status:200,access_token:user.getIdToken().getJwtToken()};
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