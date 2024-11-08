// DOM Elements
const startButton = document.getElementById('start-btn');
const stopButton = document.getElementById('stop-btn');
const voiceSelect = document.getElementById('voice-select');
const rateInput = document.getElementById('rate');
const readingIndicator = document.getElementById('reading-indicator');

let voices = [];
let isReading = false;

// Load voices into the dropdown, preferring Indian accents
function loadVoices() {
    voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';

    // Filter for Indian accents or fallback to English
    voices
        .filter(voice =>
            voice.lang.includes('en-IN') ||
            voice.lang.includes('hi-IN') ||
            voice.lang.includes('ta-IN') ||
            voice.lang.includes('bn-IN') ||
            voice.lang.includes('mr-IN') ||
            voice.lang.includes('en-US')
        )
        .forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
}

// Reload voices if they change
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Speak the provided text
function speakText(text) {
    if (!text || isReading) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voices.find(voice => voice.name === voiceSelect.value) || voices[0];
    utterance.rate = parseFloat(rateInput.value);
    
    utterance.onstart = () => {
        isReading = true;
        updateUIState(true);
    };

    utterance.onend = () => {
        isReading = false;
        updateUIState(false);
    };

    speechSynthesis.speak(utterance);
}

// Start reading the page content
function startReading() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            { target: { tabId: tabs[0].id }, func: () => document.body.innerText || document.body.textContent },
            (results) => {
                // Check if there is any text to read
                const text = results && results[0]?.result?.trim();
                if (text) {
                    speakText(text);
                } else {
                    console.warn("No readable text found on this page.");
                    updateUIState(false);
                }
            }
        );
    });
}

// Stop reading
function stopReading() {
    speechSynthesis.cancel();
    isReading = false;
    updateUIState(false);
}

// Update UI based on reading state
function updateUIState(isReading) {
    if (isReading) {
        readingIndicator.style.visibility = "visible";
        startButton.innerText = "Reading...";
        startButton.classList.remove("btn-primary");
        startButton.classList.add("btn-success");
    } else {
        readingIndicator.style.visibility = "hidden";
        startButton.innerText = "Start Reading";
        startButton.classList.add("btn-primary");
        startButton.classList.remove("btn-success");
    }
}

// Event listeners
startButton.addEventListener('click', () => {
    if (!isReading) startReading();
});
stopButton.addEventListener('click', stopReading);
