const Dotenv = require("dotenv");
const express = require("express");
const { user } = require("./api");
const cookieParser = require("cookie-parser");
// const { appEvents } = require('./api/middleware');
const { connectDatabase, Pool } = require("./database").db;
const Path = require("path");

const envPath = Path.resolve(__dirname, "../../Environment/user-service.env");
Dotenv.config({ path: envPath });

const { MQPublisher } = require("./utils/messageBroker");
const { setTimeout } = require("timers");

const UserService = require("./service/user-service");

const cors = require("cors");

// Adding the rate Limiter IP-Based Limiter
const { rateLimiter } = require("./api/middleware");

// Connecting AWS Account for triggering lambdas
const { awsConnect } = require("./utils/aws-connection/aws-connect");

module.exports = async (app) => {
  try {
    const messageBroker = new MQPublisher();
    const userService = new UserService();

    /* Here we are subscribing the "Chat_service_exchange" */
    messageBroker.subscribeMessage(
      "CHAT_SERVICE_EXCHANGE",
      "user-service-binding-key",
      userService
    );

    /* Here we are subscribing the "Connection_service_exchange" */
    messageBroker.subscribeMessage(
      "CONNECTION_SERVICE_EXCHANGE",
      "user-service-binding-key",
      userService
    );

    /* Here we are subscribing the "post_service_exchange" */
    messageBroker.subscribeMessage(
      "POST_SERVICE_EXCHANGE",
      "user-service-binding-key",
      userService
    );

    /* It is used for json body-parser */
    app.use(express.json());

    /* It is used for cookie-parser for jwtToken */
    app.use(cookieParser());

    /* For parsing application/x-www-form-urlencoded */
    app.use(express.urlencoded({ extended: true }));

    /* CORS Permission */
    //. Order of Middleware:
    // The order in which you use middleware in Express is crucial. The cors middleware must be used before any routes or other middleware that handle the requests you want to protect with CORS
    app.use(
      cors({
        origin: ["http://localhost:5173", "http://localhost:3000"], // Allow only requests from this domain
        credentials: true, // Allow credentials (cookies) to be included in cross-origin requests
        SameSite: "None",
        secure: false,
      })
    );

    /* Connect PostgreSQL Database */
    await connectDatabase();

    /* Listening to App-Events by Other Services */
    // appEvents(app);

    /* Integrating user-service routes */
    // user(app);

    /* Rate-limit for server */
    app.use(rateLimiter);

    /* Integrating user-service routes */
    user(app);

    /* Invalid API Call error response */
    app.use("*", (req, res, next) => {
      res.status(404).send({
        status: "Failure",
        message: "Error 404 Route not found here.",
      });
    });

    /* publishing Event to rabbitMQ on activation of server */
    app.listen(process.env.PORT, () => {
      console.log("User service is listening ar PORT :: ", process.env.PORT);
      messageBroker.publishMessage("api-gateway-service-binding-key", {
        event: "SERVICE_ACTIVATION",
        data: {
          message: "User-service is live now.",
        },
      });
    });

    /* publishing Event to rabbitMQ on termination of server */
    process.on("SIGINT", async () => {
      console.log("Shutting down User-service");
      await messageBroker.publishMessage("api-gateway-service-binding-key", {
        event: "SERVICE_DEACTIVATION",
        data: {
          message: "User-service is shutting down now.",
        },
      });

      /* responsible to release the previous PORT that was being used. */
      setTimeout(() => {
        process.exit(0);
      }, 3000);
    });

    await awsConnect();
  } catch (ex) {
    console.log("Application execution failed due to :: ", ex);
  }
};
