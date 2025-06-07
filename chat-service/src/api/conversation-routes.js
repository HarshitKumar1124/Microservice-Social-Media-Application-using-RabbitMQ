const {ConversationService,MessageService} = require('../service');
const { isAuthenticate } = require('./middleware').isAuth;

module.exports = (app) => {

    const conversationService = new ConversationService();

    /* Handles Error */
    this.getError=async(res,error)=>{
        res.status(400).send({
            status:false,
            statusCode:error.code || 500,
            error:error.message || error,
        });
    }

    /* chat-service Check test */
    app.get('/conversation',async(req,res)=>{
        res.status(200).send({
            message:'chat-service is working fine in conversation-routes.'
        })
    })

    /* Get All Conversations By specific user */
    app.get('/user/conversations',isAuthenticate,async(req,res)=>{
        try{

            const userid = req.user.objectid;

            /* fetch all the conversations of that authenticated user */
            const conversations = await conversationService.fetchConversationsByUserID(userid);
            res.status(200).send({
                status:true,
                conversations
            })
        } catch(ex) {
            await this.getError(res,ex);
        }
    })

    /* Delete Conversation with specific user */
    app.delete('/user/delete/conversation/:converseID',isAuthenticate,async(req,res)=>{
        try{
            const { converseID } = req.params;
            await conversationService.deleteConversation(converseID,req.user.objectid);
            res.status(200).send({
                status:true,
                message:'Conversation deleted successfully.'
            })

        } catch(ex) {
            await this.getError(res,ex);
        }
    })
}