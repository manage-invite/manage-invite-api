import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import routes from './routes';
import middlewares from './middlewares';

config();

const app = express();
const port = process.env.API_PORT!;

export const replyData = (data: unknown, req: Request, res: Response) => {
    res.send({
        error: false,
        ping_ms: Date.now() - req.startTime,
        data
    });
};

middlewares(app);
app.use(routes);

app.get('/', (req, res) => {
    res.send({
        error: false,
        message: 'Welcome to the ManageInvite API. Documentation is available at https://manage-invite.xyz/docs.'
    });
});

app.get('*', (req, res) => {
    res.status(404).send({
        error: true,
        message: 'Resource not found'
    });
});

app.listen(port, () => console.log(`ManageInvite API is listening on ${port}`));
