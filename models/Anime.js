const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
    episodeNumber: { type: Number, required: true },
    title: { type: String },
    streamUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

const AnimeSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    poster: { type: String },
    genres: [{ type: String }],
    status: { type: String, default: "Ongoing" },
    episodes: [EpisodeSchema]
}, { timestamps: true });

module.exports = mongoose.model('Anime', AnimeSchema);
