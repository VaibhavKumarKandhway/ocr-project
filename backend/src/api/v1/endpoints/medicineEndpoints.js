const express = require('express');
const { enrichMedicineData, validateDosage } = require('../../../utils/smartParser');
const { generateSafetyReport } = require('../../../services/medicineAnalysisService');

const router = express.Router();

// POST /api/v1/medicines/manual-entry
// Accept manually entered medicine details
router.post('/manual-entry', (req, res) => {
  try {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        error: 'Please provide an array of medicines with at least name'
      });
    }

    // Validate and enrich each medicine
    const enrichedMedicines = enrichMedicineData(medicines);

    // Validate dosages
    const medicinesWithValidation = enrichedMedicines.map(med => ({
      ...med,
      dosageValidation: validateDosage(med)
    }));

    // Generate safety report
    const safetyReport = generateSafetyReport(medicinesWithValidation);

    return res.json({
      success: true,
      medicines: medicinesWithValidation,
      report: safetyReport,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Manual entry error:', err);
    return res.status(500).json({
      error: 'Manual entry processing failed',
      details: err.message
    });
  }
});

// POST /api/v1/medicines/validate
// Validate medicine dosage and interactions
router.post('/validate', (req, res) => {
  try {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ error: 'Invalid medicines array' });
    }

    const enrichedMedicines = enrichMedicineData(medicines);
    const validationResults = enrichedMedicines.map(med => ({
      name: med.name,
      dosage: med.dosage,
      found: med.found,
      dosageValidation: validateDosage(med),
      interactions: med.interactions || [],
      warnings: med.warning ? [med.warning] : []
    }));

    const safetyReport = generateSafetyReport(enrichedMedicines);

    return res.json({
      success: true,
      validations: validationResults,
      report: safetyReport
    });
  } catch (err) {
    console.error('Validation error:', err);
    return res.status(500).json({
      error: 'Validation failed',
      details: err.message
    });
  }
});

module.exports = router;
