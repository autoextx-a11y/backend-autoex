const express = require('express');
const cors = require('cors');
const carRoutes = require('./routes/carRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/cars', carRoutes);

app.use(errorHandler);
module.exports = app;