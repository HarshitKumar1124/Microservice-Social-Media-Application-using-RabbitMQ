
/* Implementing Webhooks for communication between Services */

const axios = require('axios');

module.exports = {

    /* Publish Events to User Service */
    async PublishUserEvents(payload) {
        try{
            const response = await axios.post('http://localhost:8000/user-srvc/app-events',{
                payload
            });
            
            console.log('Event Publishing to User-Service successfully.');

        } catch(ex) {
            console.log('Error to publish user-events due to :: ',ex.message);
        }
    }
}