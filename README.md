# 💊 CuraSense Diagnosis - Prescription Analysis Platform

A complete web application for analyzing prescriptions using OCR technology and machine learning. Extract text from prescription images/PDFs, validate medicines, check for drug interactions, and compare medicine brands.

## Features

### 📸 Upload Prescription
- Capture photos using phone camera or upload images
- Support for both images (PNG, JPG, etc.) and PDF documents
- Drag & drop file upload
- Automatic text extraction using Tesseract.js OCR
- Smart parsing of medicine information (name, dosage, frequency, duration)

### ✏️ Manual Entry
- Manually enter medicine details
- Validate dosages against database limits
- Check for potential drug interactions
- Add multiple medicines for comprehensive analysis

### ⚖️ Medicine Comparison
- Compare brands of the same generic medicine
- Price comparison
- Ingredient analysis
- Safety profile comparison
- Manufacturer information
- Personalized recommendations

### 🔍 Smart Analysis
- Automatic drug interaction detection
- Dosage validation against maximum daily doses
- Side effects and warnings
- Safety reports and recommendations
- Multi-medicine interaction analysis

## Tech Stack

### Backend
- **Node.js + Express.js** - API server
- **Tesseract.js** - OCR for image text extraction
- **pdf-parse** - PDF text extraction
- **CORS** - Cross-origin requests support

### Frontend
- **HTML5** - Markup with file capture API
- **CSS3** - Modern responsive design
- **Vanilla JavaScript** - No dependencies, lightweight

### Database
- In-memory mock database with 10+ common medicines and brands

## Project Structure

```
ocr-app/
├── backend/
│   ├── src/
│   │   ├── server.js                      # Express server and routes
│   │   ├── api/v1/endpoints/
│   │   │   ├── reportEndpoints.js         # Image/PDF upload routes
│   │   │   ├── medicineEndpoints.js       # Manual entry & validation
│   │   │   └── comparisonEndpoints.js     # Medicine comparison
│   │   ├── services/
│   │   │   ├── tesseractService.js        # OCR and PDF text extraction
│   │   │   └── medicineAnalysisService.js # Medicine analysis & comparison
│   │   ├── database/
│   │   │   └── medicinesDB.js             # Medicine and brand database
│   │   └── utils/
│   │       └── smartParser.js             # Medicine text parsing logic
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html                     # Main UI
│   └── src/
│       ├── app.js                         # Frontend logic
│       └── styles.css                     # UI styling
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js v14+ installed
- npm package manager

### Backend Setup

1. Navigate to backend directory:
```powershell
cd d:\ocr-project\ocr-app\backend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the backend server:
```powershell
npm start
```

The backend will start on `http://localhost:3000`

### Frontend Setup

The frontend is a static HTML/JS application. You can serve it in two ways:

**Option 1: Quick Test (Direct File Open)**
- Open `d:\ocr-project\ocr-app\frontend\public\index.html` directly in your browser

**Option 2: Local Server (Recommended)**
```powershell
npx http-server d:\ocr-project\ocr-app\frontend\public -p 8080
```
Then open `http://localhost:8080` in your browser

## API Endpoints

### Report Analysis

#### POST `/api/v1/report/upload-image`
Upload prescription image for OCR and analysis
- **Content-Type**: multipart/form-data
- **Parameter**: `prescription` (image file)
- **Returns**: Extracted text, parsed medicines, safety report

```powershell
$form = @{
  prescription = Get-Item -Path "prescription.jpg"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/report/upload-image" -Method Post -Form $form
```

#### POST `/api/v1/report/upload-pdf`
Upload prescription PDF for text extraction and analysis
- **Content-Type**: multipart/form-data
- **Parameter**: `prescription` (PDF file)
- **Returns**: Extracted text, parsed medicines, safety report

### Medicines

#### POST `/api/v1/medicines/manual-entry`
Manually enter medicine details
- **Content-Type**: application/json
- **Body**:
```json
{
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Thrice daily",
      "duration": "5 days"
    }
  ]
}
```

#### POST `/api/v1/medicines/validate`
Validate medicine dosages and check interactions
- **Body**: Same as manual-entry
- **Returns**: Validation results with interactions and warnings

#### GET `/api/v1/medicines/info/:medicineName`
Get detailed information about a medicine
- **Example**: `/api/v1/medicines/info/Paracetamol`
- **Returns**: All brands, ingredients, side effects, interactions, pricing

#### GET `/api/v1/medicines/brands/:genericName`
Get all available brands for a generic medicine
- **Example**: `/api/v1/medicines/brands/Paracetamol`
- **Returns**: List of brands with details and pricing

#### POST `/api/v1/medicines/search`
Search for medicines
- **Body**: `{ "query": "Paracetamol" }`
- **Returns**: Search results with matching medicines and brands

### Comparison

#### POST `/api/v1/medicines/compare`
Compare two brands of the same medicine
- **Body**:
```json
{
  "genericName": "Paracetamol",
  "brand1": "Calpol",
  "brand2": "Tylenol",
  "dosage1": "500mg",
  "dosage2": "500mg"
}
```
- **Returns**: Side-by-side comparison with recommendation

#### POST `/api/v1/medicines/multi-compare`
Compare multiple medicines for interactions
- **Body**:
```json
{
  "medicines": [
    { "name": "Paracetamol", "dosage": "500mg" },
    { "name": "Ibuprofen", "dosage": "400mg" }
  ]
}
```
- **Returns**: Comprehensive interaction analysis

## Supported Medicines

### Database Includes:
1. **Paracetamol** - Calpol, Tylenol, Dolo
2. **Ibuprofen** - Brufen, Combiflam
3. **Amoxicillin** - Amoxil, Amoxycare

Each medicine includes:
- Multiple brands and formulations
- Dosage strengths and forms
- Ingredients and composition
- Side effects
- Drug interactions
- Safety profiles
- Pricing information

## Usage Workflow

### 1. Upload Prescription
1. Click "📸 Upload Image" tab
2. Drag & drop or select prescription image/PDF
3. Click "Extract Text & Analyze"
4. View extracted medicines and safety report

### 2. Manual Entry
1. Click "✏️ Enter Manually" tab
2. Fill in medicine details
3. Add more medicines if needed
4. Click "Analyze & Check Safety"
5. Review interactions and warnings

### 3. Compare Medicines
1. Click "⚖️ Compare Medicines" tab
2. Enter generic medicine name
3. Fill in brand names and dosages for both brands
4. Click "Compare & Analyze"
5. View detailed comparison and recommendation

## Response Format

### Success Response
```json
{
  "success": true,
  "extractedText": "Text from prescription...",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Thrice daily",
      "duration": "5 days",
      "found": true,
      "genericName": "Paracetamol",
      "maxDailyDose": "4000mg",
      "sideEffects": [...],
      "interactions": [...]
    }
  ],
  "report": {
    "medicines": [...],
    "interactions": [...],
    "warnings": [...],
    "recommendations": [...]
  },
  "timestamp": "2025-11-08T10:30:00Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Error Handling

The application handles various error scenarios:
- Missing file uploads
- Invalid file types
- Failed OCR processing
- Invalid medicine data
- Missing required fields
- Unsupported medicines (gracefully handled)

## Performance Notes

### First OCR Request
- The first OCR request may take 30-60 seconds as Tesseract.js downloads WASM files and language data
- Subsequent requests will be faster (cached)
- PDF processing may take slightly longer depending on file size

### Optimization Tips
- Use clear, well-lit prescription images for better OCR accuracy
- Pre-crop images to focus on text area
- For production, consider server-side language data caching

## Production Considerations

### Security
- Add authentication and authorization
- Validate and sanitize file uploads
- Implement rate limiting
- Use HTTPS in production
- Add input validation on all endpoints

### Scaling
- Replace in-memory database with proper database (MongoDB, PostgreSQL)
- Implement caching (Redis) for medicine database queries
- Use CDN for static frontend assets
- Consider microservices architecture for heavy OCR loads

### Accuracy
- Integrate cloud OCR services (Google Cloud Vision, Azure Computer Vision) for higher accuracy
- Implement user feedback mechanism to improve parsing
- Add manual review workflow for critical prescriptions

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure the backend is running on `http://localhost:3000`

### OCR Accuracy
- Use high-resolution images
- Ensure good lighting
- Pre-process images (crop, rotate) for best results
- Verify extracted text before submitting

### Medicine Not Found
- Check spelling of medicine name
- Some medicines may not be in the demo database
- Consider adding to database or using cloud-based medicine database

## Future Enhancements

- [ ] User authentication and prescription history
- [ ] Integration with healthcare providers
- [ ] Real-time drug price updates
- [ ] Prescription history and reminders
- [ ] Integration with pharmacy delivery services
- [ ] ML model for disease prediction
- [ ] Real-time side effects reporting
- [ ] Medication adherence tracking
- [ ] Integration with medical records
- [ ] Multi-language support

## Contributing

Feel free to extend this project with:
- More medicines and brands to database
- Better parsing algorithms
- Integration with real medicine databases
- Enhanced UI/UX
- Mobile app wrapper

## License

MIT License

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error messages in browser console
3. Check backend logs
4. Verify all dependencies are installed

---

**Made with ❤️ for safer medicine usage**
