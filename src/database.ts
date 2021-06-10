import DatabaseHandler from '@manage-invite/manage-invite-db-client';

const handler = new DatabaseHandler({}, {
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
});

export default handler;
