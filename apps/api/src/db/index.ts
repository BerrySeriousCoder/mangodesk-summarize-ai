import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy initialization - only create database connection when needed
let dbInstance: ReturnType<typeof drizzle> | null = null;
let postgresClient: postgres.Sql | null = null;

function getDatabaseInstance() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create postgres client
    postgresClient = postgres(connectionString, {
      max: 10, // Maximum number of connections
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout
    });

    // Create drizzle instance
    dbInstance = drizzle(postgresClient, { schema });
  }
  
  return dbInstance;
}

// Export the database instance getter (lazy)
export function getDb() {
  return getDatabaseInstance();
}

// Export the client getter for manual operations if needed
export function getClient() {
  if (!postgresClient) {
    getDatabaseInstance(); // This will create the client if it doesn't exist
  }
  return postgresClient!;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...');
  if (postgresClient) {
    await postgresClient.end();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing database connections...');
  if (postgresClient) {
    await postgresClient.end();
  }
  process.exit(0);
}); 