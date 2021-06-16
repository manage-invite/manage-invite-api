import { Router } from 'express';

/* Middlewares */
import auth from '../../middlewares/auth';
import permissions from '../../middlewares/permissions';
import premium from '../../middlewares/premium';

/* Helpers */
import database from '../../database';
import { fetchUsers } from '../../ipc-server';
import { replyData } from '../..';

interface CompleteLeaderboardEntry {
    userID: string;
    username: string;
    discriminator: string;
    avatarURL: string;
    bonus: number;
    fake: number;
    leaves: number;
    regular: number;
}

export default (guildsRouter: Router): void => {

    guildsRouter.get('/:guildID/leaderboard', auth, permissions, premium, async (req, res) => {

        const guildID = req.params.guildID;
        const settings = await database.fetchGuildSettings(guildID);
        const leaderboard = await database.fetchGuildLeaderboard(guildID, settings.storageID, 20);
        const users = await fetchUsers(leaderboard.map((u) => u.userID));

        const newLeaderboard: CompleteLeaderboardEntry[] = [];

        leaderboard.forEach((value) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const user = users.find((u) => u.id === value.userID) || {
                username: 'Unknown',
                discriminator: '0000',
                avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
            }!;
            const entry = {
                ...value,
                username: user.username,
                discriminator: user.discriminator,
                avatarURL: user.avatarURL
            };
            newLeaderboard.push(entry);
        });

        replyData(newLeaderboard, req, res);

    });

};
