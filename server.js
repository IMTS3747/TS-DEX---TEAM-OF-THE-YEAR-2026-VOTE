const express = require('express');
const axios = require('axios');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID || '1566859679441752184';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'c7UlC3fZcG3C1Z0lZcpaoFySe934CzH8';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://ts-dex-team-of-the-year-2027-vote.onrender.com/api/auth/callback';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1566859350381953099/hzapHaaXFpXqYaAuHSqjieC1KLOmjHr3qgg3nb3jUVk5FbK6F4iP-DMwp0IFTerMKQdY';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://imts49504_db_user:ChhZN3qtu7lPhfIp@cluster0.hxdv95b.mongodb.net/';

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({
    secret: process.env.SESSION_SECRET || 'ts_dex_toty_secret_key_2027',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('MongoDB Atlas connection error:', err));

const voteSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    squad: { type: Object, required: true },
    captainId: { type: Number, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    updateCount: { type: Number, default: 1 }
});

const VoteRecord = mongoose.model('VoteRecord', voteSchema);

async function readData() {
    try {
        const votes = await VoteRecord.find({});
        const votedUsers = {};
        const playerVotes = {};

        votes.forEach(record => {
            votedUsers[record.userId] = {
                username: record.username,
                squad: record.squad,
                captainId: record.captainId,
                timestamp: record.timestamp,
                updateCount: record.updateCount || 1
            };

            if (record.squad) {
                for (let slot in record.squad) {
                    const pName = record.squad[slot].name;
                    if (pName) {
                        playerVotes[pName] = (playerVotes[pName] || 0) + 1;
                    }
                }
            }
        });

        return { votedUsers, playerVotes };
    } catch (err) {
        console.error('Error reading from MongoDB Atlas:', err);
        return { votedUsers: {}, playerVotes: {} };
    }
}

app.get('/api/auth/login', (req, res) => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(authUrl);
});

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/?error=no_code');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { authorization: `${tokenResponse.data.token_type} ${tokenResponse.data.access_token}` }
        });

        req.session.user = {
            id: userResponse.data.id,
            username: userResponse.data.username,
            avatar: userResponse.data.avatar
        };

        res.redirect('/');
    } catch (err) {
        console.error('OAuth error:', err.response?.data || err.message);
        res.redirect('/?error=auth_failed');
    }
});

app.get('/api/user', async (req, res) => {
    if (req.session && req.session.user) {
        try {
            const userId = req.session.user.id;
            const userVoteRecord = await VoteRecord.findOne({ userId });

            res.json({
                loggedIn: true,
                user: req.session.user,
                hasVoted: !!userVoteRecord,
                existingVote: userVoteRecord || null
            });
        } catch (err) {
            console.error('Error checking user vote status:', err);
            res.json({ loggedIn: true, user: req.session.user, hasVoted: false, existingVote: null });
        }
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.post('/api/vote', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must log in with Discord first!' });
    }

    const userId = req.session.user.id;
    const username = req.session.user.username;
    const { squad, captainId } = req.body;

    try {
        const existingVote = await VoteRecord.findOne({ userId });
        if (existingVote) {
            return res.status(400).json({ error: 'You have already voted! Use Edit Ballot to modify your selection.' });
        }

        if (!squad || Object.keys(squad).length < 11) {
            return res.status(400).json({ error: 'Invalid ballot. Complete 11 squad picks.' });
        }

        await VoteRecord.create({ userId, username, squad, captainId, updateCount: 1 });
        const db = await readData();

        let squadText = '';
        for (let slot in squad) {
            const p = squad[slot];
            const isCapt = captainId === p.id;
            squadText += `**${slot}**: ${p.name} ${isCapt ? '⭐ *(Captain)*' : ''}\n`;
        }

        const sortedLeaderboard = Object.entries(db.playerVotes)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => `**#${idx + 1}** ${name} — \`${count} vote(s)\``)
            .join('\n');

        const webhookData = {
            embeds: [{
                title: "🏆 NEW TS DEX TOTY BALLOT SUBMITTED!",
                color: 0xF5C518,
                fields: [
                    { name: "👤 Voter", value: `${username} (<@${userId}>)`, inline: true },
                    { name: "🆔 Discord ID", value: `\`${userId}\``, inline: true },
                    { name: "📋 Submitted XI", value: squadText || "No data" },
                    { name: "📊 Live Nominee Standings", value: sortedLeaderboard || "No votes yet" }
                ],
                footer: { text: "TS DEX TOTY 2026 Voting System • v1" },
                timestamp: new Date().toISOString()
            }]
        };

        await axios.post(WEBHOOK_URL, webhookData);
        res.json({ success: true });

    } catch (err) {
        console.error('Failed to submit vote to MongoDB:', err);
        res.status(500).json({ error: 'An error occurred while submitting your vote.' });
    }
});

app.put('/api/vote', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must log in with Discord first!' });
    }

    const userId = req.session.user.id;
    const username = req.session.user.username;
    const { squad, captainId } = req.body;

    try {
        if (!squad || Object.keys(squad).length < 11) {
            return res.status(400).json({ error: 'Invalid ballot. Complete 11 squad picks.' });
        }

        const currentRecord = await VoteRecord.findOne({ userId });
        const nextUpdateCount = currentRecord ? (currentRecord.updateCount || 1) + 1 : 2;

        const updatedRecord = await VoteRecord.findOneAndUpdate(
            { userId },
            { squad, captainId, username, updateCount: nextUpdateCount },
            { new: true }
        );

        const db = await readData();

        let squadText = '';
        for (let slot in squad) {
            const p = squad[slot];
            const isCapt = captainId === p.id;
            squadText += `**${slot}**: ${p.name} ${isCapt ? '⭐ *(Captain)*' : ''}\n`;
        }

        const sortedLeaderboard = Object.entries(db.playerVotes)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => `**#${idx + 1}** ${name} — \`${count} vote(s)\``)
            .join('\n');

        const webhookData = {
            embeds: [{
                title: `✏️ TS DEX TOTY BALLOT UPDATED [v${nextUpdateCount}]`,
                color: 0x00D2FF,
                fields: [
                    { name: "👤 User", value: `${username} (<@${userId}>)`, inline: true },
                    { name: "🆔 Discord ID", value: `\`${userId}\``, inline: true },
                    { name: "📋 Updated XI", value: squadText || "No data" },
                    { name: "📊 Live Nominee Standings", value: sortedLeaderboard || "No votes yet" }
                ],
                footer: { text: `TS DEX TOTY 2026 Voting System • Update #${nextUpdateCount}` },
                timestamp: new Date().toISOString()
            }]
        };

        await axios.post(WEBHOOK_URL, webhookData);
        res.json({ success: true, existingVote: updatedRecord });

    } catch (err) {
        console.error('Failed to update vote in MongoDB:', err);
        res.status(500).json({ error: 'An error occurred while updating your vote.' });
    }
});

app.get('/api/vote/user/:query', async (req, res) => {
    const query = req.params.query.trim().toLowerCase();
    try {
        const record = await VoteRecord.findOne({
            $or: [
                { userId: query },
                { username: { $regex: new RegExp(`^${query}$`, 'i') } }
            ]
        });

        if (!record) {
            return res.status(404).json({ error: 'No ballot found for this username or ID.' });
        }

        res.json({ success: true, vote: record });
    } catch (err) {
        console.error('Error searching vote record:', err);
        res.status(500).json({ error: 'Server error while searching ballot.' });
    }
});

// ADMIN ROUTES
app.post('/api/admin/reset-all', async (req, res) => {
    try {
        await VoteRecord.deleteMany({});
        res.json({ success: true, message: 'All votes successfully wiped.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset all votes.' });
    }
});

app.delete('/api/admin/reset-user/:userId', async (req, res) => {
    try {
        const targetId = req.params.userId;
        const result = await VoteRecord.findOneAndDelete({ userId: targetId });
        if (!result) return res.status(404).json({ error: 'User vote record not found.' });
        res.json({ success: true, message: `Vote for user ${targetId} deleted.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user vote.' });
    }
});

app.listen(PORT, () => console.log(`TS DEX TOTY Server running on http://localhost:${PORT}`));