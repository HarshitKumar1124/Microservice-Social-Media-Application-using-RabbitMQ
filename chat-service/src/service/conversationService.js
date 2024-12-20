const {ChatRepository} = require('../repository');


class ConversationService {

   constructor(){
    this.repository = new ChatRepository();
   }

    async createConversation (sender,receiver,message) {
        try{
            return await this.repository.createConversation(sender,receiver,message);
        } catch(ex) {
            throw ex;
        }
    }

    async findConversation(sender,receiver) {
        try{
            return await this.repository.findConversation(sender,receiver);
        } catch(ex) {
            throw ex;
        }
    }

    async findConversationByID(converseID) {
        try{
            return await this.repository.findConversationByID(converseID);
        } catch(ex) {
            throw ex;
        }
    }

    async fetchConversationsByUserID(userid){
        try{
            return await this.repository.fetchConversationsByUserID(userid);
        } catch(ex) {
            throw ex;
        }
    }

    async updateConversation(conversationInstance,req){
        try{
            await this.repository.updateConversation(conversationInstance,req);
        } catch(ex) {
            throw ex;
        }
    }

    async deleteConversation(converseID,userID){
        try{
            const converseInstance = await this.repository.findConversationParams({_id:converseID,participants:{"$in":[userID]}});

            if(!converseInstance){
                throw (`No valid Conversation with specific userID`);
            }

            await this.repository.deleteConversation(converseID);
            await this.repository.deleteAllMessagesConverseID(converseID);
        } catch(ex) {
            throw ex;
        }
    }
}

module.exports = ConversationService