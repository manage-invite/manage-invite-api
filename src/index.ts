import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import routes from './routes';
import middlewares from './middlewares';

config();

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

export const replyError = (status: number, message: string, req: Request, res: Response) => {
    res.status(status).send({
        error: true,
        message
    });
};

export const replyData = (data: unknown, req: Request, res: Response) => {
    res.status(200).send({
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

io.on('connection', (socket: any) => {
    console.log('connected')
});

http.listen(process.env.API_PORT, function() {
    console.log("listening on *:3000");
});