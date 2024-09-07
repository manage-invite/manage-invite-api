import DatabaseHandler from '@androz2091/manage-invite-db-client';

const handler = new DatabaseHandler({
    port: process.env.REDIS_PORT, // Redis port
    host: process.env.REDIS_HOST, // Redis host
    username: process.env.REDIS_USER, // Redis username`
    password: process.env.REDIS_PASSWORD, // Redis password
    db: 0, // Defaults to 0
}, {
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
});

export default handler;
