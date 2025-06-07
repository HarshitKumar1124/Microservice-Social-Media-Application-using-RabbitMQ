const {ConversationService,MessageService} = require('../service');
const { isAuthenticate } = require('./middleware').isAuth;

const {MQ} = require('../utils/messageBroker');
const {getIO,GetSocketID} = require('../utils/webSocket/socket');

module.exports = (app) => {

    const conversationService = new ConversationService();
    const messageService = new MessageService();
    const messageBroker = new MQ();

    /* Handles Error */
    this.getError=async(res,error)=>{
        res.status(400).send({
            status:false,
            statusCode:error.code || 500,
            error:error.message || error,
        });
    }

    /* chat-service Check test */
    app.get('/message',async(req,res)=>{
        res.status(200).send({
            message:'chat-service is working fine.'
        })
    })

    /* chat-service Authentication Check */
    app.get('/message/auth-check',isAuthenticate,async(req,res)=>{
        res.status(200).send({
            status:true,
            message:'Authentication is working'
        })
    })

    /* Send Message to a person / other users */
    app.post('/user/send-message/:receiver',isAuthenticate,async(req,res)=>{
        try{
            const receiver = req.params.receiver;
            const sender = req.user.objectid;
            const message = req.body.message;

            if(!receiver || !sender){
                let error = {
                    createConversationStatus:false,
                    messageStatus:false,
                    message:"Sender and Receiver user target can't be empty!"
                }

                await this.getError(res,error);
                return;
            }
        
            console.log('send Messages :: ',sender,receiver)
            

            if(!message){

                let error = {
                    messageStatus:false,
                    message:"Message field can't be empty!"
                }

                await this.getError(res,error);
                return;
            }

            if(sender===receiver){
                let error = {
                    messageStatus:false,
                    message:"You can't send message to yourself!"
                }

                await this.getError(res,error);
                return;
            }
            
            let conversationInstance = await conversationService.findConversation(sender,receiver);

            if(!conversationInstance){
                conversationInstance = await conversationService.createConversation(sender,receiver,message);
                /* publishing the event to create new Conversation. ( If by any reason , we need to undo this creation, then we could again publish undo event ) */

                /* Purpose to check if both sender and receiver exists or not. */
                messageBroker.publishMessage('user-service-binding-key',{
                    event:'CREATE_CONVERSATION_VALIDATE_USERS',
                    data:{
                        participants:[sender,receiver],
                        converseID:conversationInstance._id
                    }
                });

            }else{
                // update the latest conversation content.
                await conversationService.updateConversation(conversationInstance,req);
            }
            
            const messageInstance = await messageService.createMessage({
                converseID:conversationInstance._id,
                content:message,
                sender,
                receiver
            });


            // emitting socket .io send message event.

            const receiverSocketId = await GetSocketID(receiver);

            if(receiverSocketId)    // if receiver is online
            {
                const io = getIO();
                console.log('real time bhejo',receiverSocketId);
                await io.to(receiverSocketId).emit('newMessage',messageInstance);

            }
           
            res.status(200).send({
                status:true,
                message:`Send message to user with ID ${receiver}`
            });

        } catch(ex) {
            await this.getError(res,ex);
        }
    });

    /* Get All Messages of Specific ConversationID */
    app.get('/user/messages/:converseID',isAuthenticate,async(req,res)=>{
        try{
            const converseID = req.params.converseID;
            const conversationInstance = await conversationService.findConversationByID(converseID);

            if(!conversationInstance){
                /* No Conversations yet. */
                res.status(200).send({
                    status:true,
                    messages:[]
                });
                return;
            }

            const messages = await messageService.fetchMessagesByConverseID(converseID);

            res.status(200).send({
                status:true,
                messages
            })

        } catch(ex) {
            await this.getError(res,ex);
        }
    })

    /* Update-Edit Message */
    app.put('/user/message/update/:messageID',isAuthenticate,async(req,res)=>{
        try{
            const messageID = req.params.messageID;
            const updatedContent = req.body.content;        
           
            const response = await messageService.updateMessage(messageID,updatedContent,req);
            res.status(200).send({
                status:true,
                message:'Message Updated successfully'
            });

        } catch(ex) {
            await this.getError(res,ex);
        }
    })

    /* Delete Message */
    app.delete('/user/message/delete/:messageID',isAuthenticate,async(req,res)=>{
        try{
            const messageID = req.params.messageID;
            await messageService.deleteMessage(req,messageID);
            res.status(200).send({
                status:true,
                message:`Message instance ${messageID} deleted successfully.`
            });
            
        } catch(ex) {
            await this.getError(res,ex);
        }
    })
}