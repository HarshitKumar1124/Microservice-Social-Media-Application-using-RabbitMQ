const {ChatRepository} = require('../repository');

class ChatService {

    constructor(){ 
        this.repository = new ChatRepository();
    }

    async subscribeEvents(payload) {
        
        const { event , data } = payload;
  
        switch(event){
            case 'TEST':
                console.log('Test Successfull - Receiving at User-service');
                break;
            case 'UNDO_CREATE_CONVERSATION':
                console.log(data?.message);
                await this.repository.deleteConversation(data.converseID);
                await this.repository.deleteAllMessagesConverseID(data.converseID);
                break;
            default: 
                break;
        }
    }
}

module.exports = ChatService;