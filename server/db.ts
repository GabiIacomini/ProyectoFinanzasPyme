import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon WebSocket settings for better stability
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with better connection management
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Lower connection limit for stability
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 100,
  allowExitOnIdle: true
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle({ client: pool, schema });

// Test database connection on startup
export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}
