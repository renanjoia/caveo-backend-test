
import {Context,Next} from "koa";

export default async function validateAdminUser(ctx: Context, next: Next) {
    try {
        const token = ctx.headers.authorization.split(' ')[1];
        const user = await getUser(token);

        ctx.body = user;
        
    } catch (error) {
        ctx.status = 401
        ctx.body = {status:401,message:"Unauthorized"};
    }
}