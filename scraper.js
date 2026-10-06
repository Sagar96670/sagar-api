const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "catalog.json");

function loadCatalog() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw || "[]");
    } catch (err) {
        return [];
    }
}

function saveCatalog(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function extractWatchPageLink(watchUrl) {
    try {
        const { data } = await axios.get(watchUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            timeout: 8000
        });
        const $ = cheerio.load(data);
        let mediaSrc = $("iframe").attr("src") || $("iframe").attr("data-src") || $("video source").attr("src");

        if (mediaSrc && mediaSrc.startsWith("//")) {
            mediaSrc = "https:" + mediaSrc;
        }

        return mediaSrc || watchUrl;
    } catch (err) {
        return watchUrl;
    }
}

function cleanTitle(rawTitle) {
    let text = rawTitle.replace(/[\t\n\r]+/g, " ").replace(/\s+/g, " ").trim();
    const parts = text.split(" ");
    const half = Math.floor(parts.length / 2);
    const firstHalf = parts.slice(0, half).join(" ");
    const secondHalf = parts.slice(half).join(" ");
    if (firstHalf === secondHalf && firstHalf.length > 0) {
        return firstHalf;
    }
    return text;
}

async function syncAnimeData() {
    try {
        console.log("🌊 Sagar API: Syncing Anime Catalog...");
        
        const TARGET_URL = "https://www.desidubanime.me/"; 
        const { data } = await axios.get(TARGET_URL, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        
        const $ = cheerio.load(data);
        let catalog = loadCatalog();
        let updated = false;

        const posts = $(".post, article, .item, .post-card").get();

        for (const el of posts) {
            let title = $(el).find(".entry-title, .title, h2, h3").first().text();
            title = cleanTitle(title);

            const poster = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
            const watchLink = $(el).find("a").attr("href") || "";

            const epMatch = title.match(/Episode\s*(\d+)/i) || title.match(/Ep\s*(\d+)/i) || watchLink.match(/episode-(\d+)/i);
            const epNum = epMatch ? parseInt(epMatch[1]) : 1;

            if (!title || !watchLink) continue;

            const embedLink = await extractWatchPageLink(watchLink);

            let anime = catalog.find(item => item.title.toLowerCase() === title.toLowerCase());

            if (!anime) {
                catalog.push({
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    title: title,
                    poster: poster,
                    episodes: [{ episodeNumber: epNum, streamUrl: embedLink, embedUrl: embedLink }],
                    updatedAt: new Date().toISOString()
                });
                updated = true;
                console.log("✨ Added -> " + title + " | Embed: " + embedLink);
            } else {
                const epExists = anime.episodes.some(ep => ep.episodeNumber === epNum);
                if (!epExists) {
                    anime.episodes.push({ episodeNumber: epNum, streamUrl: embedLink, embedUrl: embedLink });
                    anime.updatedAt = new Date().toISOString();
                    updated = true;
                    console.log("🚀 Ep Added -> " + title + " Ep " + epNum);
                }
            }
        }

        if (updated) {
            saveCatalog(catalog);
            console.log("✅ Catalog JSON Updated!");
        } else {
            console.log("ℹ️ No new updates found.");
        }
    } catch (err) {
        console.error("❌ Sync Error:", err.message);
    }
}

module.exports = syncAnimeData;
