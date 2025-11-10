const pdfParse = require('pdf-parse');

/**
 * Mock OCR service - simulates text extraction from images
 * For production, integrate Google Vision API or similar
 */

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || 'PDF content extracted (text layer not available)';
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}`);
  }
}

/**
 * Mock image OCR - returns simulated prescription text
 * In production, replace with actual OCR (Google Vision, AWS Textract, etc.)
 */
async function recognizeImage(buffer) {
  // Simulated OCR result - in production use real OCR service
  const mockResults = [
    `Patient: John Doe
Date: 2025-11-10
Dr. Name: Dr. Smith

PRESCRIPTION:
1. Paracetamol 500mg - 2 tablets twice daily for 5 days
2. Ibuprofen 400mg - 1 tablet once daily with food
3. Amoxicillin 500mg - 1 capsule three times daily for 7 days

Side effects: May cause dizziness or nausea`,
    
    `Rx Date: 11/10/2025
Patient ID: 12345
Doctor: Dr. Johnson

Medications:
- Aspirin 75mg daily
- Metformin 500mg twice daily
- Atorvastatin 20mg at night

Instructions: Take with water after meals`,
    
    `PRESCRIPTION
Date: November 10, 2025
Patient: Jane Smith

1. Omeprazole 20mg - once daily before breakfast
2. Cetirizine 10mg - at night
3. Vitamin D3 2000IU - daily

Refills: 2 available`
  ];

  // Return random mock prescription to simulate OCR
  const randomIndex = Math.floor(Math.random() * mockResults.length);
  return mockResults[randomIndex];
}

/**
 * Recognize file (image or PDF)
 */
async function recognizeFile(buffer, fileType) {
  if (fileType === 'pdf' || fileType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }
  // For images, use mock OCR
  return recognizeImage(buffer);
}

/**
 * Process multiple files
 */
async function recognizeMultiple(buffers) {
  const results = [];

  for (const buffer of buffers) {
    try {
      const text = await recognizeImage(buffer);
      results.push({ text, error: null });
    } catch (err) {
      results.push({ text: null, error: err.message });
    }
  }

  return results;
}

module.exports = {
  recognizeImage,
  extractTextFromPDF,
  recognizeFile,
  recognizeMultiple
};
