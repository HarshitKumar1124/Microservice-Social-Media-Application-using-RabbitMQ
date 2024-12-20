const express = require('express');
const appConfigure = require('./app-config.js');

const startServer = async() => {

    const app = express();
    await appConfigure(app);
};

startServer();