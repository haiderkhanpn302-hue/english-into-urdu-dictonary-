document.getElementById('search-btn').addEventListener('click', processSearch);
document.getElementById('word-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        processSearch();
    }
});

const audioBtn = document.getElementById('audio-btn');
const audioEl = document.getElementById('pronunciation-audio');

audioBtn.addEventListener('click', () => {
    if(audioEl.src && audioEl.src !== window.location.href) {
        audioEl.play();
    } else {
        alert("Audio pronunciation unavailable for this entry.");
    }
});

function processSearch() {
    const word = document.getElementById('word-input').value.trim();
    
    const welcomeView = document.getElementById('welcome-state');
    const loadingView = document.getElementById('loading-state');
    const contentView = document.getElementById('content-state');
    const errorView = document.getElementById('error-state');

    if (!word) {
        alert("Please enter a word first.");
        return;
    }

    // Toggle Screen UI States (hide original screen information completely)
    welcomeView.style.display = 'none';
    loadingView.style.display = 'flex';
    contentView.style.display = 'none';
    errorView.style.display = 'none';

    // Set endpoints
    const dictionaryApiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    const translationApiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ur&de=demo@example.com`;

    // Gather data across platforms
    Promise.all([
        fetch(dictionaryApiUrl).then(res => res.ok ? res.json() : null),
        fetch(translationApiUrl).then(res => res.ok ? res.json() : null)
    ])
    .then(([dictData, transData]) => {
        loadingView.style.display = 'none';

        // Check if data is completely missing
        if (!dictData && (!transData || !transData.responseData)) {
            showFailure(`Word "${word}" not found. Please try another word!`);
            return;
        }

        const compTag = document.getElementById('noun-composition');
        compTag.style.display = 'none'; // Hide by default unless it's a noun

        // 1. Process Grammar & Definition Details
        if (dictData && dictData[0]) {
            const primaryEntry = dictData[0];
            document.getElementById('display-word').innerText = primaryEntry.word;
            
            // Extract Part of Speech safely
            const partOfSpeech = primaryEntry.meanings[0]?.partOfSpeech || "Vocabulary";
            document.getElementById('grammar-pos').innerText = partOfSpeech;

            // Noun Grammar Composition detection
            if (partOfSpeech.toLowerCase() === 'noun') {
                // Approximate noun composition based on common linguistic rules
                const uncountableNouns = ['water', 'sand', 'milk', 'rice', 'information', 'money', 'music', 'love', 'furniture', 'advice', 'gold', 'air'];
                if (uncountableNouns.includes(word.toLowerCase())) {
                    compTag.innerText = "Uncountable Noun";
                } else {
                    compTag.innerText = "Countable Noun";
                }
                compTag.style.display = 'inline-block';
            }

            // Extract Definition safely
            const definition = primaryEntry.meanings[0]?.definitions[0]?.definition || "Definition detail missing.";
            document.getElementById('eng-definition').innerText = definition;

            // Extract Use / Example Sentence safely
            const example = primaryEntry.meanings[0]?.definitions[0]?.example;
            const usageBox = document.getElementById('usage-box');
            if (example) {
                document.getElementById('word-example').innerText = `"${example}"`;
                usageBox.style.display = 'block';
            } else {
                usageBox.style.display = 'none'; // Hide usage container if no example exists
            }

            // Find matching audio pronunciation track 
            let soundTrackUrl = "";
            if (primaryEntry.phonetics && primaryEntry.phonetics.length > 0) {
                const checkedTrack = primaryEntry.phonetics.find(p => p.audio !== "");
                if (checkedTrack) soundTrackUrl = checkedTrack.audio;
            }
            
            if(soundTrackUrl) {
                audioEl.src = soundTrackUrl;
                audioBtn.style.display = "block";
            } else {
                audioEl.src = "";
                audioBtn.style.display = "none";
            }
        } else {
            // Fallbacks if only translation comes through
            document.getElementById('display-word').innerText = word;
            document.getElementById('grammar-pos').innerText = "Word";
            document.getElementById('eng-definition').innerText = "English detailed definition structural missing.";
            document.getElementById('usage-box').style.display = 'none';
            audioBtn.style.display = "none";
        }

        // 2. Process Urdu Meaning Value
        if (transData && transData.responseData) {
            document.getElementById('urdu-meaning').innerText = transData.responseData.translatedText;
        } else {
            document.getElementById('urdu-meaning').innerText = "ترجمہ دستیاب نہیں";
        }

        // Reveal the structured results content
        contentView.style.display = 'block';
    })
    .catch(err => {
        loadingView.style.display = 'none';
        showFailure("An unexpected network error took place. Please try again.");
    });
}

function showFailure(errMessage) {
    document.getElementById('error-msg').innerText = errMessage;
    document.getElementById('error-state').style.display = 'flex';
}