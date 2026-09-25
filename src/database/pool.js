const { Pool } = require('pg');

const path = require('path');
const fs = require('fs');
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
const hasDatabase = Boolean(connectionString) || !(process.env.VERCEL || process.env.VERCEL_ENV);
const pool = new Pool(connectionString ? {
  connectionString,
  max: Number(process.env.DB_POOL_MAX || 5),
  connectionTimeoutMillis: 5000
} : {
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'panaderia',
  user: process.env.DB_USER || 'panaderia_user',
  password: process.env.DB_PASSWORD || 'panaderia_dev',
  connectionTimeoutMillis: 5000
});

let initialization;
function initializeDatabase() {
  if (!initialization) {
    const sql = fs.readFileSync(path.join(__dirname, '../../database/init.sql'), 'utf8');
    initialization = pool.query(sql)
      .then(() => console.log('Esquema y productos iniciales verificados.'))
      .catch((error) => { initialization = undefined; throw error; });
  }
  return initialization;
}

pool.on('error', (error) => console.error('Error inesperado en PostgreSQL:', error.message));

async function waitForDatabase() {
  const attempts = Number(process.env.DB_CONNECT_ATTEMPTS || 15);
  const delay = Number(process.env.DB_CONNECT_DELAY_MS || 2000);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      await initializeDatabase();
      console.log('Conexión a PostgreSQL establecida.');
      return;
    } catch (error) {
      console.log(`PostgreSQL no está listo (${attempt}/${attempts}): ${error.message}`);
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = { pool, waitForDatabase, initializeDatabase, hasDatabase };
