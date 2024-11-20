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
        const user:any = await cognito.getUser(jwtAccessToken);

        console.log(user)

        //console.log(user.getIdToken().payload); Can be used to get user scopes and groups

        ctx.body = {status:200,access_token:user};
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