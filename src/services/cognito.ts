import { CognitoIdentityProviderClient, SignUpCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, InitiateAuthCommand, AdminConfirmSignUpCommand, GetUserCommand, AdminListGroupsForUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoConfig = {
    //Region and credentials from AWS
    region:process.env.AWS_REGION,
    credential:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
}

//Get the client id and user pool id from .env file -> This data can be found in AWS Cognito
const clientId = process.env.COGNITO_CLIENT_ID;

//Get the user pool id from .env file -> This data can be found in AWS Cognito
const userPoolId = process.env.COGNITO_USER_POOL_ID;

//Initialize a new client to integrate with AWS Cognito
const cognitoClient = new CognitoIdentityProviderClient(cognitoConfig);


//Class to integrate with AWS Cognito - I Had choose to use class to make it more organized
export default class cognitoIntegration{

    constructor(){}

    //Create a new user in cognito
    public async signUp(email:string, password:string,role:string):Promise<{status:number,message:string}>{
        try {
            
            //Validate if email and password was sent and is is not empty
            if(!email || !password || email === '' || password === ''){return {status:401,message:"Email or password not found or is invalid"}}

            //Create command to create a new user
            const singUpUserCommand = new SignUpCommand({
                ClientId: clientId,
                Username: email,
                Password: password,
                UserAttributes: [
                    { Name: 'email', Value: email }
                ]
            });

            //Send command to AWS
            await cognitoClient.send(singUpUserCommand);

            //Create command to confirm user email mannualhy to prevent that user need to confirm email
            const confirmSignUp = new AdminConfirmSignUpCommand({
                UserPoolId: userPoolId,
                Username: email
            });

            //Send command to AWS for confirm user email
            const response = await cognitoClient.send(confirmSignUp);
            console.log(response);        

            //Insert user in group 'usuario' - This is a custom group that I created to manage user scopes
            const insertUserOnUsuariosGroup = await this.addUserFromGroupByEmail(email,role??'usuario');

            //Function response with status 200 and message that user was created successfully
            return {status:200,message:"User created successfully"};

        } catch (err:any) {

            //Function response with status 500 and message that user was not created successfully
            console.log(err)
            return {status:500,message:err.message};
        }
    }

    //Sign in user in cognito and get the JWT Access token to response the request
    public async signIn(email:string, password:string){
        try {

            //Validate if email and password was sent and is is not empty
            if(!email || !password || email === '' || password === ''){return {status:401,message:"Email or password not found or is invalid"}}

            //Command to initiate auth with user and password
            const command = new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    'USERNAME': email,
                    'PASSWORD': password
                },
                ClientId: clientId
            });

            interface AuthResponse {
                AuthenticationResult: {
                    AccessToken: string;  // Corrigido de AccesToken para AccessToken
                    IdToken?: string;     // Opcional
                    RefreshToken?: string; // Opcional
                    ExpiresIn?: number;    // Opcional
                }
            }

            const response = await cognitoClient.send(command);

            const { AccessToken } = (response as AuthResponse).AuthenticationResult
            //response with 200 status if user was logged in successfully and the JWT Access token
            return {status:200,token:AccessToken};
        } catch (err:any) {
            //if error occurs, response with 500 status and the error message for more details
            return {status:500,message:err.message};
        }
    }

    //Get user data by JWT Access token
    public async getUserData(token:string){
        try {
            //Command to get user data by JWT Access token
            const comando = new GetUserCommand({
                AccessToken: token
            })
            //Send command to AWS
            const userData = await cognitoClient.send(comando);

            //Interface to define the response data to be returned
            interface  UserData{
                $metadata:object,
                UserAttributes:object[]
            }

            interface UserAttributes{
                Name:string,
                Value:string
            }

            //Get the user email from the response data
            const userAttributes = (userData as UserData).UserAttributes;
            const email =  (userAttributes[0] as UserAttributes).Value;

            //Command to get user groups by email - That info will help to know whats is the scopes of this user
            const userGroupsCommand = new AdminListGroupsForUserCommand({
                UserPoolId: userPoolId,
                Username: email
            })

            //Send command to AWS and receive user groups
            const userGroups = await cognitoClient.send(userGroupsCommand);

            //Send response with status 200 and user data and user groups
            return {status:200,data:userData,userGroups};
        } catch (err:any) {
            return {status:500,message:err.message};
        }
    }

    //This function add user in a group by email and target group name
    public async addUserFromGroupByEmail(email:string, group_name:string){
        try {
           
            //Create command to add user in group
            const command = new AdminAddUserToGroupCommand({
                UserPoolId: userPoolId,
                Username: email,
                GroupName: group_name
            });

            //Send command to AWS
            const response = await cognitoClient.send(command);
            
            //Return status 200 that request for AWS occurred successfully and the response
            return {status:200,response};

        } catch (err:any) {

            //Return status 500 that request for AWS occurred with error and the error message
            console.log(err)
            return {status:500,message:err.message};

        }
    }
    
    //This function remove user from group by email and target group name
    public async removeUserFromGroupByEmail(email:string, group_name:string){
        try {
            
            //Create command to remove user from group
            const command = new AdminRemoveUserFromGroupCommand({
                UserPoolId: userPoolId,
                Username: email,
                GroupName: group_name
            });

            //Send command to AWS
            const response = await cognitoClient.send(command);
            
            //Return status 200 that request for AWS occurred successfully and the response
            return {status:200,response};

        } catch (err:any) {

            //Return status 500 that request for AWS occurred with error and the error message
            console.log(err)
            return {status:500,message:err.message};

        }
    }
    
    //Verify if user is inside grupo by email and group name
    public async verifyIsUserInGroup(email:string, group_name:string):Promise<{status:number,userIsInsideThatGroup:boolean,message?:string}>{
        try {
            
            //Create commando to list groups for user
            const command = new AdminListGroupsForUserCommand({
                UserPoolId: userPoolId,
                Username: email
            })

            //Send command to AWS and get the response
            const response = await cognitoClient.send(command);

            //List all user groups in String Array format
            interface responseGroups{
                Groups:object[]
            }

            interface group{
                GroupName:string
            }

            const groups = (response as responseGroups).Groups.map(group=> (group as group).GroupName);

            //Return status 200 that request for AWS occurred successfully and a boolean that indicates if user is inside that group
            return {status:200,userIsInsideThatGroup:groups.includes(group_name)};

        } catch (err:any) {
            
            //Return status 500 that request for AWS occurred with error and the error message
            console.log(err)
            return {status:500,userIsInsideThatGroup:false,message:err.message};

        }
    }
}