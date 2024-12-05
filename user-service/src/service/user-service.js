const UserRepository = require('../database/repository/user-repository.js');
const {sendToken , sendResetToken} = require('../utils');
const bcrypt = require('bcrypt');

class UserService {
    constructor(){
        this.repository = new UserRepository();
    }

    async createTable(userSchema){
        try{
            await this.repository.createTable(userSchema);
        }catch(ex){
            throw ex;
        }
    }

    async register(req,res) {
        try{
            const user = await this.repository.register(req,res);
            const token = await sendToken(user,res);
            return {
                user,
                token
            };

        } catch (ex) {
            throw ex;
        }
    }

    async signIn(req,res) {
        try{
            const {email,password} = req.body;
            const user = await this.repository.getUser({field:'email',value:email});

            if(user.rows.length == 0)
                throw (`Invalid credentials.`);
        
            const target = user.rows[0];
            const verdict = await bcrypt.compare(password,target.password);

            if(!verdict)
                throw (`Invalid credentials. User not authenticated.`);

            const token = await sendToken(target,res);
            return {
                user:target,
                token
            }

        } catch(ex) {
            throw ex;
        }
    }

    async logOut(res) {
        try{
            res.clearCookie("JWT_TOKEN")
        } catch(ex){
            throw ex;
        }
    }

    async getUser(fieldValue) {
        try{
            return await this.repository.getUser(fieldValue);
        } catch(ex){
            throw ex;
        }
    }

    // update self/target user
    async updateUser(objectid,JsonBody){
        try{
            // check if user exists 
            let {rows:users} = await this.getUser({
                field:'objectid',
                value:objectid
            });
            
            if(users.length == 0){
                throw `User with objectID ${objectid} does not exists`;
            }

            // Converting JSON Body into Array of key-value pair [[field1,valu1] , [field2 , value2]] 
            let ArrayBody = Object.entries(JsonBody);
            return await this.repository.updateUser(objectid,ArrayBody);
        } catch(ex){
            throw ex;
        }
    }

    // delete target user 
    async deleteUser(objectid) {
        try{
            await this.repository.deleteUser(objectid);
        } catch(ex) {
            throw ex;
        }
    }

    // forget password
    async forgetPassword(email){
        try{
            const users  = await this.repository.getUser({field:"email",value:email});

            if(users.rows.length == 0)
                throw (`User with ${email} mail id does not exist.`);
        
            const targetUser = users.rows[0];
            const { resetToken , tokenExpiry} = await sendResetToken(email);

            // converting the object into Array of a key-value pair 
            const ArrayBody = Object.entries({resetToken,tokenExpiry});
            const {firstname : targetUserName} = await this.repository.updateUser(targetUser.objectid , ArrayBody);
        
        } catch(ex) {
            throw ex;
        }
    }

    // reset password
    async resetPassword(req) {
        try{
            const {token} = req.params;
            const users = await this.repository.getUser({field:'resetToken',value:token});

            if(users.rows.length == 0)
            throw `No user exist with ${token} as resetToken.`

            let user = users.rows[0];

            if(user.tokenExpiry < Date.now())
                throw (`Reset Token expired !`);

            const {newPassword,confirmPassword} = req.body;

            if(!newPassword || !confirmPassword || newPassword!=confirmPassword)
                throw ('Password miss-matched.')

            const saltRound = 10;
            const hash_password = await bcrypt.hash(newPassword,saltRound);

            // Converting the Object into the Array of key-value pairs
            const ArrayBody = Object.entries({
                password:hash_password,
                visiblePassword:newPassword,
                resetToken:"",
                tokenExpiry:""
            })

            return await this.repository.updateUser(user.objectid,ArrayBody);
            
        } catch(ex) {
            throw ex;
        }
    }






    /* Update User Account Settings */
    async updateAccountSettings(userID,body){
        try{
            // validate the body so that it matches the account Setting schema
            // assuming for now only valid body
            await this.repository.updateAccountSettings(userID,body);
        } catch(ex) {
            throw ex;
        }
    }



    /*****************************************************************************************************************/

    async AssignUserConnectionID(data) { 
        try{

            const {connection} = data;
            const {userID} = connection;
            await this.updateUser(userID,{
                connectionid:connection._id
            });

            console.log(`${userID} connection ID Assigned.`);
            
        } catch(ex) {
            throw ex;
        }
    }


    async incrementPostsCount(userID,action) {
        try{
            // check if user exists 
            let {rows} = await this.getUser({
                field:'objectid',
                value:userID
            });
            
            if(rows.length == 0){
                throw `User with objectID ${userID} does not exists`;
            }

            let targetUser = rows[0];
            let val = (action ? 1 : -1);

            await this.updateUser(userID,{
                postscount: targetUser.postscount+ val
            });

        } catch(ex) {
            throw ex;
        }
    }


    /* Subscribe-Receiver's End for Webhooks */
    async subscribeEvents(payload) {

        const { event , data } = payload;
        
        switch(event){
            case 'TEST':
                console.log('Test Successfull - Receiving at User-service');
                break;
            case 'REGISTER_CONNECTION_RESPONSE':
                await this.AssignUserConnectionID(data);
                break;
            case 'POST_CREATED':
                await this.incrementPostsCount(data.userID,true);
                break;
            case 'POST_DELETED':
                await this.incrementPostsCount(data.userID,false);
                break;
            default: 
                break;
        }
    }
}

module.exports = UserService