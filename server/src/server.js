const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const { startWebSocketServer } = require('./services/wsServer');
const { startMonitoringJob } = require('./jobs/monitoringJob');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET missing');
  process.exit(1);
}

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

//public 
app.use('/api/public', require('./routes/public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));
app.use('/api/github', require('./routes/github'));  
app.use('/api/vercel', require('./routes/vercel'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'DeploySarthi API' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const server = http.createServer(app);

startWebSocketServer(server);
startMonitoringJob();

server.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
  console.log(`[server] websocket ready`);
  console.log(`[server] monitoring active`);
});

process.on('SIGINT', () => {
  console.log('[server] shutting down');
  server.close(() => process.exit(0));
});