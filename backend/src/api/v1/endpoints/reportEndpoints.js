const express = require('express');
const multer = require('multer');
const tesseract = require('../../../services/tesseractService');
const { smartParseMedicineText, enrichMedicineData } = require('../../../utils/smartParser');
const { generateSafetyReport } = require('../../../services/medicineAnalysisService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileType = req.file.mimetype;
    const extractedText = await tesseract.recognizeFile(req.file.buffer, fileType);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No text found in image/document' });
    }

    const parsedMedicines = smartParseMedicineText(extractedText);

    if (!parsedMedicines || parsedMedicines.length === 0) {
      return res.json({
        success: true,
        extractedText,
        medicines: [],
        message: 'Text extracted but no medicines parsed. Please review text manually.'
      });
    }

    // Enrich with database information
    const enrichedMedicines = enrichMedicineData(parsedMedicines);
    const safetyReport = generateSafetyReport(enrichedMedicines);

    return res.json({
      success: true,
      extractedText,
      medicines: enrichedMedicines,
      report: safetyReport,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Upload image error:', err);
    return res.status(500).json({
      error: 'OCR processing failed',
      details: err.message
    });
  }
});

router.post('/upload-pdf', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const extractedText = await tesseract.extractTextFromPDF(req.file.buffer);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    const parsedMedicines = smartParseMedicineText(extractedText);
    const enrichedMedicines = enrichMedicineData(parsedMedicines || []);
    const safetyReport = generateSafetyReport(enrichedMedicines);

    return res.json({
      success: true,
      extractedText,
      medicines: enrichedMedicines,
      report: safetyReport,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Upload PDF error:', err);
    return res.status(500).json({
      error: 'PDF processing failed',
      details: err.message
    });
  }
});

module.exports = router;
