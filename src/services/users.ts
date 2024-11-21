import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import cognitoIntegration from "./cognito";

export class UserService {
    
    constructor() {
        
    }

    public async create(user:{name:string,email:string,role:string,isOnboarded:boolean,createdAt:Date,updatedAt:Date},password:string):Promise<User> {
        const createUserCognito = await this.cognito.signUp(user.email,password,user.role)
        const createUserDB = await AppDataSource.getRepository(User).save(user);
        return createUserDB
    }

    public async findByEmail(email: string):Promise<object[]> {
        return await AppDataSource.getRepository(User).findBy({ email });
    }

    public async update(user: User):Promise<User> {
        return await AppDataSource.getRepository(User).save(user);
    }

    public async getAllUsers():Promise<User[]> {
        return await AppDataSource.getRepository(User).find();
    }

    public async getUserByCognitoJwt(jwt: string):Promise<{status:number,message?:string,user?:User|null}> {
        try {
            interface authHeaders {
                authorization:string
            }

            const Cognito = new cognitoIntegration();

            const userData = await Cognito.getUserData(jwt);

            if(userData.status !== 200 || !userData.data || !userData.data.UserAttributes){ return {status:401,message:"Invalid token"} }

            const email = userData.data.UserAttributes[0].Value;

            if(!email){ return {status:404,message:"User email not found"} }

            const users = await this.findByEmail(email);

            if(users.length === 0){ return {status:404,message:"User not found"} }

            return {status:200,user:users[0]}
            
        } catch (error:any) {
            console.log(error)
            return {status:500,message:error.message}
        }
    }

    public async getUserScopeByCognitoJwt(jwt: string):Promise<boolean> {
        try {
            const user = await this.getUserByCognitoJwt(jwt);

            const Cognito = new cognitoIntegration();

            if(user.status !== 200 || !user.user){ return false }

            const isOnAdminGroup = await Cognito.verifyIsUserInGroup(user.user.email,"admin");

            if(!isOnAdminGroup || !isOnAdminGroup.userIsInsideThatGroup){ return false }
            
            return true
        } catch (error:any) {
            console.log(error)
            return false
        }
    }
}