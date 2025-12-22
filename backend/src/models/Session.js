const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastActivity: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        index: true
    }
});

// Index for cleanup of expired sessions
sessionSchema.index({ expiresAt: 1 });

// Update lastActivity on save
sessionSchema.pre('save', function (next) {
    this.lastActivity = new Date();
    next();
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
