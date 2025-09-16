import mysql, { Pool, PoolOptions } from "mysql2/promise";

declare global {
  // Allow global caching in dev to avoid creating multiple pools on HMR
  // eslint-disable-next-line no-var
  var _mysqlPool: Pool | undefined;
}

const config: PoolOptions = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = global._mysqlPool ?? mysql.createPool(config);
if (process.env.NODE_ENV !== "production") global._mysqlPool = pool;

export default pool;