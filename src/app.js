const express = require('express');
const cors = require('cors');
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerJson = require("../swagger.json")

const outfile = "../swagger.json"
const endpointFiles = ["./app.js"]
const config = {}


const paymentRoutes = require('./routes/blockpay');
const accountRoutes = require('./routes/auth');
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJson))

app.use('/api/payments', paymentRoutes);
app.use('/api/account', accountRoutes);

app.set('port', PORT);

app.get('/health', (req, res) => {
    return res.status(200).json({code: 200, status: "OK"})
})

module.exports = app;