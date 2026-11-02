const express = require('express');
const axios = require('axios');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURATION
const CLIENT_ID = '1566859679441752184';
const CLIENT_SECRET = 'c7UlC3fZcG3C1Z0lZcpaoFySe934CzH8';
const REDIRECT_URI = 'https://ts-dex-team-of-the-year-2027-vote.onrender.com/api/auth/callback';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1566859350381953099/hzapHaaXFpXqYaAuHSqjieC1KLOmjHr3qgg3nb3jUVk5FbK6F4iP-DMwp0IFTerMKQdY';

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({
    secret: 'ts_dex_toty_secret_key_2027',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 Days
}));

// DATABASE SETUP (JSON file storage)
const DATA_FILE = path.join(__dirname, 'votes.json');
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ votedUsers: {}, playerVotes: {} }, null, 2));
}

function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return { votedUsers: {}, playerVotes: {} };
        }
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8').trim();
        if (!fileContent) {
            return { votedUsers: {}, playerVotes: {} };
        }
        return JSON.parse(fileContent);
    } catch (err) {
        // Fallback if JSON is broken
        return { votedUsers: {}, playerVotes: {} };
    }
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// OAUTH2 ROUTES
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
            username: `${userResponse.data.username}`,
            avatar: userResponse.data.avatar
        };

        res.redirect('/');
    } catch (err) {
        console.error('OAuth error:', err.response?.data || err.message);
        res.redirect('/?error=auth_failed');
    }
});

app.get('/api/user', (req, res) => {
    const db = readData();
    if (req.session && req.session.user) {
        const userId = req.session.user.id;
        const userVoteRecord = db.votedUsers[userId];
        const hasVoted = !!userVoteRecord;
        res.json({
            loggedIn: true,
            user: req.session.user,
            hasVoted,
            existingVote: userVoteRecord || null
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// SUBMIT VOTE ROUTE
app.post('/api/vote', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must log in with Discord first!' });
    }

    const userId = req.session.user.id;
    const username = req.session.user.username;
    const { squad, captainId } = req.body;

    const db = readData();

    if (db.votedUsers[userId]) {
        return res.status(400).json({ error: 'You have already voted! Each Discord account can only vote once.' });
    }

    if (!squad || Object.keys(squad).length < 11) {
        return res.status(400).json({ error: 'Invalid ballot. Complete 11 squad picks.' });
    }

    // Record Vote
    db.votedUsers[userId] = {
        username,
        squad,
        captainId,
        timestamp: new Date().toISOString()
    };

    // Increment Player Vote Counts
    for (let slot in squad) {
        const pName = squad[slot].name;
        db.playerVotes[pName] = (db.playerVotes[pName] || 0) + 1;
    }

    saveData(db);

    // SEND DISCORD WEBHOOK BROADCAST
    try {
        let squadText = '';
        for (let slot in squad) {
            const p = squad[slot];
            const isCapt = captainId === p.id;
            squadText += `**${slot}**: ${p.name} ${isCapt ? '⭐ *(Captain)*' : ''}\n`;
        }

        // Top Voted Leaderboard Summary
        const sortedLeaderboard = Object.entries(db.playerVotes)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => `**#${idx + 1}** ${name} — \`${count} vote(s)\``)
            .join('\n');

        const webhookData = {
            embeds: [{
                title: "🏆 NEW TS DEX TOTY BALLOT SUBMITTED!",
                color: 0xF5C518, // Gold
                fields: [
                    { name: "👤 Voter", value: `${username} (<@${userId}>)`, inline: true },
                    { name: "🆔 Discord ID", value: `\`${userId}\``, inline: true },
                    { name: "📋 Submitted XI", value: squadText || "No data" },
                    { name: "📊 Live Nominee Standings", value: sortedLeaderboard || "No votes yet" }
                ],
                footer: { text: "TS DEX TOTY 2027 Voting System" },
                timestamp: new Date().toISOString()
            }]
        };

        await axios.post(WEBHOOK_URL, webhookData);
    } catch (err) {
        console.error('Failed to post webhook:', err.message);
    }

    res.json({ success: true });
});

app.listen(PORT, () => console.log(`TS DEX TOTY Server running on http://localhost:${PORT}`));