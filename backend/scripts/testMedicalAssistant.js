require('dotenv').config();
const mongoose = require('mongoose');
const medicalAssistantChain = require('../src/langchain/chains/medicalAssistantChain');
const Patient = require('../src/models/Patient');
const MedicalProtocol = require('../src/models/MedicalProtocol');

/**
 * Test Medical Assistant
 * Simple test script to verify the medical assistant is working
 * 
 * Usage: node scripts/testMedicalAssistant.js
 */

async function testMedicalAssistant() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_assistant';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Test 1: Simple medical query without patient context
        console.log('📋 Test 1: Simple Medical Query');
        console.log('Question: "What is the protocol for hypertension management?"\n');

        const result1 = await medicalAssistantChain.processQuery(
            'What is the protocol for hypertension management?',
            {
                queryType: 'protocol_search'
            }
        );

        console.log('Answer:', result1.answer.substring(0, 300) + '...\n');
        console.log('Sources found:', result1.sources.length);
        console.log('Requires review:', result1.requiresReview);
        console.log('Guardrails passed:', result1.guardrails.passed);
        console.log('Response time:', result1.responseTime + 'ms\n');
        console.log('---\n');

        // Test 2: Query with patient context
        console.log('📋 Test 2: Query with Patient Context');
        const patient = await Patient.findOne();

        if (patient) {
            console.log('Patient:', patient.anonymizedId);
            console.log('Question: "What medications should we consider for this patient?"\n');

            const result2 = await medicalAssistantChain.processQuery(
                'What medications should we consider for this patient with hypertension?',
                {
                    patientId: patient._id,
                    patientContext: patient.getMedicalSummary(),
                    queryType: 'treatment_suggestion'
                }
            );

            console.log('Answer:', result2.answer.substring(0, 300) + '...\n');
            console.log('Patient allergies considered:', patient.allergies.length);
            console.log('Requires review:', result2.requiresReview);
            console.log('Response time:', result2.responseTime + 'ms\n');
        } else {
            console.log('⚠️ No patients found. Run seedMedicalData.js first.\n');
        }

        console.log('---\n');

        // Test 3: Check protocols in database
        console.log('📋 Test 3: Database Check');
        const protocolCount = await MedicalProtocol.countDocuments({ status: 'active' });
        const patientCount = await Patient.countDocuments({ status: 'active' });

        console.log('Active protocols:', protocolCount);
        console.log('Active patients:', patientCount);

        if (protocolCount === 0) {
            console.log('\n⚠️ No protocols found. Run seedMedicalData.js to populate the database.');
        }

        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run the test
testMedicalAssistant();
