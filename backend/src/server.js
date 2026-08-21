const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const initSocket = require('./config/socket');

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const startServer = async () => {
  await connectDB();

  // Start background task deadline checker job
  const { startDeadlineJob } = require('./services/notificationService');
  startDeadlineJob();

  // Start background recurring task job
  const { startRecurringJob } = require('./jobs/recurringTaskJob');
  startRecurringJob();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
