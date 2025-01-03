
/* Making a Publisher Class using RabbitMQ MESSAGE BROKER to communicate with other Microservices */

const amqp = require('amqplib')

/* AMQP stands for Advanced Message Queue Protocol */
/* Module is used to integrate Cloud RabbitMQ with the application */

const {config} = require('./broker-config')

class MQPublisher{

    channel;

    async establishChannel(){

        try{

            const connection = await amqp.connect(config.rabbitMQ.url)
            this.channel = await connection.createChannel();

            await this.channel.assertExchange(config.rabbitMQ.exchangeName,"direct");

        }catch(error){
            throw error
        }

    }


    /* No need of Publishing Message Functionality for API Gateway */

    /*
    async publishMessage(bindingKey,payload){
       
        if(!this.channel){
            await this.establishChannel();
        }
        
       try{
            console.log(`user-service Published ${payload.event} event to ${bindingKey}`);
            await this.channel.publish(config.rabbitMQ.exchangeName,bindingKey,Buffer.from(
                JSON.stringify(payload)
            ))

       }catch(error){
        throw error
       }

    }
    */

    async subscribeMessage(ExchangeName,bindingKey,gatewayService){

        if(!this.channel){
            await this.establishChannel();
        }

        try{

        const subscriber_queue = await this.channel.assertQueue('API_GATEWAY_SERVICE_QUEUE');

        await this.channel.bindQueue(subscriber_queue.queue,ExchangeName,bindingKey)

        await this.channel.consume(subscriber_queue.queue,async(bufferPayload)=>{
            let payload = JSON.parse(bufferPayload.content)
            console.log(`api-gateway-service Received event ${payload.event} from ${ExchangeName}`,payload.event);
            await gatewayService.subscribeEvents(payload);
            this.channel.ack(bufferPayload)
        })

        }catch(error){
        throw error
        }
    }
}

module.exports = MQPublisher;