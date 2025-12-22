const mongoose = require('mongoose');

/**
 * Exam Model
 * Tracks medical exams for patients
 * Used in workflow automation to check pending exams and results
 */
const ExamSchema = new mongoose.Schema({
    // Patient Reference
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },

    // Exam Information
    examType: {
        type: String,
        required: true,
        enum: [
            'blood_test',
            'urine_test',
            'x_ray',
            'ct_scan',
            'mri',
            'ultrasound',
            'ecg',
            'echocardiogram',
            'biopsy',
            'endoscopy',
            'other'
        ]
    },

    examName: {
        type: String,
        required: true,
        trim: true
    },

    // Exam code/identifier
    examCode: {
        type: String,
        unique: true,
        sparse: true
    },

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Scheduling
    requestedDate: {
        type: Date,
        default: Date.now
    },

    scheduledDate: Date,

    completedDate: Date,

    // Medical staff
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Results
    results: {
        summary: String,
        findings: [String],
        values: [{
            parameter: String,
            value: String,
            unit: String,
            referenceRange: String,
            abnormal: Boolean
        }],
        conclusion: String,
        recommendations: String
    },

    // Attachments (file paths or URLs)
    attachments: [{
        filename: String,
        filepath: String,
        fileType: String,
        uploadedAt: Date
    }],

    // Priority
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'emergency'],
        default: 'routine'
    },

    // Notes
    notes: String,

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
    collection: 'exams',
    timestamps: true
});

// Indexes for common queries
ExamSchema.index({ patientId: 1, status: 1 });
ExamSchema.index({ requestedBy: 1, createdAt: -1 });
ExamSchema.index({ scheduledDate: 1 });

/**
 * Pre-save hook to generate exam code
 */
ExamSchema.pre('save', function (next) {
    if (!this.examCode) {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.examCode = `EXM-${date}-${random}`;
    }
    next();
});

/**
 * Method to get exam summary for workflows
 */
ExamSchema.methods.getSummary = function () {
    return {
        code: this.examCode,
        type: this.examType,
        name: this.examName,
        status: this.status,
        priority: this.priority,
        scheduledDate: this.scheduledDate,
        hasResults: !!this.results.summary
    };
};

/**
 * Static method to get pending exams for a patient
 */
ExamSchema.statics.getPendingExams = async function (patientId) {
    return this.find({
        patientId,
        status: { $in: ['pending', 'scheduled', 'in_progress'] }
    })
        .populate('requestedBy', 'name specialty')
        .sort({ priority: -1, scheduledDate: 1 });
};

/**
 * Static method to get completed exams with abnormal results
 */
ExamSchema.statics.getAbnormalResults = async function (patientId) {
    return this.find({
        patientId,
        status: 'completed',
        'results.values.abnormal': true
    })
        .populate('requestedBy', 'name specialty')
        .sort({ completedDate: -1 });
};

module.exports = mongoose.model('Exam', ExamSchema);
