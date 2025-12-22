const mongoose = require('mongoose');

/**
 * MedicalProtocol Model
 * Stores hospital medical protocols for RAG retrieval
 * Used by the AI assistant to provide protocol-based recommendations
 */
const MedicalProtocolSchema = new mongoose.Schema({
    // Protocol Identification
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    // Protocol code/identifier (e.g., PROT-CARD-001)
    protocolCode: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },

    // Category for organization
    category: {
        type: String,
        required: true,
        enum: [
            'cardiology',
            'emergency',
            'surgery',
            'pediatrics',
            'oncology',
            'neurology',
            'general',
            'infectious_disease',
            'other'
        ],
        index: true
    },

    // Subcategory for more specific classification
    subcategory: {
        type: String,
        trim: true
    },

    // Protocol Content - Main text for RAG
    content: {
        type: String,
        required: true
    },

    // Structured sections for better retrieval
    sections: [{
        title: String,
        content: String,
        order: Number
    }],

    // Keywords for search optimization
    keywords: [{
        type: String,
        lowercase: true
    }],

    // Related conditions/symptoms
    relatedConditions: [{
        type: String
    }],

    // Version control
    version: {
        type: String,
        default: '1.0'
    },

    // Approval and validity
    approvedBy: {
        type: String,
        required: true
    },

    approvalDate: {
        type: Date,
        required: true
    },

    expiryDate: {
        type: Date
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'active', 'archived', 'superseded'],
        default: 'draft',
        index: true
    },

    // Reference to superseding protocol if applicable
    supersededBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalProtocol'
    },

    // Metadata for RAG
    metadata: {
        urgencyLevel: {
            type: String,
            enum: ['routine', 'urgent', 'emergency', 'critical']
        },
        targetAudience: [{
            type: String,
            enum: ['doctor', 'nurse', 'specialist', 'all']
        }],
        estimatedReadTime: Number, // in minutes
        complexity: {
            type: String,
            enum: ['basic', 'intermediate', 'advanced']
        }
    },

    // Usage tracking
    usageCount: {
        type: Number,
        default: 0
    },

    lastUsed: Date,

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'medical_protocols',
    timestamps: true
});

// Text index for full-text search
MedicalProtocolSchema.index({
    title: 'text',
    content: 'text',
    keywords: 'text',
    relatedConditions: 'text'
});

// Compound index for common queries
MedicalProtocolSchema.index({ category: 1, status: 1 });

/**
 * Pre-save hook to update version history
 */
MedicalProtocolSchema.pre('save', function (next) {
    if (this.isModified('content') && !this.isNew) {
        // Increment minor version on content update
        const [major, minor] = this.version.split('.');
        this.version = `${major}.${parseInt(minor) + 1}`;
    }
    next();
});

/**
 * Method to get protocol summary for AI context
 */
MedicalProtocolSchema.methods.getSummary = function () {
    return {
        code: this.protocolCode,
        title: this.title,
        category: this.category,
        version: this.version,
        content: this.content.substring(0, 500) + '...', // First 500 chars
        keywords: this.keywords
    };
};

/**
 * Method to format protocol for RAG embedding
 * Returns structured text optimized for vector search
 */
MedicalProtocolSchema.methods.toRAGDocument = function () {
    const sections = this.sections
        .sort((a, b) => a.order - b.order)
        .map(s => `${s.title}:\n${s.content}`)
        .join('\n\n');

    return {
        id: this._id.toString(),
        content: `
Protocol: ${this.title} (${this.protocolCode})
Category: ${this.category}
Version: ${this.version}

${this.content}

${sections}

Keywords: ${this.keywords.join(', ')}
Related Conditions: ${this.relatedConditions.join(', ')}
    `.trim(),
        metadata: {
            protocolCode: this.protocolCode,
            category: this.category,
            version: this.version,
            keywords: this.keywords,
            urgencyLevel: this.metadata.urgencyLevel
        }
    };
};

/**
 * Static method to search protocols
 */
MedicalProtocolSchema.statics.searchProtocols = async function (query, options = {}) {
    const {
        category = null,
        status = 'active',
        limit = 10,
        skip = 0
    } = options;

    const searchCriteria = { status };

    if (category) {
        searchCriteria.category = category;
    }

    if (query) {
        searchCriteria.$text = { $search: query };
    }

    return this.find(searchCriteria)
        .limit(limit)
        .skip(skip)
        .sort({ score: { $meta: 'textScore' }, usageCount: -1 });
};

/**
 * Static method to increment usage count
 */
MedicalProtocolSchema.statics.recordUsage = async function (protocolId) {
    return this.findByIdAndUpdate(
        protocolId,
        {
            $inc: { usageCount: 1 },
            $set: { lastUsed: new Date() }
        },
        { new: true }
    );
};

module.exports = mongoose.model('MedicalProtocol', MedicalProtocolSchema);
