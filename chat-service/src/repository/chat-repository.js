const {converseSchema,messageSchema} = require('./schema');

class ChatRepository {

    async createConversation(sender,receiver,message) {
        try{

            return await converseSchema.create({
                participants:[sender,receiver],
                lastConverse:{
                    sender,
                    message,
                
                }
            });
            
        } catch(ex) {
            throw ex;
        }
    }

    async findConversation(sender,receiver) {
        try{
            return await converseSchema.findOne({participants:{"$all":[sender,receiver]}});
        } catch(ex) {
            throw ex;
        }
    }

    async findConversationByID(converseID){
        try{
            const instance = await converseSchema.findById(converseID);
            // console.log(`instance by id ${converseID} is ${instance}`);
            return instance;
        } catch(ex) {
            throw ex;
        }
    }

    async fetchConversationsByUserID(userid){
        try{
            const response = await converseSchema.find({participants:{"$in":[userid]}});
            return response;
        } catch(ex) {
            throw ex;
        }
    }

    async updateConversation(conversationInstance,req) {
        try{
            await conversationInstance.updateOne({lastConverse:{sender:req.user.objectid,message:req.body.message}});
        } catch(ex) {
            throw ex;
        }
    }

    /* delete Conversations */
    async deleteConversation(converseID) {
        try{
            return await converseSchema.deleteOne({_id:converseID});
        } catch(ex) {
            throw ex;
        }
    }

    async findConversationParams(body){
        try{
            const res =  await converseSchema.findOne(body);
            return res
        } catch(ex) {
            throw ex;
        }
    }


    /* MessageSchema CRUD modules */
    async createMessage(body){
        try{
            return await messageSchema.create(body);
        } catch(ex) {
            throw ex;
        }
    }

    async fetchMessagesByConverseID(converseID){
        try{
            return await messageSchema.find({converseID});
        } catch(ex) {
            throw ex;
        }
    }

    async getMessage(messageID){
        try{
            const response = await messageSchema.findById(messageID);
            return response;
        } catch(ex) {
            throw ex;
        }
    }

    async updateMessage(messageID,updationContent) {
        try{
            const response = await messageSchema.updateOne({_id:messageID},{
                content:updationContent
            });
            return response;
        } catch(ex) {
            throw ex;
        }
    }

    async deleteMessage(messageID) {
        try{
            const response = await messageSchema.deleteOne({_id:messageID});
            console.log('after delete response is ',response);
            return response;
        } catch(ex) {
            throw ex;
        }
    }

    async deleteAllMessagesConverseID(converseID) {
        try{
            await messageSchema.deleteMany({converseID});
        } catch(ex) {
            throw ex;
        }
    }
}

module.exports = ChatRepository