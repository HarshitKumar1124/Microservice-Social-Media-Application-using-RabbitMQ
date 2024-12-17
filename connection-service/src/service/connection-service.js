const {ConnectionRepository} = require('../repository');
const {MQ} = require('../utils/messageBroker');

const messageBroker = new MQ();

class ConnectionService {

    constructor(){
        this.repository = new ConnectionRepository();
    }

    async createConnection(userID){ 
        try{
            const connection = await this.repository.createConnection(userID);

            // publish event to user-service to assign connectionID as REGISTER_CONNECTION_RESPONSE 
            messageBroker.publishMessage('user-service-binding-key',{
                event:"REGISTER_CONNECTION_RESPONSE",
                data:{
                    connection
                }
    
            });

            return connection
        } catch(ex) {
            throw ex;
        }
    }

    async deleteConnection(userID){
        try{
            await this.repository.deleteConnection(userID);
        } catch(ex) {
            throw ex;
        }
    }


    async follow_Unfollow_User(authUser,targetUser,action) {
        try{
            if(authUser == targetUser){
                throw (`You can not ${action} yourself`);
            }

            const authUserConnection = await this.repository.getConnection({
                userID:authUser
            });
            
            const {following} = authUserConnection;
            
            if(action=='follow'){

                // Check if target user already exist in following field
                if(following.has(targetUser))
                    return `${authUser} already follows ${targetUser}`

            } else {

                // Check if target user do exist in following field
                if(!following.has(targetUser))
                    return `${authUser} doesn't follow ${targetUser}`
            }
            
            await this.repository.follow_Unfollow_User(authUser,targetUser,action);
        
        } catch(ex) {
            throw ex;
        }
    }


     /* Subscribe-Receiver's End for Webhooks or messageBroker */
     async subscribeEvents(payload) {

        const { event , data } = payload;
        
        switch(event){
            case 'TEST':
                return {
                    message:'Test Successfull - Receiving at Connection-service'
                }
            case 'REGISTER_CONNECTION':
                return await this.createConnection(data.userID);
            case 'DELETE_CONNECTION':
                return await this.deleteConnection(data.userID);
            default: 
                break;
        }
    }
};

module.exports = ConnectionService