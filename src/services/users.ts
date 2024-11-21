import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import cognitoIntegration from "./cognito";

const Cognito = new cognitoIntegration();

export class UserService {
    
    constructor() {
        
    }

    public async create(user:{name:string,email:string,role:string,isOnboarded:boolean,createdAt:Date,updatedAt:Date},password:string):Promise<User> {
        const createUserCognito = await Cognito.signUp(user.email,password,user.role)
        const createUserDB = await AppDataSource.getRepository(User).save(user);
        return createUserDB
    }

    public async findByEmail(email: string):Promise<User | null> {
        const users = await AppDataSource.getRepository(User).findBy({ email });
        return users.length > 0 ? users[0] : null;
    }

    public async update(user: User):Promise<User> {
        return await AppDataSource.getRepository(User).save(user);
    }

    public async getAllUsers():Promise<User[]> {
        return await AppDataSource.getRepository(User).find();
    }

    public async getUserByCognitoJwt(jwt: string):Promise<{status:number,message?:string,user?:User|null}> {
        try {
           
            const userData = await Cognito.getUserData(jwt);

            if(userData.status !== 200 || !userData.data || !userData.data.UserAttributes){ return {status:401,message:"Invalid token"} }

            const email = userData.data.UserAttributes[0].Value;

            if(!email){ return {status:404,message:"User email not found"} }
            const user = await this.findByEmail(email);

            if(!user){ return {status:404,message:"User not found"} }

            return {status:200,user}
            
        } catch (error:any) {
            console.log(error)
            return {status:500,message:error.message}
        }
    }

    public async validateUserAdminScopeByCognitoJwt(jwt: string):Promise<boolean> {
        try {
            const user = await this.getUserByCognitoJwt(jwt);

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