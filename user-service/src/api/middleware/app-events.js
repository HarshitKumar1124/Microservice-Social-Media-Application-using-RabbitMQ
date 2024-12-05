const UserService = require('../../service/user-service');

module.exports = (app) => {
    
    const userService =  new UserService();

    app.use('/app-events',async(req,res,next)=>{

        console.log(' -- User Service Received Event');
        
        const {payload} = req.body;

        userService.subscribeEvents(payload);
        return res.status(200).json(payload);
    })
}