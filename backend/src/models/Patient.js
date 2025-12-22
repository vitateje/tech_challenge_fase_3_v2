const mongoose = require('mongoose');

/**
 * Patient Model
 * Stores patient information for the medical virtual assistant
 * Includes anonymization helpers for HIPAA/LGPD compliance
 */
const PatientSchema = new mongoose.Schema({
    // Business identifier (UUID or external id) for integration with RAG and frontend
    patientId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },

    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Explicit full name field as described in the BiobyIA spec
    fullName: {
        type: String,
        trim: true
    },

    // Anonymized identifier for privacy
    anonymizedId: {
        type: String,
        unique: true,
        index: true
    },

    age: {
        type: Number,
        required: true,
        min: 0,
        max: 150
    },

    // Date of birth (used instead of only age when available)
    dob: {
        type: Date
    },

    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'not_specified'],
        default: 'not_specified'
    },

    // Medical History
    medicalHistory: [{
        condition: String,
        // Keep both names for compatibility with spec and existing data
        diagnosedDate: Date,
        diagnosisDate: Date,
        status: {
            type: String,
            enum: ['active', 'resolved', 'chronic'],
            default: 'active'
        },
        notes: String
    }],

    // Allergies - Critical for treatment suggestions
    allergies: [{
        allergen: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe', 'life_threatening'],
            default: 'moderate'
        },
        reaction: String
    }],

    // Current Medications (structured)
    currentMedications: [{
        medication: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        prescribedBy: String
    }],

    // Optional simplified list of medications as strings
    currentMedicationsList: [{
        type: String
    }],

    // Vital Signs (latest)
    vitalSigns: {
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        heartRate: Number,
        temperature: Number,
        weight: Number,
        height: Number,
        lastUpdated: Date
    },

    // Contact Information
    contact: {
        phone: String,
        email: String,
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String
        }
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'discharged', 'transferred', 'deceased'],
        default: 'active'
    },

    // Admission Information
    admissionDate: Date,
    dischargeDate: Date,
    lastVisit: Date,

    // Privacy flags
    isAnonymized: {
        type: Boolean,
        default: false
    },

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
    collection: 'patients',
    timestamps: true
});

// Index for faster searches
PatientSchema.index({ name: 'text' });
PatientSchema.index({ status: 1 });
PatientSchema.index({ admissionDate: -1 });

/**
 * Pre-save hook to generate anonymized ID
 */
PatientSchema.pre('save', function (next) {
    if (!this.anonymizedId) {
        // Generate anonymized ID: PAT-YYYYMMDD-XXXXX
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.anonymizedId = `PAT-${date}-${random}`;
    }
    next();
});

/**
 * Method to get anonymized patient data
 * Removes personally identifiable information
 */
PatientSchema.methods.getAnonymizedData = function () {
    return {
        anonymizedId: this.anonymizedId,
        age: this.age,
        gender: this.gender,
        medicalHistory: this.medicalHistory.map(h => ({
            condition: h.condition,
            status: h.status
        })),
        allergies: this.allergies.map(a => ({
            allergen: a.allergen,
            severity: a.severity
        })),
        currentMedications: this.currentMedications.map(m => ({
            medication: m.medication,
            dosage: m.dosage
        })),
        vitalSigns: this.vitalSigns,
        status: this.status
    };
};

/**
 * Method to get patient summary for AI context
 * Provides relevant medical information without PII
 */
PatientSchema.methods.getMedicalSummary = function () {
    return {
        id: this.anonymizedId,
        age: this.age,
        gender: this.gender,
        activeConditions: this.medicalHistory
            .filter(h => h.status === 'active' || h.status === 'chronic')
            .map(h => h.condition),
        allergies: this.allergies.map(a => `${a.allergen} (${a.severity})`),
        currentMedications: this.currentMedications.map(m => m.medication),
        vitalSigns: this.vitalSigns
    };
};

/**
 * Static method to search patients
 */
PatientSchema.statics.searchPatients = async function (query, options = {}) {
    const { status = 'active', limit = 20, skip = 0 } = options;

    const searchCriteria = { status };

    if (query) {
        searchCriteria.$or = [
            { name: new RegExp(query, 'i') },
            { anonymizedId: new RegExp(query, 'i') }
        ];
    }

    return this.find(searchCriteria)
        .limit(limit)
        .skip(skip)
        .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Patient', PatientSchema);
