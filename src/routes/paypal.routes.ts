import { Router } from 'express';
import { replyError } from '..';
import { fetchUsers, sendPaypalNotification } from '../ipc-server';
import database from '../database'
import fetch from 'node-fetch';

export const waitingVerification = new Set();

interface NotSentSignupData {
    guildID: string;
    userID: string;
    guildName: string;
    payload: Record<string, unknown>;
}

let notSentSignup: NotSentSignupData[] = [];

const paypalRouter = Router();

paypalRouter.get('/callback', async (req, res) => {
    const parsedCM = ((req.query.cm || "") as string).split(",");
    parsedCM.shift();
    const guildID = parsedCM[0];
    const userID = parsedCM[1];
    const guildName = parsedCM[2];
    if (guildID) {
        waitingVerification.add(guildID);
        sendPaypalNotification(guildID, guildName, userID, 'verification');
    }
    return res.redirect(`${process.env.DASHBOARD_URL}/servers`);
});

paypalRouter.post('/ipn', async (req, res) => {

    const payload = req.body;
    const payloadCopy = new URLSearchParams(payload);
    payloadCopy.set("cmd", "_notify-validate");
    payloadCopy.set("custom", unescape(payload.custom));
    
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fetchURL = (process.env.PAYPAL_SANDBOX_ENABLED ? process.env.PAYPAL_SANDBOX_FETCH_URL : process.env.PAYPAL_FETCH_URL)!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const paypalEmails = ((process.env.PAYPAL_SANDBOX_ENABLED ? process.env.PAYPAL_SANDBOX_EMAILS : process.env.PAYPAL_EMAILS)! as string).split(',');

    fetch(fetchURL, {
        method: "POST",
        body: payloadCopy.toString()
    }).then(async (paypalRes) => {

        const valid = await paypalRes.text() === "VERIFIED";

        console.log(payload, valid);

        if (!valid) {
            res.sendStatus(200);
            return replyError(401, 'Unauthorized. PayPal payment can not be verified.', res);
        }

        if (payload.txn_type === "subscr_signup"){

            if (
                (payload.mc_amount3 !== "2.00") ||
                (!paypalEmails.includes(payload.receiver_email))
            ) {
                res.sendStatus(200);
                return replyError(401, 'Payment has not the right amount or is not sent to the right account.', res);
            }

            const paymentData = (payload.custom || "").split(",");
            paymentData.shift();

            if (!paymentData[0]) {
                res.sendStatus(200);
                return replyError(401, 'Payment data has no custom field.', res);
            }

            const guildID = paymentData[0];
            const userID = paymentData[1];
            const guildName = paymentData[2];
            notSentSignup.push({
                guildID,
                userID,
                guildName,
                payload
            });

            sendPaypalNotification(guildID, guildName, userID, 'subscribed');

            res.sendStatus(200);

        }
        if (payload.txn_type === "subscr_payment") {

            console.log(payload);

            if (
                (payload.mc_gross !== "2.00") ||
                (!paypalEmails.includes(payload.receiver_email))
            ) {
                res.sendStatus(200);
                return replyError(401, 'Payment has not the right amount or is not sent to the right account.', res);
            }

            const paymentData = (payload.custom || "").split(",");
            paymentData.shift();

            if (!paymentData[0]) {
                res.sendStatus(200);
                return replyError(401, 'Payment data has no custom field.', res);
            }

            const guildID = paymentData[0];
            const userID = paymentData[1];
            const guildName = paymentData[2];

            waitingVerification.delete(guildID);

            const [ user ] = await fetchUsers([ userID ], guildID);

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const signupData = (notSentSignup.find((s) => s.guildID === guildID) as NotSentSignupData)!;
            if (signupData) {
                
                sendPaypalNotification(guildID, guildName, userID, 'dms');

                notSentSignup = notSentSignup.filter((s) => s.guildID !== guildID);

                const subscription = await database.createGuildSubscription(guildID, {
                    expiresAt: new Date(Date.now()+30*24*60*60*1000),
                    createdAt: new Date(payload.payment_date),
                    subLabel: "Premium Monthly 1 Guild",
                    guildsCount: 1
                });

                // signup
                const signupPayment = await database.createSubscriptionPayment(subscription.id, {
                    payerDiscordID: paymentData[1],
                    payerDiscordUsername: user.username + '#' + user.discriminator,
                    payerEmail: signupData.payload.payer_email as string,
                    transactionID: signupData.payload.txn_id as string,
                    amount: parseInt(signupData.payload.mc_amount3 as string),
                    createdAt: new Date(signupData.payload.subscr_date as string),
                    type: "paypal_dash_signup_month",
                    details: signupData.payload
                });

                // payment
                await database.createSubscriptionPayment(subscription.id, {
                    payerDiscordID: paymentData[1],
                    payerDiscordUsername: user.username + '#' + user.discriminator,
                    payerEmail: payload.payer_email,
                    transactionID: payload.txn_id,
                    amount: parseInt(payload.mc_gross),
                    createdAt: new Date(payload.payment_date),
                    type: "paypal_dash_pmnt_month",
                    details: payload,
                    signupID: signupPayment.id
                });

                res.sendStatus(200);

            } else {

                const additionalTime = 30*24*60*60*1000;
                const guildSubscriptions = await database.fetchGuildSubscriptions(guildID);
                let currentSubscription = guildSubscriptions.find((sub) => sub.subLabel === "Premium Monthly 1 Guild");
                if (!currentSubscription){
                    currentSubscription = await database.createGuildSubscription(guildID, {
                        expiresAt: new Date(Date.now()+additionalTime),
                        createdAt: new Date(payload.payment_date),
                        subLabel: "Premium Monthly 1 Guild",
                        guildsCount: 1
                    });
                } else await database.updateGuildSubscription(currentSubscription.id, guildID, "expiresAt",
                    new Date((new Date(currentSubscription.expiresAt).getTime() > Date.now() ? new Date(currentSubscription.expiresAt).getTime() : Date.now()) + additionalTime).toISOString()
                );
                await database.createSubscriptionPayment(currentSubscription.id, {
                    payerDiscordID: paymentData[1],
                    payerDiscordUsername: user.username + '#' + user.discriminator,
                    payerEmail: payload.payer_email,
                    transactionID: payload.txn_id,
                    amount: parseInt(payload.mc_gross),
                    createdAt: new Date(payload.payment_date),
                    type: "paypal_dash_pmnt_month",
                    details: payload
                });

                res.sendStatus(200);

            }

            sendPaypalNotification(guildID, guildName, userID, 'paid');
        }

        if (payload.txn_type === "subscr_cancel"){

            const paymentData = (payload.custom || "").split(",");
            paymentData.shift();

            if (!paymentData[0]) {
                res.sendStatus(200);
                return replyError(401, 'Payment data has no custom field.', res);
            }

            const guildID = paymentData[0];
            const userID = paymentData[1];
            const guildName = paymentData[2];

            const [ user ] = await fetchUsers([ userID ], guildID);

            sendPaypalNotification(guildID, guildName, userID, 'cancelled');

            const guildSubscriptions = await database.fetchGuildSubscriptions(guildID);
            const subscriptionID = guildSubscriptions.find((sub) => sub.subLabel === "Premium Monthly 1 Guild")?.id;
            if (subscriptionID) {
                await database.createSubscriptionPayment(subscriptionID, {
                    payerDiscordID: paymentData[1],
                    payerDiscordUsername: user.username + '#' + user.discriminator,
                    payerEmail: payload.payer_email,
                    transactionID: payload.txn_id,
                    amount: 0,
                    createdAt: new Date(payload.subscr_date),
                    type: "paypal_dash_cancel_month",
                    details: payload
                });
            }

            res.sendStatus(200);
        }
    });

});

export default paypalRouter;
