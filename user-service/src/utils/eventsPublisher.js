
/* Implementing Webhooks for communication between Services */

const axios = require('axios');

module.exports = {

    /* Publish Events to Connection Service */
    async PublishConnectionEvents(payload) {
        try{
            const response = await axios.post('http://localhost:8000/connection-srvc/app-events',{
                payload
            });
            
            console.log('Event Publishing to Connection-Service successfully.');
            return {
                returnValue:response?.data
            };

        } catch(ex) {
            console.log('Error to publish user-events due to :: ',ex.message);
            return {
                error:{
                    message:'Error to publish user-events due to :: ' + ex.message || ex
                }
            }
        }
    },

    /* Publish Events to Posts Service */
    async PublishPostEvents(payload) {
        try{
            const response = await axios.post('http://localhost:8000/post-srvc/app-events',{
                payload
            });
            
            console.log('Event Publishing to Post-Service successfully.');
            return {
                returnValue:response?.data
            };

        } catch(ex) {
            console.log('Error to publish post-events due to :: ',ex.message);
            return {
                error:{
                    message:'Error to publish post-events due to :: ' + ex.message || ex
                }
            }
        }
    }
}