import { config } from 'dotenv';
import express from 'express';
import routes from './routes';

config();

const app = express();
const port = process.env.API_PORT!;

app.use(routes);

app.get('/', (req, res) => {
    res.send('The sedulous hyena ate the antelope!');
});

app.listen(port, () => console.log(`ManageInvite API is listening on ${port}`));
