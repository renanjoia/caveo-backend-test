import {Context } from "koa";
import { UserService } from "../services/users";

interface authHeaders {
    authorization:string
}

export default async (ctx: Context) => {
    try {
        
        const { authorization } = ctx.request.headers as authHeaders;

        const userService = new UserService();

        const user = await userService.getUserByCognitoJwt(authorization.split(' ')[1]);

        ctx.status = user.status;
        ctx.body = user.user??user.message;
        return
        
    } catch (err:any) {

        console.log(err)
        ctx.status = 500;
        ctx.body = {status:500,message:err.message};
    }
}