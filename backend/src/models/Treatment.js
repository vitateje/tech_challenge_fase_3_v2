const mongoose = require('mongoose');

/**
 * Treatment Model
 * Stores treatment suggestions from AI and doctors
 * Implements validation workflow to ensure human oversight
 */
const TreatmentSchema = new mongoose.Schema({
    // Patient Reference
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },

    // Treatment Information
    treatmentType: {
        type: String,
        required: true,
        enum: [
            'medication',
            'procedure',
            'therapy',
            'surgery',
            'lifestyle_change',
            'monitoring',
            'other'
        ]
    },

    // Treatment details
    treatment: {
        name: String,
        description: String,
        dosage: String, // For medications
        frequency: String,
        duration: String,
        instructions: String
    },

    // Source of suggestion
    suggestedBy: {
        source: {
            type: String,
            enum: ['ai', 'doctor', 'protocol'],
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        aiQueryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicalQuery'
        }
    },

    // Protocol reference if based on protocol
    protocolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalProtocol'
    },

    protocolCode: String,

    // Validation workflow - CRITICAL for safety
    status: {
        type: String,
        enum: [
            'suggested',      // AI suggested, awaiting review
            'under_review',   // Being reviewed by doctor
            'approved',       // Approved by doctor
            'modified',       // Modified from original suggestion
            'rejected',       // Rejected by doctor
            'active',         // Currently being administered
            'completed',      // Treatment completed
            'discontinued'    // Treatment stopped
        ],
        default: 'suggested',
        index: true
    },

    // Validation by medical professional - REQUIRED for AI suggestions
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    validatedAt: Date,

    validationNotes: String,

    // Modifications made during validation
    modifications: [{
        field: String,
        originalValue: String,
        newValue: String,
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        modifiedAt: Date,
        reason: String
    }],

    // Rationale for treatment
    rationale: String,

    // Expected outcomes
    expectedOutcomes: [String],

    // Contraindications checked
    contraindicationsChecked: {
        type: Boolean,
        default: false
    },

    contraindications: [String],

    // Drug interactions checked (for medications)
    drugInteractionsChecked: {
        type: Boolean,
        default: false
    },

    drugInteractions: [String],

    // Allergy check
    allergyCheckPerformed: {
        type: Boolean,
        default: false
    },

    allergyWarnings: [String],

    // Priority
    priority: {
        type: String,
        enum: ['routine', 'important', 'urgent', 'critical'],
        default: 'routine'
    },

    // Start and end dates
    startDate: Date,
    endDate: Date,

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
    collection: 'treatments',
    timestamps: true
});

// Indexes for queries
TreatmentSchema.index({ patientId: 1, status: 1 });
TreatmentSchema.index({ 'suggestedBy.source': 1, status: 1 });
TreatmentSchema.index({ validatedBy: 1, validatedAt: -1 });

/**
 * Method to check if treatment requires validation
 */
TreatmentSchema.methods.requiresValidation = function () {
    // AI suggestions always require validation
    if (this.suggestedBy.source === 'ai') {
        return !this.validatedBy;
    }
    return false;
};

/**
 * Method to validate treatment
 */
TreatmentSchema.methods.validate = async function (validatorId, notes = '') {
    this.validatedBy = validatorId;
    this.validatedAt = new Date();
    this.validationNotes = notes;
    this.status = 'approved';
    return this.save();
};

/**
 * Method to reject treatment
 */
TreatmentSchema.methods.reject = async function (validatorId, reason) {
    this.validatedBy = validatorId;
    this.validatedAt = new Date();
    this.validationNotes = reason;
    this.status = 'rejected';
    return this.save();
};

/**
 * Method to get treatment summary
 */
TreatmentSchema.methods.getSummary = function () {
    return {
        id: this._id,
        type: this.treatmentType,
        name: this.treatment.name,
        description: this.treatment.description,
        status: this.status,
        suggestedBy: this.suggestedBy.source,
        requiresValidation: this.requiresValidation(),
        validated: !!this.validatedBy,
        priority: this.priority
    };
};

/**
 * Static method to get treatments requiring validation
 */
TreatmentSchema.statics.getTreatmentsRequiringValidation = async function (options = {}) {
    const { limit = 20, skip = 0 } = options;

    return this.find({
        'suggestedBy.source': 'ai',
        status: { $in: ['suggested', 'under_review'] },
        validatedBy: { $exists: false }
    })
        .populate('patientId', 'name anonymizedId')
        .populate('protocolId', 'title protocolCode')
        .limit(limit)
        .skip(skip)
        .sort({ priority: -1, createdAt: 1 });
};

/**
 * Static method to get active treatments for a patient
 */
TreatmentSchema.statics.getActiveTreatments = async function (patientId) {
    return this.find({
        patientId,
        status: { $in: ['approved', 'active'] }
    })
        .populate('validatedBy', 'name specialty')
        .populate('protocolId', 'title protocolCode')
        .sort({ priority: -1, startDate: -1 });
};

module.exports = mongoose.model('Treatment', TreatmentSchema);
