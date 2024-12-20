const { ChatRepository } = require("../repository");

class MessageService {

    constructor(){
        this.repository = new ChatRepository();
    }

    async createMessage (body) {
        try{
            return await this.repository.createMessage(body);
        } catch(ex) {
            throw ex;
        }
    }

    /* fetch all messages of specific conversation ID */
    async fetchMessagesByConverseID(converseID){
        try{
            const response = await this.repository.fetchMessagesByConverseID(converseID);
            return response;
        } catch(ex) {
            throw ex;
        }
    }

    /* get message instance by ID */
    async getMessage(messageID) {
        try{
            const response = await this.repository.getMessage(messageID);
            return response;
        } catch(ex) {
            throw ex;
        }
    }

    /* Update message Content by ID */
    async updateMessage(messageID,updateContent,req) {
        try{
            const messageInstance = await this.getMessage(messageID);

            if(!messageInstance){
                /* No message found. */
                throw('No such message found in records');
            }

            if(messageInstance.sender.toString() != req.user.objectid){
                throw ('Forbidden to edit messages of other users.');
            }
            return await this.repository.updateMessage(messageID,updateContent);
        
        } catch(ex) {
            throw ex;
        }
    }

    /* Delete message by ID */
    async deleteMessage(req,messageID){
        try{
            const messageInstance = await this.getMessage(messageID);
            
            if(!messageInstance){
                /* No message found. */
                throw('No such message found in records');
            }

            if(messageInstance.sender.toString() != req.user.objectid){
                throw ('Forbidden to delete messages of other users.');
            }

            await this.repository.deleteMessage(messageID);
            const {converseID}  = messageInstance;

            const messages = await this.fetchMessagesByConverseID(converseID);

            if(messages.length == 0){
                await this.repository.deleteConversation(converseID,req.user.objectid);
            }

        } catch(ex) {
            throw ex;
        }
    }
}

module.exports = MessageService