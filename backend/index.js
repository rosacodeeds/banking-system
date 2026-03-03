const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads your DB password from .env

const accountRoutes = require('./routes/accountRoutes');

const app = express();

// Middleware
app.use(cors()); // Allows frontend to communicate with backend
app.use(express.json()); // Allows the server to read JSON data from Postman

// Mount the Routes
// This prefix means all routes will start with /api/accounts
app.use('/api/accounts', accountRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Banking Server is running on port ${PORT}`);
    console.log(`🚀 Ready for Postman testing!`);
});