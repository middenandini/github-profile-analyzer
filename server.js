const express = require('express');
const axios = require('axios');
const db = require('./db'); // Connects to your Aiven MySQL cloud database

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Helper function to calculate a simple activity score (Extra insight feature)
const calculateActivityScore = (repos, followers) => {
    return (repos * 2) + followers;
};

// ==========================================
// 1. POST: Fetch from GitHub and Save to MySQL
// ==========================================
app.post('/api/profiles/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Check if this profile has already been analyzed and stored in MySQL
        const existing = await db.query("SELECT * FROM profiles WHERE username = ?", [username]);
        if (existing.length > 0) {
            return res.json({ 
                message: "Profile already analyzed and saved!", 
                data: existing[0] 
            });
        }

        // Fetch data from the public GitHub API
        const githubResponse = await axios.get(`https://api.github.com/users/${username}`, {
            headers: { 'User-Agent': 'Nodejs-App' }
        });

        const { name, bio, public_repos, followers, following } = githubResponse.data;

        // Insert the analyzed insights into your cloud database
        await db.query(
            "INSERT INTO profiles (username, name, bio, public_repos, followers, following) VALUES (?, ?, ?, ?, ?, ?)",
            [username, name, bio || 'No bio provided', public_repos, followers, following]
        );

        // Fetch the row we just saved to send it back in the response
        const savedProfile = await db.query("SELECT * FROM profiles WHERE username = ?", [username]);

        res.status(201).json({
            message: "Profile analyzed and saved successfully!",
            data: {
                ...savedProfile[0],
                insights: {
                    activity_score: calculateActivityScore(public_repos, followers),
                    profile_status: public_repos > 20 ? "Highly Active Developer" : "Standard User"
                }
            }
        });

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: "GitHub user not found!" });
        }
        console.error("Error processing request:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ==========================================
// 2. GET: Retrieve All Analyzed Profiles List
// ==========================================
app.get('/api/profiles', async (req, res) => {
    try {
        const profiles = await db.query("SELECT * FROM profiles ORDER BY created_at DESC");
        res.json({
            count: profiles.length,
            profiles: profiles
        });
    } catch (error) {
        console.error("Error fetching profiles:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server running successfully on port ${PORT}`);
    console.log(`🔗 Local testing API link: http://localhost:${PORT}/api/profiles`);
    console.log(`==================================================`);
});