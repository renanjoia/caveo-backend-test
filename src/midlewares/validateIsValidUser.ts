import {Context, Next} from "koa";
import cognitoApp from "../services/cognito";

interface authHeaders {
    authorization:string
}

export default async (ctx: Context, next: Next) => {
    try {

        const authorization = (ctx.request.headers as authHeaders).authorization

        if(!authorization){ ctx.status = 404; ctx.body = {status:404,message:"Authorization header not found"}; return }
        
        const jwtAccessToken = (ctx.request.headers as authHeaders).authorization.split(' ')[1];
        if(!jwtAccessToken){ ctx.status = 404; ctx.body = {status:404,message:"Authorization token on header is not valid"}; return }

        const cognito = new cognitoApp();
        const user = await cognito.getUserData(jwtAccessToken);

        if(user.status !== 200){
            ctx.status = 401;
            ctx.body = {status:401,message:"Unauthorized access by policy"};
        }

        await next();
    } catch (err:any) {
        console.log(err)
        ctx.status = 500;
        ctx.body = {status:500,message:err.message??'Internal server error'};
        
    }
}