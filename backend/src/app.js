const express = require('express');
const cors = require('cors');

// Authentication
const authRoutes = require('./routes/authRoutes');

// Medical Assistant Routes
const medicalAssistantRoutes = require('./routes/medicalAssistantRoutes');
const patientRoutes = require('./routes/patientRoutes');
const workflowRoutes = require('./routes/workflowRoutes');

// User management
const userRoutes = require('./routes/userRoutes');

const { errorHandler } = require('./utils/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Medical Assistant Routes
app.use('/api/medical', medicalAssistantRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/workflows', workflowRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
