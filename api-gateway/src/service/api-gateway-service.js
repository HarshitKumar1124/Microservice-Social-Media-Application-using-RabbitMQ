class Gateway {

    /* Subscribe-Receiver's End for Webhooks */
    async subscribeEvents(payload) {

        const { event , data } = payload;
        console.log(event)
        
        switch(event){
            case 'SERVICE_ACTIVATION':
            case 'SERVICE_DEACTIVATION':
                console.log(data?.message || data);
                break;
            default: 
                break;
        }
    }
}

module.exports = Gateway;