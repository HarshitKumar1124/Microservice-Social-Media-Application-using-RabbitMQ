const Dotenv = require("dotenv");
const express = require("express");
const { connections } = require("./api");
const { connectDatabase } = require("./repository");
const cookieParser = require("cookie-parser");
// const { appEvents } = require('./api/middleware');

Dotenv.config({ path: "../Environment/connection-service.env" });

const { MQ } = require("./utils/messageBroker");

/* Rate-limiter to avoid over-fetching */
const { rateLimiter } = require("./api/middleware");

module.exports = async (app) => {
  try {
    const messageBroker = new MQ();

    /* It is used for json body-parser */
    app.use(express.json());

    /* For parsing application/x-www-form-urlencoded */
    app.use(express.urlencoded({ extended: true }));

    // /* It is used for cookie-parser for jwtToken */
    app.use(cookieParser());

    /* Connect MongoDB Database */
    await connectDatabase();

    /* Listen to events from other microservices */
    // appEvents(app);

    /* Using Rate-limiter to avoid Over-fetching */
    app.use(rateLimiter);

    /* Integrating connection-service routes */
    connections(app);

    /* Invalid API Call error response */
    app.use("*", (req, res, next) => {
      res.status(404).send({
        status: "Failure",
        message: "Error 404 Route not found here.",
      });
    });

    /* publishing Event to rabbitMQ on activation of server */
    app.listen(process.env.PORT, () => {
      console.log(
        "Connection Microservice is listening to the port ::",
        process.env.PORT
      );
      messageBroker.publishMessage("api-gateway-service-binding-key", {
        event: "SERVICE_ACTIVATION",
        data: {
          message: "Connection-service is live now.",
        },
      });
    });

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
