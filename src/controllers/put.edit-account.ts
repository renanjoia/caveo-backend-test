import {Context } from "koa";
import { UserService } from "../services/users";
import { User } from "../entities/User";
import cognitoIntegration from "../services/cognito";

interface authHeaders {
    authorization:string
}

interface editAccountBody {
    name:string,
    role?:string
}

const Cognito = new cognitoIntegration

export default async (ctx: Context) => {
    try {
        
        const { authorization } = ctx.request.headers as authHeaders;

        const userService = new UserService();

        const isAdmin = await userService.validateUserAdminScopeByCognitoJwt(authorization.split(' ')[1]);
        const user = await userService.getUserByCognitoJwt(authorization.split(' ')[1]);

        if(user.status !== 200){
            ctx.status = user.status;
            ctx.body = user.message;
            return
        }
        

        var currentUser = user.user as User;
        var roleChanged = false;
        var currentCognitoScope = ""

        if(isAdmin === true){
            var { name,role } = (ctx.request.body as editAccountBody);

            if(!name && !role){ ctx.status = 400; ctx.body = {status:400,message:"Name or role is required"}; return }
            if(!role){ role = currentUser.role }
            if(role !== currentUser.role && (role === 'admin' || role === 'usuario')){ roleChanged = true; currentCognitoScope = currentUser.role }
            if(currentUser.isOnboarded === false && name !== currentUser.name){ currentUser.isOnboarded = true }

            if(roleChanged === true){
                await Cognito.removeUserFromGroupByEmail(currentUser.email,currentCognitoScope);
                await Cognito.addUserFromGroupByEmail(currentUser.email,role);
            }

            currentUser.name = name;
            currentUser.role = !roleChanged ? currentUser.role : role;

            await userService.update(currentUser);

            
            
        }else{
            var { name } = (ctx.request.body as editAccountBody);

            if(!name){ ctx.status = 400; ctx.body = {status:400,message:"Name is required"}; return }
            if(currentUser.isOnboarded === false && name !== currentUser.name){ currentUser.isOnboarded = true }

            currentUser.name = name;
            await userService.update(currentUser);
        }

        ctx.status = 200;
        ctx.body = {status:200,message:"User updated successfully"};
        return
        
    } catch (err:any) {

        console.log(err)
        ctx.status = 500;
        ctx.body = {status:500,message:err.message};
    }
}