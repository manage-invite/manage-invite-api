import { query, Router } from 'express';

const inviteRouter = Router();

inviteRouter.get('/', async (req, res) => {
    
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const authFailedURL = `${process.env.DASHBOARD_URL!}?bot_added=true`;

    console.log(req.query)
    if (!req.query.state) {
        return res.redirect(authFailedURL);
    }

    const [socketID, requestID] = (req.query.state as string).split('|');

    if (!socketID || !requestID) return res.redirect(authFailedURL);

    const socket = req.socketio.sockets.sockets.get(socketID);
    if (!socket) return res.redirect(authFailedURL);

    console.log(`botAdded${requestID}`);

    if (req.query.guild_id) {
        socket.emit(`botAdded`, requestID, true, req.query.guild_id);
    } else {
        socket.emit(`botAdded`, requestID, false, null);
    }

    // TODO: maybe add a timeout so if the socket is not listening, it still redirects the user somewhere

});

export default inviteRouter;
