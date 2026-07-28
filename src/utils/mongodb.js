// utils/mongodb.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://v4x123:v4x123@cluster0.i3hnzcs.mongodb.net/www3";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, adminCreated: false };
}

/**
 * Create default admin user if not exists
 * This runs only once per application lifecycle
 */
async function ensureAdminExists() {
  // Skip if admin already created in this lifecycle
  if (cached.adminCreated) {
    return;
  }

  try {
    // Dynamic import to avoid circular dependency
    const User = (await import('../models/User.js')).default;

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@gmail.com";
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      cached.adminCreated = true;
      return;
    }

    // Create admin user
    const adminData = {
      email: adminEmail,
      password: process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
      name: process.env.DEFAULT_ADMIN_NAME || "Super Admin",
      role: "admin",
      phone: process.env.DEFAULT_ADMIN_PHONE || "",
      isActive: true,
      isEmailVerified: true,
    };

    const admin = await User.create(adminData);
    console.log('🔥 Default admin created:', admin.email);
    cached.adminCreated = true;

  } catch (error) {
    // Handle duplicate key error (E11000)
    if (error.code === 11000) {
      console.log('ℹ️  Admin user already exists (duplicate key)');
      cached.adminCreated = true;
    } else {
      console.error('❌ Error creating admin user:', error.message);
      // Don't throw - allow app to continue even if admin creation fails
    }
  }
}

async function connectToDatabase() {
  try {
    // If already connected, return the cached connection
    if (cached.conn) {
      // Ensure admin exists on reconnection
      if (!cached.adminCreated) {
        await ensureAdminExists();
      }
      return cached.conn;
    }

    // If connection is in progress, wait for it
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      };

      console.log('🔄 Connecting to MongoDB...');

      cached.promise = mongoose.connect(MONGODB_URI, opts)
        .then(async (mongoose) => {
          console.log('✅ MongoDB connected successfully');
          
          // Create admin user after successful connection
          try {
            await ensureAdminExists();
          } catch (adminError) {
            console.error('⚠️  Admin creation failed but continuing...', adminError.message);
          }
          
          return mongoose;
        })
        .catch((error) => {
          console.error('❌ MongoDB connection error:', error);
          cached.promise = null;
          throw error;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;

  } catch (e) {
    cached.promise = null;
    console.error('❌ Failed to establish MongoDB connection:', e.message);
    throw e;
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
  cached.conn = null;
  cached.promise = null;
  // Don't reset adminCreated - admin still exists in DB
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through app termination');
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through SIGTERM');
    }
    process.exit(0);
  });
}

export default connectToDatabase;
