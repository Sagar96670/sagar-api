const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const syncAnimeData = require("./scraper");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "catalog.json");

app.use(cors());
app.use(express.json());

function getCatalog() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw || "[]");
    } catch (err) {
        return [];
    }
}

// Auto-Sync Data on Start & Every 30 Minutes
syncAnimeData();
setInterval(syncAnimeData, 30 * 60 * 1000);

// 1. Full Catalog Route
app.get("/api/v1/catalog", (req, res) => {
    const catalog = getCatalog();
    res.json({ success: true, count: catalog.length, data: catalog });
});

// 2. Search Route
app.get("/api/v1/search", (req, res) => {
    const query = (req.query.q || "").toLowerCase();
    const catalog = getCatalog();
    const results = catalog.filter(item => item.title.toLowerCase().includes(query));
    res.json({ success: true, count: results.length, data: results });
});

// Root Health Check Route
app.get("/", (req, res) => {
    res.json({ message: "🌊 Sagar API Engine is Live!", status: "Active" });
});

app.listen(PORT, () => {
    console.log(`🌊 Sagar API Live: http://localhost:${PORT}`);
});
