const express = require('express');
const {
  compareBrands,
  generateSafetyReport
} = require('../../../services/medicineAnalysisService');
const { getMedicineByName, getBrandsForMedicine } = require('../../../database/medicinesDB');

const router = express.Router();

// POST /api/v1/medicines/compare
// Compare two brands of same medicine
router.post('/compare', (req, res) => {
  try {
    const { genericName, brand1, brand2, dosage1, dosage2 } = req.body;

    if (!genericName || !brand1 || !brand2 || !dosage1 || !dosage2) {
      return res.status(400).json({
        error: 'Missing required fields: genericName, brand1, brand2, dosage1, dosage2'
      });
    }

    const comparison = compareBrands(genericName, brand1, brand2, dosage1, dosage2);

    if (comparison.error) {
      return res.status(400).json({ error: comparison.error });
    }

    return res.json({
      success: true,
      comparison,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Comparison error:', err);
    return res.status(500).json({
      error: 'Comparison failed',
      details: err.message
    });
  }
});

// GET /api/v1/medicines/brands/:genericName
// Get all brands for a medicine
router.get('/brands/:genericName', (req, res) => {
  try {
    const { genericName } = req.params;
    const brands = getBrandsForMedicine(genericName);

    if (!brands || brands.length === 0) {
      return res.status(404).json({
        error: `No brands found for medicine: ${genericName}`
      });
    }

    return res.json({
      success: true,
      genericName,
      brands: brands.map(b => ({
        name: b.name,
        manufacturer: b.manufacturer,
        dosageForm: b.dosageForm,
        strengths: b.strengths,
        pricing: b.pricing,
        safety: b.safety
      }))
    });
  } catch (err) {
    console.error('Get brands error:', err);
    return res.status(500).json({
      error: 'Failed to get brands',
      details: err.message
    });
  }
});

// GET /api/v1/medicines/info/:medicineName
// Get medicine information
router.get('/info/:medicineName', (req, res) => {
  try {
    const { medicineName } = req.params;
    const medicine = getMedicineByName(medicineName);

    if (!medicine) {
      return res.status(404).json({
        error: `Medicine not found: ${medicineName}`
      });
    }

    return res.json({
      success: true,
      genericName: medicine.genericName,
      brands: medicine.brands.map(b => ({
        name: b.name,
        manufacturer: b.manufacturer,
        dosageForm: b.dosageForm,
        strengths: b.strengths,
        ingredients: b.ingredients,
        sideEffects: b.sideEffects,
        interactions: b.interactions,
        pricing: b.pricing,
        safety: b.safety
      }))
    });
  } catch (err) {
    console.error('Get info error:', err);
    return res.status(500).json({
      error: 'Failed to get medicine info',
      details: err.message
    });
  }
});

// POST /api/v1/medicines/search
// Search medicines
router.post('/search', (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const { searchMedicines } = require('../../database/medicinesDB');
    const results = searchMedicines(query);

    return res.json({
      success: true,
      query,
      results,
      count: results.length
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({
      error: 'Search failed',
      details: err.message
    });
  }
});

// POST /api/v1/medicines/multi-compare
// Compare multiple medicines for interactions
router.post('/multi-compare', (req, res) => {
  try {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return res.status(400).json({
        error: 'At least 2 medicines required for comparison'
      });
    }

    const { enrichMedicineData } = require('../../utils/smartParser');
    const enrichedMedicines = enrichMedicineData(medicines);
    const report = generateSafetyReport(enrichedMedicines);

    return res.json({
      success: true,
      medicines: enrichedMedicines,
      report,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Multi-compare error:', err);
    return res.status(500).json({
      error: 'Multi-comparison failed',
      details: err.message
    });
  }
});

module.exports = router;
