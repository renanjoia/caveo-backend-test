import {Context, Next} from "koa";
import cognitoApp from "../services/cognito";
import { UserService } from "../services/users";

interface authHeaders {
    authorization:string
}

export default async (ctx: Context, next: Next) => {
    try {

        const authorization = (ctx.request.headers as authHeaders).authorization

        if(!authorization){ ctx.status = 404; ctx.body = {status:404,message:"Authorization header not found"}; return }
        
        const jwtAccessToken = (ctx.request.headers as authHeaders).authorization.split(' ')[1];
        
        const userService = new UserService();
        const isOnAdminGroup = await userService.getUserScopeByCognitoJwt(jwtAccessToken)

        if(isOnAdminGroup === false){ ctx.status = 401; ctx.body = {status:401,message:"Your scope cannot acces this endpoint"}; return }

        await next();
    } catch (err:any) {
        console.log(err)
        ctx.status = 500;
        ctx.body = {status:500,message:err.message??'Internal server error'};
        
    }
}