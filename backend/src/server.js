const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const reportEndpoints = require('./api/v1/endpoints/reportEndpoints');
const medicineEndpoints = require('./api/v1/endpoints/medicineEndpoints');
const comparisonEndpoints = require('./api/v1/endpoints/comparisonEndpoints');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'CuraSense Diagnosis - Prescription Analysis Backend',
    version: '1.0.0',
    endpoints: {
      report: {
        'POST /api/v1/report/upload-image': 'Upload prescription image and extract text',
        'POST /api/v1/report/upload-pdf': 'Upload prescription PDF and extract text'
      },
      medicines: {
        'POST /api/v1/medicines/manual-entry': 'Enter medicines manually',
        'POST /api/v1/medicines/validate': 'Validate medicines',
        'GET /api/v1/medicines/info/:medicineName': 'Get medicine information',
        'GET /api/v1/medicines/brands/:genericName': 'Get brands for a medicine',
        'POST /api/v1/medicines/search': 'Search medicines'
      },
      comparison: {
        'POST /api/v1/medicines/compare': 'Compare two brands',
        'POST /api/v1/medicines/multi-compare': 'Compare multiple medicines for interactions'
      }
    }
  });
});

// API Routes v1
app.use('/api/v1/report', reportEndpoints);
app.use('/api/v1/medicines', medicineEndpoints);
app.use('/api/v1/medicines', comparisonEndpoints);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
