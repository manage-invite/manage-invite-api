import { Router } from 'express';
import btoa from 'btoa';
import fetch from 'node-fetch';
import database from '../database';
import { Permissions } from 'discord.js';

const authRouter = Router();

const usersRequests = new Set<string>();

interface GuildObject {
    id: string;
    icon: string;
    permissions: number;
}

authRouter.get('/', async (req, res) => {

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
    if (tokenData.error || !tokenData.access_token) {
        socket.emit('authFailed');
        return;
    }
    const accessToken = tokenData.access_token;

    // TODO: handle ratelimiting
    const userResponse = await fetch("http://discordapp.com/api/users/@me", {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    const userData = await userResponse.json();

    socket.emit('login', {
        ...userData,
        avatarURL: 'https://cdn.discordapp.com/' + (userData.avatar ? `avatars/${userData.id}/${userData.avatar}.webp` : `embed/avatars/${userData.discriminator % 5}.png`)
    });

    const guildsResponse = await fetch('https://discordapp.com/api/users/@me/guilds', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    const guildsData = await guildsResponse.json();

    const guildPremiumStatuses = await database.fetchGuildsPremiumStatuses(guildsData.map((guild: GuildObject) => guild.id));
    const guildIDs = await database.fetchBotGuilds();
   
    socket.emit('guilds', guildsData.map((guildData: GuildObject) => ({
        ...guildData,
        isAdmin: new Permissions(guildData.permissions).has('MANAGE_GUILD'),
        isTrial: guildPremiumStatuses.find((s) => s.guildID === guildData.id)?.isTrial,
        isPremium: guildPremiumStatuses.find((s) => s.guildID === guildData.id)?.isPremium,
        isAdded: guildIDs.some((id) => id === guildData.id),
        isWaitingVerification: false,
        // TODO: implement waiting for verification
        iconURL: guildData.icon ? `https://cdn.discordapp.com/icons/${guildData.id}/${guildData.icon}.webp` : null
    })))

    usersRequests.delete(socketID);

});

export default authRouter;
