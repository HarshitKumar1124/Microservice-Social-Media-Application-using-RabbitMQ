const Dotenv = require('dotenv');
const express = require('express');
const { user } = require('./api');
const cookieParser = require('cookie-parser');
// const { appEvents } = require('./api/middleware');
const { connectDatabase , Pool } = require('./database').db;
const Path = require('path')

const envPath = Path.resolve(__dirname,"../config.env");
Dotenv.config({path:envPath});

module.exports = async(app) =>{
    try{

        /* It is used for json body-parser */
        app.use(express.json());

        /* It is used for cookie-parser for jwtToken */
        app.use(cookieParser());

        /* For parsing application/x-www-form-urlencoded */
        app.use(express.urlencoded({ extended: true })); 

        /* Connect PostgreSQL Database */
        await connectDatabase();

        /* Listening to App-Events by Other Services */
        // appEvents(app);


        /* Integrating user-service routes */
        user(app);

        /* Invalid API Call error response */
        app.use('*',(req,res,next)=>{
            res.status(404).send({
                status:'Failure',
                message:'Error 404 Route not found.'
            })
        })



        app.listen(process.env.PORT,()=>{
            console.log('User Microservice is listening to the port ::',process.env.PORT);
        });

    } catch (ex) {
        console.log('Application execution failed due to :: ',ex);
    }
}