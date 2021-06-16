import { Router } from 'express';
import btoa from 'btoa';
import fetch from 'node-fetch';
import { generateDashJWT } from '../utils/jwt';

const authRouter = Router();

const usersRequests = new Set<string>();

authRouter.get('/callback', async (req, res) => {

    console.log(`[LOGIN] Code = ${req.query.code}`);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const authFailedURL = `${process.env.DASHBOARD_URL!}?auth_failed=true`;

    if (!req.query.state) {
        return res.redirect(authFailedURL);
    }

    const socketID = req.query.state as string;

    if (usersRequests.has(socketID)) return;
    usersRequests.add(socketID);

    const socket = req.socketio.sockets.sockets.get(socketID);
    if (!socket) return res.redirect(authFailedURL);

    socket.emit('authInit');

    if (!req.query.code) {
        socket.emit('authFailed');
        return;
    }

    const tokenParams = new URLSearchParams();
    tokenParams.set('grant_type', 'authorization_code');
    tokenParams.set('code', req.query.code as string);
    tokenParams.set('redirect_uri', process.env.REDIRECT_URI as string);
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: tokenParams.toString(),
        headers: {
            Authorization: `Basic ${btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error || !tokenData.access_token) {
        socket.emit('authFailed');
        return;
    }
    const accessToken = tokenData.access_token;

    // TODO: handle ratelimiting
    const userResponse = await fetch('http://discordapp.com/api/users/@me', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    const userData = await userResponse.json();
    if (!userData) {
        socket.emit('authFailed');
        return;
    }

    socket.emit('login', {
        ...userData,
        avatarURL: 'https://cdn.discordapp.com/' + (userData.avatar ? `avatars/${userData.id}/${userData.avatar}.webp` : `embed/avatars/${userData.discriminator % 5}.png`)
    });

    socket.emit('jwt', generateDashJWT(userData.id, tokenData.access_token, tokenData.expires_in));

    usersRequests.delete(socketID);

});

export default authRouter;
