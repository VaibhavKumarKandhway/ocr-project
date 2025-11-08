const medicinesDB = {
  paracetamol: {
    genericName: "Paracetamol (Acetaminophen)",
    brands: [
      {
        name: "Calpol",
        manufacturer: "GSK",
        dosageForm: "Tablet/Suspension",
        strengths: ["500mg", "650mg"],
        ingredients: ["Paracetamol", "Starch", "Magnesium Stearate"],
        sideEffects: ["Rare allergic reactions", "Liver damage if overdosed"],
        interactions: ["Alcohol", "Warfarin", "Other acetaminophen products"],
        pricing: { "500mg": 50, "650mg": 60 },
        safety: {
          maxDailyDose: "4000mg",
          riskLevel: "Low",
          warnings: ["Do not exceed 4g/day", "Risk of liver damage with alcohol"]
        }
      },
      {
        name: "Tylenol",
        manufacturer: "Johnson & Johnson",
        dosageForm: "Tablet/Capsule",
        strengths: ["500mg", "650mg"],
        ingredients: ["Paracetamol", "Corn Starch", "Cellulose"],
        sideEffects: ["Rare allergic reactions", "Liver damage if overdosed"],
        interactions: ["Alcohol", "Warfarin"],
        pricing: { "500mg": 55, "650mg": 65 },
        safety: {
          maxDailyDose: "4000mg",
          riskLevel: "Low",
          warnings: ["Do not exceed 4g/day", "Caution with alcohol"]
        }
      },
      {
        name: "Dolo",
        manufacturer: "Micro Labs",
        dosageForm: "Tablet",
        strengths: ["500mg"],
        ingredients: ["Paracetamol", "Lactose", "Talc"],
        sideEffects: ["Rare allergic reactions"],
        interactions: ["Alcohol", "Warfarin"],
        pricing: { "500mg": 30 },
        safety: {
          maxDailyDose: "4000mg",
          riskLevel: "Low",
          warnings: ["Do not exceed 4g/day"]
        }
      }
    ]
  },
  ibuprofen: {
    genericName: "Ibuprofen",
    brands: [
      {
        name: "Brufen",
        manufacturer: "Abbott",
        dosageForm: "Tablet/Suspension",
        strengths: ["200mg", "400mg", "600mg"],
        ingredients: ["Ibuprofen", "Cellulose", "Magnesium Stearate"],
        sideEffects: ["Gastric irritation", "GI bleeding", "Rash"],
        interactions: ["Aspirin", "Warfarin", "ACE inhibitors", "NSAIDs"],
        pricing: { "200mg": 45, "400mg": 55, "600mg": 70 },
        safety: {
          maxDailyDose: "1200mg",
          riskLevel: "Medium",
          warnings: ["Take with food", "Avoid with other NSAIDs", "Risk of GI bleeding"]
        }
      },
      {
        name: "Combiflam",
        manufacturer: "Sanofi",
        dosageForm: "Tablet",
        strengths: ["400mg + 37.5mg (with Paracetamol)"],
        ingredients: ["Ibuprofen", "Paracetamol", "Starch"],
        sideEffects: ["GI irritation", "Dizziness", "Rash"],
        interactions: ["Aspirin", "Warfarin", "NSAIDs"],
        pricing: { "combo": 60 },
        safety: {
          maxDailyDose: "1200mg",
          riskLevel: "Medium",
          warnings: ["Do not take with other NSAIDs or acetaminophen", "Take with food"]
        }
      }
    ]
  },
  amoxicillin: {
    genericName: "Amoxicillin",
    brands: [
      {
        name: "Amoxil",
        manufacturer: "GSK",
        dosageForm: "Capsule/Tablet",
        strengths: ["250mg", "500mg"],
        ingredients: ["Amoxicillin trihydrate", "Magnesium Stearate", "Silicon Dioxide"],
        sideEffects: ["Rash", "Diarrhea", "Allergic reactions"],
        interactions: ["Methotrexate", "Warfarin", "Oral contraceptives"],
        pricing: { "250mg": 40, "500mg": 50 },
        safety: {
          maxDailyDose: "3000mg",
          riskLevel: "Low",
          warnings: ["Complete full course", "Risk of resistance if stopped early"]
        }
      },
      {
        name: "Amoxycare",
        manufacturer: "Cipla",
        dosageForm: "Capsule",
        strengths: ["250mg", "500mg"],
        ingredients: ["Amoxicillin trihydrate", "Talc", "Magnesium Stearate"],
        sideEffects: ["Rash", "Diarrhea", "Allergic reactions"],
        interactions: ["Methotrexate", "Warfarin"],
        pricing: { "250mg": 35, "500mg": 45 },
        safety: {
          maxDailyDose: "3000mg",
          riskLevel: "Low",
          warnings: ["Complete full course"]
        }
      }
    ]
  }
};

function getAllMedicines() {
  return medicinesDB;
}

function getMedicineByName(genericName) {
  const key = Object.keys(medicinesDB).find(
    k => k.toLowerCase() === genericName.toLowerCase()
  );
  return key ? medicinesDB[key] : null;
}

function getBrandDetails(genericName, brandName) {
  const medicine = getMedicineByName(genericName);
  if (!medicine) return null;
  return medicine.brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
}

function getBrandsForMedicine(genericName) {
  const medicine = getMedicineByName(genericName);
  return medicine ? medicine.brands : [];
}

function searchMedicines(query) {
  const results = [];
  Object.entries(medicinesDB).forEach(([key, medicine]) => {
    if (key.toLowerCase().includes(query.toLowerCase())) {
      results.push({ generic: key, ...medicine });
    }
    medicine.brands.forEach(brand => {
      if (brand.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({ generic: key, brand: brand.name, ...medicine });
      }
    });
  });
  return results;
}

module.exports = {
  medicinesDB,
  getAllMedicines,
  getMedicineByName,
  getBrandDetails,
  getBrandsForMedicine,
  searchMedicines
};
