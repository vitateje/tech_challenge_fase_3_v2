const mongoose = require('mongoose');

/**
 * MedicalQuery Model
 * Logs all medical queries for audit trail and explainability
 * Critical for compliance and tracking AI assistant usage
 */
const MedicalQuerySchema = new mongoose.Schema({
    // Query Information
    question: {
        type: String,
        required: true
    },

    // AI Response
    answer: {
        type: String,
        required: true
    },

    // Source Attribution - Critical for explainability
    sources: [{
        type: {
            type: String,
            enum: ['protocol', 'knowledge_base', 'llm', 'rag_document'],
            required: true
        },
        reference: String, // Protocol code, document ID, etc.
        title: String,
        relevanceScore: Number,
        excerpt: String // Relevant excerpt from source
    }],

    // Context Information
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        index: true
    },

    // Medical staff who made the query
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Query metadata
    queryType: {
        type: String,
        enum: [
            'protocol_search',
            'treatment_suggestion',
            'diagnosis_support',
            'drug_interaction',
            'general_medical',
            'other'
        ],
        default: 'general_medical'
    },

    // Patient context (anonymized summary if applicable)
    patientContext: {
        age: Number,
        gender: String,
        conditions: [String],
        medications: [String]
    },

    // AI Model Information
    modelInfo: {
        provider: String, // 'gemini', 'openai', etc.
        model: String,
        temperature: Number,
        tokensUsed: Number
    },

    // Guardrails and Safety
    guardrailFlags: [{
        flag: String,
        severity: {
            type: String,
            enum: ['info', 'warning', 'critical']
        },
        message: String
    }],

    // Was this flagged for human review?
    requiresReview: {
        type: Boolean,
        default: false
    },

    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    reviewedAt: Date,

    reviewNotes: String,

    // Feedback from medical staff
    feedback: {
        helpful: Boolean,
        accurate: Boolean,
        comments: String,
        rating: {
            type: Number,
            min: 1,
            max: 5
        }
    },

    // Response time tracking
    responseTime: {
        type: Number, // milliseconds
        default: 0
    },

    // Session information
    sessionId: String,

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    collection: 'medical_queries',
    timestamps: true
});

// Indexes for audit queries
MedicalQuerySchema.index({ doctorId: 1, createdAt: -1 });
MedicalQuerySchema.index({ patientId: 1, createdAt: -1 });
MedicalQuerySchema.index({ queryType: 1, createdAt: -1 });
MedicalQuerySchema.index({ requiresReview: 1, reviewedAt: 1 });

/**
 * Method to get audit summary
 */
MedicalQuerySchema.methods.getAuditSummary = function () {
    return {
        id: this._id,
        timestamp: this.createdAt,
        doctor: this.doctorId,
        patient: this.patientId,
        queryType: this.queryType,
        question: this.question.substring(0, 100) + '...',
        sources: this.sources.map(s => ({
            type: s.type,
            reference: s.reference
        })),
        requiresReview: this.requiresReview,
        reviewed: !!this.reviewedAt
    };
};

/**
 * Static method to get queries requiring review
 */
MedicalQuerySchema.statics.getQueriesRequiringReview = async function (options = {}) {
    const { limit = 20, skip = 0 } = options;

    return this.find({
        requiresReview: true,
        reviewedAt: { $exists: false }
    })
        .populate('doctorId', 'name email')
        .populate('patientId', 'anonymizedId name')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });
};

/**
 * Static method to get audit trail for a patient
 */
MedicalQuerySchema.statics.getPatientAuditTrail = async function (patientId, options = {}) {
    const { limit = 50, skip = 0 } = options;

    return this.find({ patientId })
        .populate('doctorId', 'name specialty')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });
};

/**
 * Static method to get doctor's query history
 */
MedicalQuerySchema.statics.getDoctorQueryHistory = async function (doctorId, options = {}) {
    const { limit = 50, skip = 0, queryType = null } = options;

    const query = { doctorId };
    if (queryType) {
        query.queryType = queryType;
    }

    return this.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });
};

/**
 * Static method to generate usage statistics
 */
MedicalQuerySchema.statics.getUsageStats = async function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: {
                    queryType: '$queryType',
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                },
                count: { $sum: 1 },
                avgResponseTime: { $avg: '$responseTime' },
                reviewRequired: {
                    $sum: { $cond: ['$requiresReview', 1, 0] }
                }
            }
        },
        {
            $sort: { '_id.date': -1 }
        }
    ]);
};

module.exports = mongoose.model('MedicalQuery', MedicalQuerySchema);
