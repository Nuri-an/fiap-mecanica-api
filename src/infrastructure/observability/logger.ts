import pino from 'pino';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'fiap-mecanica-api',
    env: process.env.NODE_ENV || 'development',
  },
});

export const getLogger = () => pinoLogger;
