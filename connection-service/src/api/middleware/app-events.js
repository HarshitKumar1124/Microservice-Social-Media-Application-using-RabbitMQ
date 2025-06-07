const {ConnectionService} = require('../../service');
const {isAuthenticate} = require('./isAuth')

module.exports = (app) => {
    
    const connectionService =  new ConnectionService();

    app.use('/app-events',async(req,res,next)=>{

        console.log(' -- Connection Service Received Event');
        
        const {payload} = req.body;

        const response = await connectionService.subscribeEvents(payload);
        return res.status(200).json(response);
    })
}