const {isAuthenticate} = require('./middleware').isAuth;
const {ConnectionService} = require('../service');

// const {PublishUserEvents} = require('../utils/eventsPublisher');

const {MQ} = require('../utils/messageBroker');

module.exports = (app) =>{ 

    const connectionService = new ConnectionService();
    const messageBroker = new MQ();

    /* Here we are subscribing the "User_service_exchange" and "CONNECTION_SERVICE_QUEUE" */
    messageBroker.subscribeMessage('USER_SERVICE_EXCHANGE','connection-service-binding-key',connectionService);  

    /* Handles Error */
    this.getError=async(res,error)=>{
        res.status(400).send({
            status:false,
            statusCode:error.code || 500,
            error:error.message || error,
        });
    }

    /* Microservice-check  */
    app.get('/',async(req,res)=>{

        /* Publishing TEST event to user-service */
        // await PublishUserEvents({
        //     event:'TEST',
        //     data:{
        //         message:"Testing successfull"
        //     }
        // });

        messageBroker.publishMessage('user-service-binding-key',{
            event:"TEST",
            data:{
                message:"Testing connection."
            },
        });

        res.status(200).send({
            status:true,
            message:'Connection-Microservice Working fine.'
        })
    })

    /* Create connection-instance associated with newly registered user */
    /*

    This route will never be call explicitely by user anytime

    app.post('/register/connection',isAuthenticate,async(req,res)=>{
        try{
            const connection = await connectionService.createConnection(req.user.objectid);

            res.status(200).send({
                status:true,
                message:`Connection registered for user ${req.user.objectid}`,
                connection:connection._id
            });
        } catch(ex) {
            await this.getError(res,ex);
        }
    })
    */

    /* Follow-Unfollow any User on the App */
    app.put('/connection/follow-unfollow-user/:id',isAuthenticate,async(req,res)=>{
        try{
            const targetUser = req.params.id;
            const authUser = req.user._id;
            const {action} = req.query;

            if(!targetUser){
                throw('Target User is mandatory.');
            }

            const validActions = ["follow", "unfollow"]; 
        
            if (!validActions.includes(action.toLowerCase())) { // Case-insensitive check
                throw("Invalid action specified.");
            }

            let message = await connectionService.follow_Unfollow_User(authUser,targetUser,action);

            if(!message){
                message = `${authUser} ${action}ed ${targetUser} successfully.`
            }

            messageBroker.publishMessage('notification-service-binding-key',{
                event:'USER_NOTIFICATION',
                action:'FOLLOW_UNFOLLOW',
                data : {
                    message,
                    author:authUser,
                    target:targetUser,
                }
            });
            
            res.status(200).send({
                status:true,
                message
            });

        } catch(ex) {
            await this.getError(res,ex);
        }
    })

}