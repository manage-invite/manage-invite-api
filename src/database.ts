import DatabaseHandler from '@manage-invite/manage-invite-db-client';

const handler = new DatabaseHandler({}, {
    database: process.env.PG_DATABASE!,
    user: process.env.PG_USER!
});

export default handler;
