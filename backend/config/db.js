const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'banking_system', 
  password: 'your_new_password', 
  port: 5432,
});

module.exports = pool;