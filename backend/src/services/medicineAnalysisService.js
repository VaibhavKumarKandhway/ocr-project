const {
  getMedicineByName,
  getBrandDetails,
  getBrandsForMedicine
} = require('../database/medicinesDB');
const { validateDosage } = require('../utils/smartParser');

function compareBrands(genericName, brand1Name, brand2Name, dosage1, dosage2) {
  const brands = getBrandsForMedicine(genericName);
  const brand1 = brands.find(b => b.name.toLowerCase() === brand1Name.toLowerCase());
  const brand2 = brands.find(b => b.name.toLowerCase() === brand2Name.toLowerCase());

  if (!brand1 || !brand2) {
    return { error: 'One or both brands not found' };
  }

  const comparison = {
    genericName,
    brand1: {
      name: brand1.name,
      manufacturer: brand1.manufacturer,
      dosage: dosage1,
      price: brand1.pricing[dosage1] || 'N/A',
      ingredients: brand1.ingredients,
      sideEffects: brand1.sideEffects,
      interactions: brand1.interactions,
      safety: brand1.safety
    },
    brand2: {
      name: brand2.name,
      manufacturer: brand2.manufacturer,
      dosage: dosage2,
      price: brand2.pricing[dosage2] || 'N/A',
      ingredients: brand2.ingredients,
      sideEffects: brand2.sideEffects,
      interactions: brand2.interactions,
      safety: brand2.safety
    },
    analysis: {
      ingredientMatches: compareIngredients(brand1.ingredients, brand2.ingredients),
      priceDifference: calculatePriceDifference(
        brand1.pricing[dosage1],
        brand2.pricing[dosage2]
      ),
      safetyComparison: compareSafety(brand1.safety, brand2.safety),
      recommendation: generateRecommendation(brand1, brand2, dosage1, dosage2)
    }
  };

  return comparison;
}

function compareIngredients(ingredients1, ingredients2) {
  const match = ingredients1.every(ing => ingredients2.includes(ing));
  return {
    match,
    uniqueInBrand1: ingredients1.filter(ing => !ingredients2.includes(ing)),
    uniqueInBrand2: ingredients2.filter(ing => !ingredients1.includes(ing))
  };
}

function calculatePriceDifference(price1, price2) {
  if (!price1 || !price2) return null;

  const diff = Math.abs(price1 - price2);
  const percentDiff = ((diff / Math.min(price1, price2)) * 100).toFixed(2);
  const cheaper = price1 < price2 ? 'Brand 1' : 'Brand 2';

  return {
    difference: diff,
    percentageDifference: percentDiff + '%',
    cheaper
  };
}

function compareSafety(safety1, safety2) {
  const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3 };
  const risk1 = riskLevels[safety1.riskLevel] || 2;
  const risk2 = riskLevels[safety2.riskLevel] || 2;

  return {
    brand1Risk: safety1.riskLevel,
    brand2Risk: safety2.riskLevel,
    safer: risk1 < risk2 ? 'Brand 1' : risk2 < risk1 ? 'Brand 2' : 'Similar',
    brand1Warnings: safety1.warnings,
    brand2Warnings: safety2.warnings
  };
}

// Generate recommendation
function generateRecommendation(brand1, brand2, dosage1, dosage2) {
  const factors = [];
  
  // Price factor
  const price1 = brand1.pricing[dosage1] || 999;
  const price2 = brand2.pricing[dosage2] || 999;
  if (price1 < price2) {
    factors.push(`Brand 1 is more affordable (${price1} vs ${price2})`);
  } else if (price2 < price1) {
    factors.push(`Brand 2 is more affordable (${price2} vs ${price1})`);
  }

  // Safety factor
  const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3 };
  const risk1 = riskLevels[brand1.safety?.riskLevel] || 2;
  const risk2 = riskLevels[brand2.safety?.riskLevel] || 2;
  if (risk1 < risk2) {
    factors.push(`Brand 1 has lower risk profile (${brand1.safety?.riskLevel})`);
  } else if (risk2 < risk1) {
    factors.push(`Brand 2 has lower risk profile (${brand2.safety?.riskLevel})`);
  }

  // Manufacturer reputation (simple heuristic)
  const knownManufacturers = ['GSK', 'Johnson & Johnson', 'Abbott', 'Pfizer'];
  if (knownManufacturers.includes(brand1.manufacturer)) {
    factors.push(`Brand 1 is from established manufacturer (${brand1.manufacturer})`);
  }
  if (knownManufacturers.includes(brand2.manufacturer)) {
    factors.push(`Brand 2 is from established manufacturer (${brand2.manufacturer})`);
  }

  return {
    recommendation: factors.length > 0
      ? factors[0]
      : 'Both brands are suitable; choose based on availability and preference',
    factors
  };
}

// Generate comprehensive safety report
function generateSafetyReport(medicines) {
  const report = {
    medicines: [],
    interactions: [],
    warnings: [],
    recommendations: []
  };

  // Add medicine details
  medicines.forEach(med => {
    if (med.found) {
      report.medicines.push({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        sideEffects: med.sideEffects,
        interactions: med.interactions,
        maxDailyDose: med.maxDailyDose
      });
    }
  });

  // Check for drug interactions
  const allInteractions = [];
  medicines.forEach((med, idx) => {
    if (med.interactions) {
      med.interactions.forEach(interaction => {
        // Check if another medicine in list interacts
        medicines.forEach((other, otherIdx) => {
          if (idx !== otherIdx) {
            const otherName = other.name.toUpperCase();
            if (interaction.toUpperCase().includes(otherName)) {
              allInteractions.push({
                between: `${med.name} and ${other.name}`,
                interaction,
                severity: 'High'
              });
            }
          }
        });
      });
    }
  });

  report.interactions = allInteractions;

  // Generate warnings
  medicines.forEach(med => {
    const dosageValidation = validateDosage(med);
    if (!dosageValidation.valid) {
      report.warnings.push({
        medicine: med.name,
        type: 'Dosage',
        message: dosageValidation.warning
      });
    }

    if (!med.found) {
      report.warnings.push({
        medicine: med.name,
        type: 'Database',
        message: 'Medicine not found in database - verify manually'
      });
    }
  });

  // Recommendations
  if (allInteractions.length > 0) {
    report.recommendations.push('⚠️ Potential drug interactions detected. Consult healthcare provider.');
  }
  if (report.warnings.length > 0) {
    report.recommendations.push('⚠️ Review warnings above before taking medicines.');
  }
  if (report.warnings.length === 0 && allInteractions.length === 0) {
    report.recommendations.push('✓ No major interactions detected. Proceed as per prescription.');
  }

  return report;
}

module.exports = {
  compareBrands,
  compareIngredients,
  calculatePriceDifference,
  compareSafety,
  generateRecommendation,
  generateSafetyReport
};
