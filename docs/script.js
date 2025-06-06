pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const terminalOutput = document.getElementById('terminalOutput');
function log(message) {
  if (!terminalOutput) return;
  terminalOutput.textContent += message + '\n';
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

async function extractTextFromPDF(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  let text = '';
  log(`Extracting text from PDF with ${pdf.numPages} pages...`);
  for (let page = 1; page <= pdf.numPages; page++) {
    const pageObj = await pdf.getPage(page);
    const content = await pageObj.getTextContent();
    const strings = content.items.map(it => it.str);
    text += strings.join(' ') + '\n';
    log(`Extracted page ${page}/${pdf.numPages}`);
  }
  log('Finished extracting PDF text.');
  return text;
}

let currentUtterance = null;

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('Your browser does not support speech synthesis.');
    return;
  }
  if (currentUtterance) window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  currentUtterance = utter;
  utter.onend = () => {
    document.getElementById('controls').style.display = 'none';
    currentUtterance = null;
    log('Speech finished.');
  };
  utter.onstart = () => log('Speech started.');
  utter.onpause = () => log('Speech paused.');
  utter.onresume = () => log('Speech resumed.');
  window.speechSynthesis.speak(utter);
  document.getElementById('controls').style.display = 'flex';
}

function pauseSpeech() { if (currentUtterance) speechSynthesis.pause(); }
function resumeSpeech() { if (currentUtterance) speechSynthesis.resume(); }
function stopSpeech() {
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
    document.getElementById('controls').style.display = 'none';
    log('Speech stopped.');
  }
}

document.getElementById('extractBtn').addEventListener('click', async () => {
  const file = document.getElementById('pdfFile').files[0];
  if (!file) {
    alert('Please select a PDF file.');
    return;
  }
  try {
    const text = await extractTextFromPDF(file);
    document.getElementById('textInput').value = text;
  } catch (err) {
    console.error(err);
    log('Failed to extract text from PDF.');
    alert('Failed to extract text from PDF.');
  }
});

document.getElementById('listenBtn').addEventListener('click', () => {
  const text = document.getElementById('textInput').value.trim();
  if (!text) {
    alert('Enter or extract some text first.');
    return;
  }
  log('Starting text to speech...');
  speakText(text);
});

document.getElementById('pauseBtn').addEventListener('click', pauseSpeech);
document.getElementById('resumeBtn').addEventListener('click', resumeSpeech);
document.getElementById('stopBtn').addEventListener('click', stopSpeech);

// Toggle light/dark mode
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});
