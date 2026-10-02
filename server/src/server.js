const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./middleware/auth').protect, require('./routes/projects'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'DeploySarthi API', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT,() => {
    console.log(`server running on port ${PORT}`);
});