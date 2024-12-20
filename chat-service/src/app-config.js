const Dotenv = require('dotenv');
const express = require('express');
const { conversation , messages } = require('./api');
const {connectDatabase} = require('./repository');
const cookieParser = require('cookie-parser')

Dotenv.config({path:"./config.env"});

const {MQ} = require('./utils/messageBroker');
const {ChatService} = require('./service');

module.exports = async(app) =>{
    try{

        const messageBroker = new MQ();
        const chatService = new ChatService();

        /* Here we are subscribing the "User_service_exchange" */
        messageBroker.subscribeMessage('USER_SERVICE_EXCHANGE','chat-service-binding-key',chatService);  

        /* It is used for json body-parser */
        app.use(express.json());

        /* For parsing application/x-www-form-urlencoded */
        app.use(express.urlencoded({ extended: true })); 

        /* It is used for cookie-parser for jwtToken */
        app.use(cookieParser());

        /* Connect MongoDB Database */
        await connectDatabase();


        /* Integrating chat-service routes */
        conversation(app);
        messages(app);


        /* publishing Event to rabbitMQ on activation of server */
        app.listen(process.env.PORT,()=>{
            console.log('Chat Microservice is listening to the port ::',process.env.PORT);
            messageBroker.publishMessage('api-gateway-service-binding-key',{
                event:'SERVICE_ACTIVATION',
                data:{
                    message:'Chat-service is live.'
                }
            });
        });


        /* publishing Event to rabbitMQ on termination of server */
        process.on('SIGINT',async()=>{
            console.log('Shutting down Connection-service');
            await messageBroker.publishMessage('api-gateway-service-binding-key',{
                event:'SERVICE_DEACTIVATION',
                data:{
                    message:"Connection-service is shutting down now."
                }
            });

            /* responsible to release the previous PORT that was being used. */
            setTimeout(()=>{
                process.exit(0)
            },3000);
            
        })

    } catch (ex) {
        console.log('Application execution failed due to :: ',ex);
    }
}