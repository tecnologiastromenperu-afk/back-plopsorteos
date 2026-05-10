import fs from 'fs';
import path from 'path';

const logsDirectory = 'logs';

// Ensure logs directory exists
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

export const logger = {
  info: (message, data = {}) => {
    const logMessage = `[${getTimestamp()}] INFO: ${message} ${Object.keys(data).length ? JSON.stringify(data) : ''}`;
    console.log(logMessage);
    appendToFile(logMessage);
  },

  error: (message, error = null, data = {}) => {
    const errorDetails = error ? error.message : '';
    const logMessage = `[${getTimestamp()}] ERROR: ${message} ${errorDetails} ${Object.keys(data).length ? JSON.stringify(data) : ''}`;
    console.error(logMessage);
    appendToFile(logMessage);
  },

  warn: (message, data = {}) => {
    const logMessage = `[${getTimestamp()}] WARN: ${message} ${Object.keys(data).length ? JSON.stringify(data) : ''}`;
    console.warn(logMessage);
    appendToFile(logMessage);
  },

  audit: (action, details) => {
    const logMessage = `[${getTimestamp()}] AUDIT: ${action} | ${JSON.stringify(details)}`;
    console.log(logMessage);
    appendToFile(logMessage);
  },
};

const appendToFile = (message) => {
  const logFile = path.join(logsDirectory, 'app.log');
  try {
    fs.appendFileSync(logFile, message + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

export default logger;
