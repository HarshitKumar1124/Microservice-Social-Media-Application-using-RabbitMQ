const Dotenv = require("dotenv");
const express = require("express");
const { conversation, messages } = require("./api");
const { connectDatabase } = require("./repository");
const cookieParser = require("cookie-parser");

Dotenv.config({ path: "../Environment/chat-service.env" });

const { MQ } = require("./utils/messageBroker");
const { ChatService } = require("./service");

const { integrateWebsocket } = require("./utils/webSocket/socket");
const cors = require("cors");

const { rateLimiter } = require("./api/middleware");

module.exports = async (app) => {
  try {
    /* CORS Permission */
    //. Order of Middleware:
    // The order in which you use middleware in Express is crucial. The cors middleware must be used before any routes or other middleware that handle the requests you want to protect with CORS
    app.use(
      cors({
        origin: ["http://localhost:5173", "http://localhost:3000"], // Allow only requests from this domain
        credentials: true, // Allow credentials (cookies) to be included in cross-origin requests,
      })
    );

    const messageBroker = new MQ();
    const chatService = new ChatService();

    /* Here we are subscribing the "User_service_exchange" */
    messageBroker.subscribeMessage(
      "USER_SERVICE_EXCHANGE",
      "chat-service-binding-key",
      chatService
    );

    /* It is used for json body-parser */
    app.use(express.json());

    /* For parsing application/x-www-form-urlencoded */
    app.use(express.urlencoded({ extended: true }));

    /* It is used for cookie-parser for jwtToken */
    app.use(cookieParser());

    /* Connect MongoDB Database */
    await connectDatabase();

    /* Using Rate-limiter to avoid Over-fetching */
    app.use(rateLimiter);

    /* Integrating chat-service routes */
    conversation(app);
    messages(app);

    /* Invalid API Call error response */
    app.use("*", (req, res, next) => {
      res.status(404).send({
        status: "Failure",
        message: "Error 404 Route not found here.",
      });
    });

    /* publishing Event to rabbitMQ on activation of server */
    const server = await new Promise((resolve, reject) => {
      // `app.listen` starts the server and calls the callback when it's up
      const server_resp = app.listen(process.env.PORT, () => {
        console.log(
          "Chat Microservice is listening to the port ::",
          process.env.PORT
        );

        // Publish the message to RabbitMQ after the server starts
        messageBroker.publishMessage("api-gateway-service-binding-key", {
          event: "SERVICE_ACTIVATION",
          data: {
            message: "Chat-service is live.",
          },
        });

        resolve(server_resp); // Resolve the server after the callback is done
      });
    });

    // Now that the server is up and message is published, integrate WebSockets
    await integrateWebsocket(server);

    /* Integrate Websockets using Socket.IO */

    /* publishing Event to rabbitMQ on termination of server */
    process.on("SIGINT", async () => {
      console.log("Shutting down Connection-service");
      await messageBroker.publishMessage("api-gateway-service-binding-key", {
        event: "SERVICE_DEACTIVATION",
        data: {
          message: "Connection-service is shutting down now.",
        },
      });

      /* responsible to release the previous PORT that was being used. */
      setTimeout(() => {
        process.exit(0);
      }, 3000);
    });
  } catch (ex) {
    console.log("Application execution failed due to :: ", ex);
  }
};
