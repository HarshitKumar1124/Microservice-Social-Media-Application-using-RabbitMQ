const { Pool } = require('../database').db;
const { userSchema,userAccountSchema } = require('../database').schemas;
const UserService = require('../service/user-service.js');
const {isAuthenticate,isAuthoriseRole} = require('./middleware').isAuth;

// const {PublishConnectionEvents , PublishPostEvents} = require('../utils').eventsPublisher;

/* Importing Message Queue Publisher and Subscriber */
const {MQPublisher} = require('../utils/messageBroker')

const tableExist = async(tableName) => {
    
    const res = await Pool.query(`
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
        ) AS table_exists;
        `, [tableName]);

    if(res.rows.length > 0 && res.rows[0].table_exists ){
        return true;
    }

    return false;
}

/* The reason why SELECT EXISTS works with parameterized queries
 and CREATE TABLE does not is because PostgreSQL supports parameterization
for values but not for identifiers like table names or column names. */

module.exports = (app) => {

    const userService = new UserService();
    const messageBroker = new MQPublisher();

    this.getError = async(res,error) =>{
    
        res.status(400).send({
            status:false,
            statusCode:error.code || 500,
            error:error.message || error,
        });
    }

    /* Service Check Function */
    app.get('/',async(req,res)=>{

         // Publishing Event to Connection-Service-Exchange
         messageBroker.publishMessage('connection-service-binding-key',{
            event:"TEST",
            data:{
                message:"Testing connection."
            },
        });

        res.status(200).send({
            message:"user-service is working fine."
        })
    });

    /* INSERT row / user-data in table */
    app.post('/user/register',async(req,res)=>{
        try{
            // Create user table if it does not exist
            const value = await tableExist('users');

            if(!value){

                await userService.createTable(userSchema);
                console.log(`Table users created successfully.`)
                // Create user-Account Table for managing account settings.
                await userService.createTable(userAccountSchema);
                console.log(`User Account table created successfully.`)
                
            }
    
            const {password } = req.body;

            if(!password){
                throw (`Requisite fields not provided.`);
            }

            const {user,token} = await userService.register(req,res);
            console.log('Registration successfull');


            
            // create connectionSchema corresponding to this user
            // const {error,returnValue:connection} = await PublishConnectionEvents({
            //     event:'REGISTER_CONNECTION',
            //     data:{
            //         userID:user.objectid
            //     }
            // });
            
            // let publishEventError ;
            // if(error){
            //     publishEventError = error.message || error;
            // } else {
            //     await userService.updateUser(user.objectid,{
            //         connectionid:connection._id
            //     });
            // }


            // Publishing Event to Connection-Service-Exchange
            messageBroker.publishMessage('connection-service-binding-key',{
                event:"REGISTER_CONNECTION",
                data:{
                    userID:user.objectid
                },
            });

            res.status(200).send({
                status:'success',
                message: 'User registered successfully. ',
                token
            })

        } catch(ex) {
            console.log(`/register route operation is failing due to error :: ${ex}`);
            await this.getError(res,ex);
        }
    })

    // login user
    app.post('/login',async(req,res)=>{
        try{
            const {email,password} = req.body;

            if(!email || !password){
                throw (`User Login credentials can't be empty or undefined.`);
            }

            const {token,user} = await userService.signIn(req,res);
    
            res.status(200).send({
                status:'success',
                token,
                message:`${user.firstname} authenticated successfully.`
            });

        } catch(ex) {
            console.log(`Failed to Authenticate user due to ${ex}`);
            await this.getError(res,ex);
        }
    })

    // logout user
    app.post('/user/logout',isAuthenticate,async(req,res)=>{
        try{

            await userService.logOut(res);
            res.status(200).send({
                status:'success',
                message:'User logged out successfully.'
            })

        } catch(ex) {
            console.log(`Unable to sign out the account due to ${ex}`);
            await this.getError(res,ex);
        }
    })


    // Get All Users 
    app.get('/users',async(req,res)=>{
        try{
            // check if table exists or not
            const value = await tableExist('users');

            if(!value){
                throw ('users table does not exists.');
            };

            const response = await Pool.query('SELECT * FROM users');
            // console.log('All users : ',response);
            res.status(200).send({
                status:'success',
                users:response?.rows
            });

        } catch(ex) {
            console.log(`Unable to fetch all users due to :: ${ex}`);
            await this.getError(res,ex);
        }
    })

    // Get Target User using ID 
    app.get('/user/profile/:id',isAuthenticate,async(req,res)=>{
        try{
            const {id} = req.params;
            const user = await userService.getUser({field:"objectid",value:id});

            if(user.rows.length == 0)
            throw (`No such user with ObjectID as ${id} exists`);

            res.status(200).send({
                status:"success",
                user:user.rows[0]
            })
            
        } catch(ex) {
            console.log(`Unable to fetch target user due to ${ex}`);
            await this.getError(res,ex);
        }
    })

    // load user
    app.get('/user/myprofile',isAuthenticate,async(req,res)=>{
        try{
            const user = req.user;
            res.status(200).send({
                status:'success',
                user:user
            })
        } catch(ex) {
            console.log(`Unable to load user due to ${ex}`);
            await this.getError(res,ex);
        }
    })

    // update my profile 
    app.put('/user/update/myprofile',isAuthenticate,async(req,res)=>{
        try{
            let Body = req.body;
            const {objectid} = req.user;
            if(Body){
            
                if(Body.hasOwnProperty('role'))
                    delete Body['role'];
            
                if(Body.hasOwnProperty('email'))
                    delete Body['email'];

                if(!Body){
                    throw (`Not Authorised to change user role or email.`);
                }

                const response = await userService.updateUser(objectid,Body);

                res.status(200).send({
                    status:"success",
                    message:`${req.user.firstname}'s Profile updated successfully.`
                })
            }

        } catch(ex) {
            console.log(`Unable to update myprofile due to ${ex}`);
            await this.getError(res,ex);
        }
    })

    // update user profile  -- admin
    app.put('/user/admin/update/profile/:objectid',isAuthenticate,isAuthoriseRole('admin'),async(req,res)=>{
        try{
            const { objectid } = req.params;
            const Body = req.body;
            if(Body){
            
                if(Body.hasOwnProperty('email'))
                    delete Body['email'];

                if(!Body){
                    throw (`Admin not authorised to change user's email.`);
                }

                const {firstname:targetUserName} = await userService.updateUser(objectid,Body);

                res.status(200).send({
                    status:"success",
                    message:`${targetUserName}'s Profile updated successfully.`
                })
            } else {
                throw (`No body field-values to update`);
            }

        } catch(ex) {
            console.log(`Unable to update target user profile due to ${ex}`);
            await this.getError(res,ex);
        }
    })

    // delete my profile and associated userAccountSettings
    app.delete('/user/delete/myprofile',isAuthenticate,async(req,res)=>{
        try{
            const {objectid} = req.user;
            await userService.deleteUser(objectid);

            // delete connectionSchema corresponding to this user
            // const {error,returnValue} = await PublishConnectionEvents({
            //     event:'DELETE_CONNECTION',
            //     data:{
            //         userID:objectid
            //     }
            // });

            // Publishing Event to delete connectionSchema corresponding to this user
            messageBroker.publishMessage('connection-service-binding-key',{
                event:"DELETE_CONNECTION",
                data:{
                    userID:objectid
                },
            });



            // delete all posts created by this user
            // const { error:error2 } = await PublishPostEvents({
            //     event:'DELETE_USER_POSTS',
            //     data:{
            //         userID:objectid
            //     }
            // })


            // Publishing Event to delete all posts corresponding to this user
            messageBroker.publishMessage('post-service-binding-key',{
                event:"DELETE_USER_POSTS",
                data:{
                    userID:objectid
                },
            });



            // let publishEventError;

            // if(error){
            //     publishEventError = error.message
            // }

            // if(error2){
            //     publishEventError = (publishEventError?publishEventError:"") + error2.message;
            // }
            
            await userService.logOut(res);
            res.status(200).send({
                status:'success',
                message:'User profile deleted successfully.' 
            });

        } catch(ex) {
            console.log(`Unable to delete my profile due to :: ${ex}`);
            await this.getError(res,ex);
        }
    })

    // delete user profile -- admin
    app.delete('/user/admin/delete/profile/:objectid',isAuthenticate,isAuthoriseRole('admin'),async(req,res)=>{
        try{
            const {objectid} = req.params;
            const response = await userService.deleteUser(objectid);

            // delete connectionSchema corresponding to this user
            // const {error,returnValue} = await PublishConnectionEvents({
            //     event:'DELETE_CONNECTION',
            //     data:{
            //         userID:objectid
            //     }
            // });

            messageBroker.publishMessage('connection-service-binding-key',{
                event:"DELETE_CONNECTION",
                data:{
                    userID:objectid
                },
            });

             // delete all posts created by this user
            //  const { error:error2 } = await PublishPostEvents({
            //     event:'DELETE_USER_POSTS',
            //     data:{
            //         userID:objectid
            //     }
            // })

            // let publishEventError;

            // if(error){
            //     publishEventError = error.message
            // }

            // if(error2){
            //     publishEventError = (publishEventError?publishEventError:"") + error2.message;
            // }

            messageBroker.publishMessage('post-service-binding-key',{
                event:"DELETE_USER_POSTS",
                data:{
                    userID:objectid
                },
            });
            

            res.status(200).send({
                status:'success',
                message:'Target user profile deleted successfully.'
            })

        } catch(ex) {
            console.log(`Unable to delete user profile due to :: ${ex}`);
            await this.getError(res,ex);
        }
    });

    // forget password of profile 
    app.post('/user/forget/password',async(req,res)=>{
        try{
            const {email} = req.body;

            if(!email)
            throw (`Email is mandatory for reset password.`);

            const response = await userService.forgetPassword(email);
            res.status(200).send({
                status:"success",
                message:`Reset password link is send to mail id - ${email}.`
            })

        } catch(ex) {
            console.log(`Unable to proceed with forget password due to ${ex}`);
            await this.getError(res,ex);
        }
    })

    app.put('/reset-password/:token',async(req,res)=>{ 
        try{
            const response = await userService.resetPassword(req);
            res.status(200).send({
                status:'success',
                message:"Password reset successfully."
            })

        } catch(ex) {
            console.log(`Unable to reset the password via link provided due to :: ${ex} `);
            await this.getError(res,ex);
        }
    })




    /* update user Account Settings */
    app.put('/user/account/settings',isAuthenticate,async(req,res)=>{
        try{
            const userID = req.user.objectid;
            const {body} = req;
            await userService.updateAccountSettings(userID,body);
            res.status(200).send({
                status:true,
                message:`Updated Account Settings of user with ID ${userID}`
            })
        } catch(ex) {
            await this.getError(res,ex);
        }
    })

};