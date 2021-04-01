import { Router } from 'express';
import btoa from 'btoa';
import fetch from 'node-fetch';

const authRouter = Router();

authRouter.get('/', async (req, res) => {

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const authFailedURL = `${process.env.DASHBOARD_URL!}?auth_failed=true`;

    if (!req.query.code || !req.query.state) {
        return res.redirect(authFailedURL);
    }

    const socket = req.socketio.sockets.sockets.get(req.query.state);
    if (!socket) return res.redirect(authFailedURL);

    socket.emit('init');

    const tokenParams = new URLSearchParams();
	tokenParams.set("grant_type", "authorization_code");
	tokenParams.set("code", req.query.code as string);
	tokenParams.set("redirect_uri", process.env.REDIRECT_URI as string);
	const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
		method: "POST",
		body: tokenParams.toString(),
		headers: {
			Authorization: `Basic ${btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)}`,
			"Content-Type": "application/x-www-form-urlencoded"
		}
	});
    const tokenData = await tokenResponse.json();
    if (tokenData.error || !tokenData.access_token) return res.redirect(authFailedURL);
    const accessToken = tokenData.access_token;

    const userResponse = await fetch("http://discordapp.com/api/users/@me", {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    const userData = await userResponse.json();

    socket.emit('login', {
        ...userData,
        avatarURL: 'https://cdn.discordapp.com/' + (userData.avatar ?`avatars/${userData.id}/${userData.avatar}.webp` : `embed/avatars/${userData.discriminator % 5}.png`)
    });

});

export default authRouter;
