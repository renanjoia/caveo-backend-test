import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoUserPool, CognitoUserAttribute , CognitoUser, AuthenticationDetails} from "amazon-cognito-identity-js"
import { CognitoIdentityProviderClient, SignUpCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand,
    InitiateAuthCommand,
    AdminConfirmSignUpCommand, // Para confirmar o usuário automaticamente
    GetUserCommand,
    AdminListGroupsForUserCommand
  } from "@aws-sdk/client-cognito-identity-provider";
import { access } from 'fs/promises';

const COGNITO_CONFIG = {
    region:"sa-east-1",
    credential:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
}

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const cognitoClient = new CognitoIdentityProviderClient(COGNITO_CONFIG);

export default class cognitoApp{

    private poolData:any;
    private userPool:any;

    constructor(){
        this.poolData = {
            UserPoolId : process.env.COGNITO_USER_POOL_ID,
            ClientId : process.env.COGNITO_CLIENT_ID
        }

        this.userPool = new CognitoUserPool(this.poolData)
        
    }

    public async signUp(email:string, password:string){
        try {
            
            const singUpUser = new SignUpCommand({
                ClientId: CLIENT_ID,
                Username: email,
                Password: password,
                UserAttributes: [
                    { Name: 'email', Value: email }
                ]
            });

            await cognitoClient.send(singUpUser);

            const confirmSignUp = new AdminConfirmSignUpCommand({
                UserPoolId: USER_POOL_ID,
                Username: email
            });

            await cognitoClient.send(confirmSignUp);

            return {status:200,message:"User created successfully"};

        } catch (err) {
            return {status:500,message:err.message};
        }
    }

    public async signIn(email:string, password:string){
        try {
            const auth = new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    'USERNAME': email,
                    'PASSWORD': password
                },
                ClientId: CLIENT_ID
            });

            const data = await cognitoClient.send(auth);
            console.log(data)
            return data.AuthenticationResult.AccessToken;
        } catch (err) {
            return {status:500,message:err.message};
        }
    }

    public async getUserData(token:string){
        try {
            const comando = new GetUserCommand({
                AccessToken: token
            })

            const data = await cognitoClient.send(comando);

            interface userAttributes {
                $metadata:object,
                UserAttributes:object[]
            }

            const email =  data.UserAttributes[0].Value;
            const userGroupsCommand = new AdminListGroupsForUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: email
            })

            const userGroups = await cognitoClient.send(userGroupsCommand);

            return {status:200,data,userGroups};
        } catch (err) {
            return {status:500,message:err.message};
        }
    }


    public async addUserFromGroupByEmail(email:string, group_name:string){
        try {
           
            const command = new AdminAddUserToGroupCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                GroupName: group_name
            });

            const response = await cognitoClient.send(command);
            
            return {status:200,response};

        } catch (err) {

            return {status:500,message:err.message};

        }
    }
    
    public async removeUserFromGroupByEmail(email:string, group_name:string){
        try {
           
            const command = new AdminRemoveUserFromGroupCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                GroupName: group_name
            });

            const response = await cognitoClient.send(command);
            
            return {status:200,response};

        } catch (err) {

            return {status:500,message:err.message};

        }
    }
    
    //Verify if user is inside grupo by email and group name
    public async verifyIsUserInGroup(email:string, group_name:string){
        try {
            
            //Create commando to list groups for user
            const command = new AdminListGroupsForUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: email
            })

            //Send command to AWS and get the response
            const response = await cognitoClient.send(command);

            //List all user groups in String Array format
            const groups = response.Groups.map(group => group.GroupName);

            //Return status 200 that request for AWS occurred successfully and a boolean that indicates if user is inside that group
            return {status:200,userIsInsideThatGroup:groups.includes(group_name)};

        } catch (err) {
            
            //Return status 500 that request for AWS occurred with error and the error message
            console.log(err)
            return {status:500,message:err.message};

        }
    }

    public async getUser(token:string){
        const verifier = CognitoJwtVerifier.create({
            userPoolId: process.env.COGNITO_USER_POOL_ID,
            clientId: process.env.COGNITO_CLIENT_ID,
            tokenUse:'access'
        })
            
        const payload = await verifier.verify(token);
        console.log("FORMAT ->",payload);
        return payload;
    }

    public async getUserRole(token:string){
        const verifier = CognitoJwtVerifier.create({
            userPoolId: process.env.COGNITO_USER_POOL_ID,
            clientId: process.env.COGNITO_CLIENT_ID,
            tokenUse:'access'
        })
            
        const payload = await verifier.verify(token);
        console.log("FORMAT ->",payload);
        return payload;
    }


    public async login (email:string, password:string){
        
        const authenticationDetails = new AuthenticationDetails({
            Username: email,
            Password: password
        });

        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: this.userPool
        });

        const data = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => resolve(result),
                onFailure: (err) => reject(err)
            });
        });

        return data;
    };
}