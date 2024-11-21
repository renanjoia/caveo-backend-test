import {Context } from "koa";
import { UserService } from "../services/users";

interface authHeaders {
    authorization:string
}

export default async (ctx: Context) => {
    try {
        const userService = new UserService();
        const users = await userService.getAllUsers();
        
        return ctx.body = users;
    } catch (err:any) {

        console.log(err)
        ctx.status = 500;
        ctx.body = {status:500,message:err.message};
    }
}