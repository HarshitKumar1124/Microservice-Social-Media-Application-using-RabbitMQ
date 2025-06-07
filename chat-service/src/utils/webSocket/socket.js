const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let connectedUsers = new Map(); 

let io;

const integrateWebsocket=async(server)=>{
    try{
        
        io = await socketIO(server,{
            cors: {
                origin: '*',  // Allow only your React frontend origin
                methods: ['GET', 'POST'],
            }
        });
        


        /* ReceiverEnd for websocket connection */
        io.on('connection',(socket)=>{

            if(!socket.request.headers.cookie){
                socket.disconnect();
                return;
            }

            const userAuthToken = socket.request.headers.cookie.split('=')[1];
            const userInfo = jwt.verify(userAuthToken,process.env.JWT_SECRET);

            if(!userInfo){
                socket.disconnect();
                return;
            }

            console.log('Socket connection at Backend received :: ',socket.id);
            connectedUsers.set(userInfo._id,socket.id);
            console.log(connectedUsers)

            io.emit('socketActive',{
                activeSocketID:socket._id
            });


            /* Defining SocketEvents */



            // closing the socket connection
            socket.on('disconnect',()=>{
                console.log('socket disconnected :: ',socket.id);
                connectedUsers.delete(userInfo._id);
            });

        });

        

    } catch (ex) {
        console.log('Socket error :: ',ex);
        throw ex;
    }
}

const GetSocketID=async(userID)=>{
    // console.log('ID',userID,connectedUsers);
    return connectedUsers.get(userID);
}

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized! Call integrateWebsocket first.');
    }
    return io;
};

module.exports = { getIO ,integrateWebsocket,GetSocketID }


