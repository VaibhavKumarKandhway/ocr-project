const { getMedicineByName, searchMedicines } = require('../database/medicinesDB');

function smartParseMedicineText(text) {
  if (!text || typeof text !== 'string') return null;

  const medicines = [];
  const lines = text.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const parsed = parseMedicineLine(line);
    if (parsed) {
      medicines.push(parsed);
    }
  }

  return medicines.length > 0 ? medicines : null;
}

function parseMedicineLine(line) {
  const medicineName = extractMedicineName(line);
  if (!medicineName) return null;

  const dosage = extractDosage(line);
  const frequency = extractFrequency(line);
  const duration = extractDuration(line);

  return {
    name: medicineName,
    dosage: dosage,
    frequency: frequency,
    duration: duration,
    rawLine: line
  };
}

function extractMedicineName(text) {
  const medicinePatterns = [
    /^(\w+(?:\s+\w+)?)/,
  ];

  const upperText = text.toUpperCase();
  const commonNames = [
    'PARACETAMOL', 'IBUPROFEN', 'ASPIRIN', 'AMOXICILLIN', 'CALPOL',
    'TYLENOL', 'BRUFEN', 'COMBIFLAM', 'DOLO', 'AMOXIL', 'AMOXYCARE',
    'ACETAMINOPHEN', 'PENICILLIN', 'METFORMIN', 'OMEPRAZOLE', 'ATORVASTATIN'
  ];

  for (const name of commonNames) {
    if (upperText.includes(name)) {
      return name.charAt(0) + name.slice(1).toLowerCase();
    }
  }

  // Extract first meaningful word
  const match = text.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/);
  return match ? match[1].trim() : null;
}

// Extract dosage (e.g., 500mg, 1 tablet)
function extractDosage(text) {
  const dosageRegex = /(\d+(?:\.\d+)?)\s*(mg|g|ml|tablet|cap|ml)/i;
  const match = text.match(dosageRegex);
  return match ? `${match[1]}${match[2]}` : null;
}

function extractFrequency(text) {
  const frequencyPatterns = {
    'OD': 'Once daily',
    'BD': 'Twice daily',
    'TDS': 'Thrice daily',
    'QID': 'Four times daily',
    '1-1-1': 'Thrice daily',
    '1-0-1': 'Twice daily',
    'ONCE': 'Once daily',
    'TWICE': 'Twice daily',
    'THRICE': 'Thrice daily'
  };

  const upperText = text.toUpperCase();
  for (const [pattern, frequency] of Object.entries(frequencyPatterns)) {
    if (upperText.includes(pattern)) {
      return frequency;
    }
  }

  if (upperText.includes('DAILY')) {
    return 'Daily';
  }

  return 'Once daily';
}

function extractDuration(text) {
  const durationRegex = /(\d+)\s*(day|week|month|yr|years?)/i;
  const match = text.match(durationRegex);
  
  if (match) {
    const unit = match[2].toLowerCase();
    const normalizedUnit = unit.endsWith('s') ? unit : unit + 's';
    return `${match[1]} ${normalizedUnit}`;
  }

  return null;
}

function enrichMedicineData(parsedMedicines) {
  return parsedMedicines.map(med => {
    const dbMedicine = getMedicineByName(med.name);
    
    if (dbMedicine) {
      return {
        ...med,
        found: true,
        genericName: dbMedicine.genericName,
        brands: dbMedicine.brands,
        sideEffects: dbMedicine.brands[0]?.sideEffects || [],
        interactions: dbMedicine.brands[0]?.interactions || [],
        maxDailyDose: dbMedicine.brands[0]?.safety?.maxDailyDose
      };
    }

    // Try to find similar medicine
    const searchResults = searchMedicines(med.name);
    if (searchResults.length > 0) {
      return {
        ...med,
        found: true,
        genericName: searchResults[0].genericName || med.name,
        brands: searchResults[0].brands || [],
        sideEffects: searchResults[0].brands?.[0]?.sideEffects || [],
        interactions: searchResults[0].brands?.[0]?.interactions || [],
        maxDailyDose: searchResults[0].brands?.[0]?.safety?.maxDailyDose
      };
    }

    return {
      ...med,
      found: false,
      warning: 'Medicine not found in database'
    };
  });
}

// Validate dosage against max recommended dose
function validateDosage(medicine) {
  if (!medicine.dosage || !medicine.maxDailyDose) {
    return { valid: true, warning: null };
  }

  // Parse dosage numbers
  const dosageMatch = medicine.dosage.match(/(\d+)/);
  const maxMatch = medicine.maxDailyDose.match(/(\d+)/);

  if (!dosageMatch || !maxMatch) {
    return { valid: true, warning: null };
  }

  const dosageNum = parseInt(dosageMatch[1]);
  const maxNum = parseInt(maxMatch[1]);

  if (dosageNum > maxNum) {
    return {
      valid: false,
      warning: `Dosage ${medicine.dosage} may exceed max daily dose of ${medicine.maxDailyDose}`
    };
  }

  return { valid: true, warning: null };
}

module.exports = {
  smartParseMedicineText,
  parseMedicineLine,
  extractMedicineName,
  extractDosage,
  extractFrequency,
  extractDuration,
  enrichMedicineData,
  validateDosage
};
