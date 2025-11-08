const API_BASE = 'http://localhost:3000/api/v1';
let selectedFile = null;
let medicineFieldCount = 1;
let lastExtractedText = '';

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    switchTab(tabName);
  });
});

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--primary-color)';
  uploadArea.style.background = '#f0f7ff';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = 'var(--secondary-color)';
  uploadArea.style.background = 'white';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
});

const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

function handleFileSelect(file) {
  selectedFile = file;
  const preview = document.getElementById('preview');
  const previewImage = document.getElementById('previewImage');
  const uploadBtn = document.getElementById('uploadBtn');

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      preview.style.display = 'block';
      uploadBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (file.type === 'application/pdf') {
    previewImage.src = '📄';
    preview.innerHTML = '<div style="padding: 20px; text-align: center;"><div style="font-size: 3em;">📄</div><p>PDF File: ' + file.name + '</p></div>';
    preview.style.display = 'block';
    uploadBtn.style.display = 'block';
  }
}

function clearPreview() {
  selectedFile = null;
  document.getElementById('preview').style.display = 'none';
  document.getElementById('uploadBtn').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

// Handle Image Upload and OCR
async function handleUpload() {
  if (!selectedFile) {
    showAlert('Please select a file', 'error');
    return;
  }

  showLoading(true);

  try {
    const formData = new FormData();
    formData.append('prescription', selectedFile);

    let endpoint = '/report/upload-image';
    if (selectedFile.type === 'application/pdf') {
      endpoint = '/report/upload-pdf';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Upload failed', 'error');
      return;
    }

    displayResults(data);
    showAlert('✓ Successfully extracted text and analyzed medicines', 'success');
  } catch (err) {
    // TODO: better error handling
    showAlert('Request failed: ' + err.message, 'error');
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// Manual Entry
function addMedicineField() {
  medicineFieldCount++;
  const medicinesForm = document.getElementById('medicinesForm');
  const newField = document.createElement('div');
  newField.className = 'medicine-input';
  newField.id = 'medicineInput' + medicineFieldCount;
  newField.innerHTML = `
    <div class="form-group">
      <label>Medicine Name *</label>
      <input type="text" class="medicine-name" placeholder="e.g., Paracetamol" data-index="${medicineFieldCount}">
    </div>
    <div class="form-group">
      <label>Dosage</label>
      <input type="text" class="medicine-dosage" placeholder="e.g., 500mg" data-index="${medicineFieldCount}">
    </div>
    <div class="form-group">
      <label>Frequency</label>
      <select class="medicine-frequency" data-index="${medicineFieldCount}">
        <option value="">Select frequency</option>
        <option value="Once daily">Once daily (OD)</option>
        <option value="Twice daily">Twice daily (BD)</option>
        <option value="Thrice daily">Thrice daily (TDS)</option>
        <option value="Four times daily">Four times daily (QID)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Duration</label>
      <input type="text" class="medicine-duration" placeholder="e.g., 5 days" data-index="${medicineFieldCount}">
    </div>
  `;
  medicinesForm.appendChild(newField);
}

async function handleManualSubmit() {
  const medicines = [];

  document.querySelectorAll('.medicine-input').forEach(input => {
    const name = input.querySelector('.medicine-name').value.trim();
    if (name) {
      medicines.push({
        name,
        dosage: input.querySelector('.medicine-dosage').value.trim() || null,
        frequency: input.querySelector('.medicine-frequency').value.trim() || null,
        duration: input.querySelector('.medicine-duration').value.trim() || null
      });
    }
  });

  if (medicines.length === 0) {
    showAlert('Please add at least one medicine', 'error');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`${API_BASE}/medicines/manual-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicines })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Submission failed', 'error');
      return;
    }

    displayResults(data);
    showAlert('✓ Medicines analyzed successfully', 'success');
  } catch (err) {
    showAlert('Request failed: ' + err.message, 'error');
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// Compare Medicines
const compareGenericInput = document.getElementById('compareGeneric');
let compareTimeout;

compareGenericInput.addEventListener('input', (e) => {
  clearTimeout(compareTimeout);
  const query = e.target.value.trim();

  if (query.length < 2) {
    document.getElementById('suggestionsList').innerHTML = '';
    return;
  }

  compareTimeout = setTimeout(() => {
    searchMedicines(query);
  }, 300);
});

async function searchMedicines(query) {
  try {
    const response = await fetch(`${API_BASE}/medicines/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const genericNames = [...new Set(data.results.map(r => r.generic))];
      const suggestionsHtml = genericNames
        .map(g => `<span class="suggestion-item" onclick="selectMedicine('${g}')">${g}</span>`)
        .join('');
      document.getElementById('suggestionsList').innerHTML = suggestionsHtml;
    }
  } catch (err) {
    console.error('Search error:', err);
  }
}

function selectMedicine(medicineName) {
  document.getElementById('compareGeneric').value = medicineName;
  document.getElementById('suggestionsList').innerHTML = '';
}

async function handleComparison() {
  const genericName = document.getElementById('compareGeneric').value.trim();
  const brand1 = document.getElementById('brand1Name').value.trim();
  const brand2 = document.getElementById('brand2Name').value.trim();
  const dosage1 = document.getElementById('brand1Dosage').value.trim();
  const dosage2 = document.getElementById('brand2Dosage').value.trim();

  if (!genericName || !brand1 || !brand2 || !dosage1 || !dosage2) {
    showAlert('Please fill in all fields', 'error');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`${API_BASE}/medicines/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genericName,
        brand1,
        brand2,
        dosage1,
        dosage2
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Comparison failed', 'error');
      return;
    }

    displayComparisonResults(data.comparison);
    showAlert('✓ Medicines compared successfully', 'success');
  } catch (err) {
    showAlert('Request failed: ' + err.message, 'error');
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// Display Results
function displayResults(data) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');
  const toggleButton = document.getElementById('toggleRawText');
  const rawTextContent = document.getElementById('rawTextContent');

  // Store extracted text for raw text view
  if (data.extractedText) {
    lastExtractedText = data.extractedText;
    if (toggleButton) toggleButton.style.display = 'inline-block';
    if (rawTextContent) rawTextContent.textContent = data.extractedText;
  } else {
    lastExtractedText = '';
    if (toggleButton) toggleButton.style.display = 'none';
  }

  let html = '';

  // Extracted text
  if (data.extractedText) {
    html += `
      <div class="result-section">
        <h3>📄 Extracted Text</h3>
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid var(--secondary-color); white-space: pre-wrap; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 0.9em;">
          ${escapeHtml(data.extractedText)}
        </div>
      </div>
    `;
  }

  // Medicines
  if (data.medicines && data.medicines.length > 0) {
    html += '<div class="result-section"><h3>💊 Extracted Medicines</h3>';
    data.medicines.forEach(med => {
      const foundStatus = med.found ? `<span class="item-found">✓ Found in DB</span>` : `<span class="item-not-found">✗ Not in DB</span>`;
      html += `
        <div class="medicine-item">
          <p><span class="item-label">Name:</span> ${escapeHtml(med.name)} ${foundStatus}</p>
          ${med.dosage ? `<p><span class="item-label">Dosage:</span> ${escapeHtml(med.dosage)}</p>` : ''}
          ${med.frequency ? `<p><span class="item-label">Frequency:</span> ${escapeHtml(med.frequency)}</p>` : ''}
          ${med.duration ? `<p><span class="item-label">Duration:</span> ${escapeHtml(med.duration)}</p>` : ''}
          ${med.maxDailyDose ? `<p><span class="item-label">Max Daily Dose:</span> ${escapeHtml(med.maxDailyDose)}</p>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  // Safety Report
  if (data.report) {
    const report = data.report;

    // Interactions
    if (report.interactions && report.interactions.length > 0) {
      html += '<div class="result-section"><h3>⚠️ Drug Interactions</h3>';
      report.interactions.forEach(interaction => {
        html += `
          <div class="interaction-item">
            <p><span class="item-label">Between:</span> ${escapeHtml(interaction.between)}</p>
            <p><span class="item-label">Interaction:</span> ${escapeHtml(interaction.interaction)}</p>
            <p><span class="item-label">Severity:</span> <strong>${escapeHtml(interaction.severity)}</strong></p>
          </div>
        `;
      });
      html += '</div>';
    }

    // Warnings
    if (report.warnings && report.warnings.length > 0) {
      html += '<div class="result-section"><h3>⚠️ Warnings</h3>';
      report.warnings.forEach(warning => {
        html += `
          <div class="warning-item">
            <p><span class="item-label">Medicine:</span> ${escapeHtml(warning.medicine)}</p>
            <p><span class="item-label">Type:</span> ${escapeHtml(warning.type)}</p>
            <p><span class="item-label">Message:</span> ${escapeHtml(warning.message)}</p>
          </div>
        `;
      });
      html += '</div>';
    }

    // Recommendations
    if (report.recommendations && report.recommendations.length > 0) {
      html += '<div class="result-section"><h3>💡 Recommendations</h3>';
      report.recommendations.forEach(rec => {
        html += `<div class="alert alert-info">${escapeHtml(rec)}</div>`;
      });
      html += '</div>';
    }
  }

  resultsContent.innerHTML = html;
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Display Comparison Results
function displayComparisonResults(comparison) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');

  const { brand1, brand2, analysis } = comparison;

  let html = `
    <div class="result-section">
      <h3>⚖️ Brand Comparison: ${comparison.genericName}</h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div class="brand-comparison">
          <h4 style="color: var(--primary-color); margin-bottom: 10px;">${brand1.name}</h4>
          <p><span class="item-label">Manufacturer:</span> ${brand1.manufacturer}</p>
          <p><span class="item-label">Dosage:</span> ${brand1.dosage}</p>
          <p><span class="item-label">Price:</span> ₹${brand1.price}</p>
          <p><span class="item-label">Risk Level:</span> ${brand1.safety?.riskLevel || 'N/A'}</p>
        </div>
        
        <div class="brand-comparison">
          <h4 style="color: var(--secondary-color); margin-bottom: 10px;">${brand2.name}</h4>
          <p><span class="item-label">Manufacturer:</span> ${brand2.manufacturer}</p>
          <p><span class="item-label">Dosage:</span> ${brand2.dosage}</p>
          <p><span class="item-label">Price:</span> ₹${brand2.price}</p>
          <p><span class="item-label">Risk Level:</span> ${brand2.safety?.riskLevel || 'N/A'}</p>
        </div>
      </div>
    </div>

    <div class="result-section">
      <h3>📊 Analysis</h3>
      <div class="medicine-item">
        <p><span class="item-label">Price Difference:</span> ${analysis.priceDifference ? `${analysis.priceDifference.percentageDifference} (${analysis.priceDifference.cheaper} is cheaper)` : 'N/A'}</p>
        <p><span class="item-label">Safety:</span> ${analysis.safetyComparison.safer === 'Similar' ? 'Both brands have similar safety profile' : `${analysis.safetyComparison.safer} is safer`}</p>
        <p><span class="item-label">Ingredients:</span> ${analysis.ingredientMatches.match ? '✓ Identical ingredients' : '✗ Different ingredients'}</p>
      </div>
    </div>

    <div class="result-section">
      <h3>💡 Recommendation</h3>
      <div class="alert alert-success">
        <strong>${analysis.recommendation.recommendation}</strong>
        <ul style="margin-top: 10px; margin-left: 20px;">
          ${analysis.recommendation.factors.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  resultsContent.innerHTML = html;
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function showLoading(show) {
  document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = 'info') {
  const resultsContent = document.getElementById('resultsContent');
  const alertHtml = `<div class="alert alert-${type}">${message}</div>`;

  if (resultsContent.innerHTML.includes('alert')) {
    const existingAlert = resultsContent.querySelector('.alert');
    existingAlert.remove();
  }

  resultsContent.insertAdjacentHTML('afterbegin', alertHtml);

  setTimeout(() => {
    const alert = resultsContent.querySelector('.alert');
    if (alert) alert.remove();
  }, 5000);
}

function toggleRawTextView() {
  const rawTextSection = document.getElementById('rawTextSection');
  const toggleButton = document.getElementById('toggleRawText');

  if (rawTextSection) {
    const isVisible = rawTextSection.style.display !== 'none';
    rawTextSection.style.display = isVisible ? 'none' : 'block';
    
    if (toggleButton) {
      toggleButton.textContent = isVisible ? '👁️ Show Raw Text' : '👁️ Hide Raw Text';
    }
  }
}

function copyRawText() {
  if (!lastExtractedText) {
    alert('No extracted text to copy');
    return;
  }

  navigator.clipboard.writeText(lastExtractedText).then(() => {
    const copyButton = document.querySelector('button[onclick="copyRawText()"]');
    if (copyButton) {
      const originalText = copyButton.textContent;
      copyButton.textContent = '✅ Copied to Clipboard!';
      copyButton.style.background = '#28a745';
      
      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.background = '';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy text:', err);
    alert('Failed to copy text to clipboard');
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

window.addEventListener('load', () => {
  console.log('App loaded');
});
