const { Pool } = require("pg");
const dotenv = require("dotenv");
const Path = require("path");

const envPath = Path.resolve(
  __dirname,
  "../../../Environment/user-service.env"
);
dotenv.config({ path: envPath });

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const connectDatabase = async () => {
  try {
    /* Connect the Postgres Database pool */
    const connectionResponse = await pool.connect();
    console.log(`Database connected successfully.`);
  } catch (ex) {
    console.log(`Unable to connect to Postgres Database due to ::`, ex);
  }
};

module.exports = { connectDatabase, Pool: pool };
