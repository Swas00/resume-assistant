import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/antigravity_db',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_please_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Python AI service (resume parsing)
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5001',
  // Claude API (AI suggestions)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(','),
};
