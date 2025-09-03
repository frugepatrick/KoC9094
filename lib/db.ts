import {Pool} from 'pg';

// Initializing the connection pool here so can only connect
//once without needing to reconnect on every page

const pool = new Pool({
    user: 'kocadmin',
    host: 'localhost',
    database: 'koc9094',
    password: '123', 
    port: 5432, //Default POSTGRES Port
});

//Export to use in queries across the app
export default pool;