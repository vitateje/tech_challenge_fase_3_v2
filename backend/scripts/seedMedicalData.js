require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../src/models/Patient');
const MedicalProtocol = require('../src/models/MedicalProtocol');
const User = require('../src/models/User');
const Exam = require('../src/models/Exam');

/**
 * Seed Medical Data Script
 * Populates database with synthetic medical data for testing
 * 
 * Usage: node scripts/seedMedicalData.js
 */

async function seedMedicalData() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_assistant';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Create medical staff users
        console.log('\n📋 Creating medical staff users...');
        const doctor = await User.findOneAndUpdate(
            { email: 'doctor@hospital.com' },
            {
                name: 'Dr. João Silva',
                email: 'doctor@hospital.com',
                password: 'demo@123', // Will be hashed by pre-save hook
                role: 'doctor',
                specialty: 'Cardiology',
                licenseNumber: 'CRM-12345',
                department: 'Cardiology'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ Created doctor: ${doctor.name}`);

        const nurse = await User.findOneAndUpdate(
            { email: 'nurse@hospital.com' },
            {
                name: 'Enf. Maria Santos',
                email: 'nurse@hospital.com',
                password: 'demo@123',
                role: 'nurse',
                department: 'Emergency',
                licenseNumber: 'COREN-54321'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ Created nurse: ${nurse.name}`);

        // Create sample patients
        console.log('\n👥 Creating sample patients...');
        const patient1 = await Patient.create({
            name: 'Carlos Oliveira',
            age: 65,
            gender: 'male',
            medicalHistory: [
                {
                    condition: 'Hypertension',
                    diagnosedDate: new Date('2020-01-15'),
                    status: 'chronic',
                    notes: 'Controlled with medication'
                },
                {
                    condition: 'Type 2 Diabetes',
                    diagnosedDate: new Date('2019-06-20'),
                    status: 'chronic',
                    notes: 'Diet controlled'
                }
            ],
            allergies: [
                {
                    allergen: 'Penicillin',
                    severity: 'severe',
                    reaction: 'Anaphylaxis'
                }
            ],
            currentMedications: [
                {
                    medication: 'Losartan',
                    dosage: '50mg',
                    frequency: 'Once daily',
                    startDate: new Date('2020-01-20'),
                    prescribedBy: 'Dr. João Silva'
                },
                {
                    medication: 'Metformin',
                    dosage: '850mg',
                    frequency: 'Twice daily',
                    startDate: new Date('2019-07-01'),
                    prescribedBy: 'Dr. João Silva'
                }
            ],
            vitalSigns: {
                bloodPressure: { systolic: 130, diastolic: 85 },
                heartRate: 72,
                temperature: 36.5,
                weight: 82,
                height: 175,
                lastUpdated: new Date()
            },
            contact: {
                phone: '(11) 98765-4321',
                email: 'carlos.oliveira@email.com',
                emergencyContact: {
                    name: 'Ana Oliveira',
                    relationship: 'Spouse',
                    phone: '(11) 98765-1234'
                }
            },
            status: 'active',
            admissionDate: new Date()
        });
        console.log(`✅ Created patient: ${patient1.anonymizedId}`);

        const patient2 = await Patient.create({
            name: 'Ana Costa',
            age: 42,
            gender: 'female',
            medicalHistory: [
                {
                    condition: 'Asthma',
                    diagnosedDate: new Date('2015-03-10'),
                    status: 'active',
                    notes: 'Mild, controlled with inhaler'
                }
            ],
            allergies: [
                {
                    allergen: 'Aspirin',
                    severity: 'moderate',
                    reaction: 'Skin rash'
                }
            ],
            currentMedications: [
                {
                    medication: 'Salbutamol Inhaler',
                    dosage: '100mcg',
                    frequency: 'As needed',
                    startDate: new Date('2015-04-01'),
                    prescribedBy: 'Dr. João Silva'
                }
            ],
            vitalSigns: {
                bloodPressure: { systolic: 120, diastolic: 80 },
                heartRate: 68,
                temperature: 36.7,
                weight: 65,
                height: 162,
                lastUpdated: new Date()
            },
            contact: {
                phone: '(11) 97654-3210',
                email: 'ana.costa@email.com'
            },
            status: 'active',
            admissionDate: new Date()
        });
        console.log(`✅ Created patient: ${patient2.anonymizedId}`);

        // Create sample exams
        console.log('\n🔬 Creating sample exams...');
        await Exam.create({
            patientId: patient1._id,
            examType: 'blood_test',
            examName: 'Complete Blood Count',
            status: 'pending',
            requestedBy: doctor._id,
            priority: 'routine',
            notes: 'Routine check for diabetes monitoring'
        });
        console.log('✅ Created pending blood test');

        await Exam.create({
            patientId: patient1._id,
            examType: 'ecg',
            examName: 'Electrocardiogram',
            status: 'completed',
            requestedBy: doctor._id,
            performedBy: doctor._id,
            completedDate: new Date(),
            results: {
                summary: 'Normal sinus rhythm',
                findings: ['Heart rate: 72 bpm', 'No arrhythmias detected'],
                conclusion: 'Normal ECG',
                recommendations: 'Continue current medication'
            },
            priority: 'routine'
        });
        console.log('✅ Created completed ECG');

        // Create sample medical protocols
        console.log('\n📚 Creating sample medical protocols...');
        await MedicalProtocol.create({
            title: 'Hypertension Management Protocol',
            protocolCode: 'PROT-CARD-001',
            category: 'cardiology',
            subcategory: 'Hypertension',
            content: `
# Hypertension Management Protocol

## Objective
Standardized approach to managing hypertension in adult patients.

## Diagnosis Criteria
- Systolic BP ≥ 140 mmHg or Diastolic BP ≥ 90 mmHg on two separate occasions
- Or patient already on antihypertensive medication

## Initial Assessment
1. Complete medical history
2. Physical examination
3. Laboratory tests:
   - Complete blood count
   - Serum electrolytes
   - Creatinine and eGFR
   - Fasting glucose
   - Lipid profile
   - ECG

## Treatment Approach

### Lifestyle Modifications (All Patients)
- DASH diet
- Sodium restriction (<2g/day)
- Regular physical activity (150 min/week)
- Weight management (BMI 18.5-24.9)
- Limit alcohol consumption
- Smoking cessation

### Pharmacological Treatment

#### First-Line Agents
- ACE Inhibitors (e.g., Enalapril, Lisinopril)
- ARBs (e.g., Losartan, Valsartan)
- Calcium Channel Blockers (e.g., Amlodipine)
- Thiazide Diuretics (e.g., Hydrochlorothiazide)

#### Target BP
- General population: <140/90 mmHg
- Diabetes or CKD: <130/80 mmHg
- Elderly (>65 years): <150/90 mmHg

## Follow-up
- Initial: Every 2-4 weeks until BP controlled
- Stable: Every 3-6 months
- Monitor for medication side effects

## Referral Criteria
- Resistant hypertension (uncontrolled on 3+ medications)
- Secondary hypertension suspected
- Hypertensive emergency (BP >180/120 with organ damage)
      `.trim(),
            sections: [
                { title: 'Diagnosis', content: 'BP ≥ 140/90 mmHg', order: 1 },
                { title: 'Treatment', content: 'Lifestyle + Medication', order: 2 },
                { title: 'Follow-up', content: 'Every 2-4 weeks initially', order: 3 }
            ],
            keywords: ['hypertension', 'blood pressure', 'cardiovascular', 'ace inhibitor', 'arb'],
            relatedConditions: ['Diabetes', 'Chronic Kidney Disease', 'Cardiovascular Disease'],
            approvedBy: 'Medical Director',
            approvalDate: new Date('2024-01-01'),
            status: 'active',
            metadata: {
                urgencyLevel: 'routine',
                targetAudience: ['doctor', 'nurse'],
                complexity: 'intermediate'
            }
        });
        console.log('✅ Created Hypertension Protocol');

        await MedicalProtocol.create({
            title: 'Emergency Chest Pain Protocol',
            protocolCode: 'PROT-EMER-001',
            category: 'emergency',
            subcategory: 'Chest Pain',
            content: `
# Emergency Chest Pain Protocol

## Immediate Actions (First 10 Minutes)

### Assessment
1. Vital signs (BP, HR, SpO2, Temperature)
2. 12-lead ECG within 10 minutes
3. Brief history (OPQRST)
4. Physical examination

### Initial Management
1. Oxygen if SpO2 <94%
2. IV access
3. Continuous cardiac monitoring
4. Aspirin 300mg (chewed) unless contraindicated

## Risk Stratification

### High Risk (STEMI/NSTEMI)
- ST elevation or depression
- Positive troponin
- Hemodynamic instability
- → Activate cardiac catheterization team

### Moderate Risk
- Atypical chest pain
- Risk factors present
- → Observation unit, serial troponins

### Low Risk
- Atypical pain
- Normal ECG
- No risk factors
- → Consider discharge with follow-up

## Treatment

### STEMI
1. Aspirin 300mg
2. Clopidogrel 600mg or Ticagrelor 180mg
3. Heparin
4. Morphine for pain
5. Primary PCI within 90 minutes

### NSTEMI/Unstable Angina
1. Dual antiplatelet therapy
2. Anticoagulation
3. Beta-blocker
4. Statin
5. Risk stratification for catheterization

## Contraindications to Aspirin
- Known allergy
- Active bleeding
- Severe thrombocytopenia

## Red Flags
- Hypotension
- Severe dyspnea
- Altered mental status
- Arrhythmias
      `.trim(),
            sections: [
                { title: 'Immediate Actions', content: 'ECG within 10 minutes', order: 1 },
                { title: 'Risk Stratification', content: 'STEMI vs NSTEMI', order: 2 },
                { title: 'Treatment', content: 'Based on risk level', order: 3 }
            ],
            keywords: ['chest pain', 'stemi', 'nstemi', 'cardiac', 'emergency', 'myocardial infarction'],
            relatedConditions: ['Acute Coronary Syndrome', 'Myocardial Infarction', 'Angina'],
            approvedBy: 'Emergency Medicine Director',
            approvalDate: new Date('2024-01-01'),
            status: 'active',
            metadata: {
                urgencyLevel: 'emergency',
                targetAudience: ['doctor', 'nurse'],
                complexity: 'advanced'
            }
        });
        console.log('✅ Created Emergency Chest Pain Protocol');

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Medical Staff: 2 users created`);
        console.log(`- Patients: 2 patients created`);
        console.log(`- Exams: 2 exams created`);
        console.log(`- Protocols: 2 protocols created`);

        console.log('\n🔑 Login Credentials:');
        console.log('Doctor: doctor@hospital.com / demo@123');
        console.log('Nurse: nurse@hospital.com / demo@123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run the seed function
seedMedicalData();
