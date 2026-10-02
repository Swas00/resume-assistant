import mongoose from 'mongoose';
import { config } from './env';

export async function connectDatabase(): Promise<void> {
  const options: mongoose.ConnectOptions = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnection...');
    });

    await mongoose.connect(config.mongoUri, options);
  } catch (error) {
    console.error('Initial MongoDB connection failed:', error);
    // Do not crash immediately in dev to allow server to boot up even if DB is still starting
    if (config.isProduction) {
      process.exit(1);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly');
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
  }
}
