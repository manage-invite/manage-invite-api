# ManageInvite API

Official REST API for the **[ManageInvite Discord BOT](https://manage-invite.xyz)**.

## Goals and features ✨

The ManageInvite API is designed to allow developers to create their own bots using our database, or to update their guild settings automatically. This is the **public** API, you can access it using a **Guild Token**. The second job of the ManageInvite API is to make the dashboard working. It is a React application and therefore the actions trigger an API request, by using a **User Token**. The last thing the API does is to handle the PayPal payments.

## Documentation ✏️

Some endpoints can be accessed using a **Guild Token**. You can get it using the **[ManageInvite Dashboard](https://manage-invite.xyz)**, in your guild settings. You can also read the **[API documentation](https://developer.manage-invite.xyz)** to learn how to use it!

## Communications between the API and the bot's shards 💬

The API often needs to communicate with the bot's shards. All these communications are handled using **[Veza](https://github.com/kyranet/veza)**, an IPC networking library. Here are the cases where calls are made to the bot:

* We need to fetch a Discord user. Using the shards is better because the user may already be cached there.
* We need to send a message to Discord.
* We need to verify the permissions of a member.
* We need to get a list of the channels of a server.
* We need to get the statuses of the shards.

So, to sum up, except for the statuses request, we usually query the shards because we use it to centralize the users/guilds/channels cache and to make requests to the Discord API. In the future, we could share the users/channels/guilds cache using Redis.
