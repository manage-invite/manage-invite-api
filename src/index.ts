import { config } from 'dotenv';
config();

import express, { Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import routes from './routes';
import { Socket } from 'socket.io';
import './ipc-server';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const http = require('http').Server(app);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

export const replyError = (status: number, message: string, res: Response): void => {
    res.status(status).send({
        error: true,
        message
    });
};

export const replyData = (data: unknown, req: Request, res: Response): void => {
    res.status(200).send({
        error: false,
        ping_ms: Date.now() - req.startTime,
        data
    });
};

app.use((req, res, next) => {

    req.startTime = Date.now();
    req.socketio = io;

    next();
});

app.use(routes);

app.get('/', (req, res) => {
    res.send({
        error: false,
        message: 'Welcome to the ManageInvite API. Documentation is available at https://developer.manage-invite.xyz.'
    });
});

app.get('*', (req, res) => {
    res.status(404).send({
        error: true,
        message: 'Resource not found'
    });
});

io.on('connection', (socket: Socket) => {
    console.log('connected', socket.id);
});

http.listen(process.env.API_PORT, function() {
    console.log('listening on *:'+process.env.API_PORT);
});
