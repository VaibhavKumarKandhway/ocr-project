const { createWorker } = require('tesseract.js');
const pdfParse = require('pdf-parse');

let worker;
let initializing = null;

async function initWorker() {
  if (worker) return;
  if (initializing) return initializing;

  initializing = (async () => {
    worker = createWorker({
      logger: m => {}
    });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    initializing = null;
  })();

  return initializing;
}

async function recognizeImage(buffer) {
  await initWorker();
  const { data: { text } } = await worker.recognize(buffer);
  return text;
}

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    // might need better error messages here
    throw new Error(`PDF parsing failed: ${err.message}`);
  }
}

async function recognizeFile(buffer, fileType) {
  await initWorker();

  if (fileType === 'pdf' || fileType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }

  return recognizeImage(buffer);
}

async function recognizeMultiple(buffers) {
  await initWorker();
  const results = [];

  for (const buffer of buffers) {
    try {
      const { data: { text } } = await worker.recognize(buffer);
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
  recognizeMultiple,
  initWorker
};
