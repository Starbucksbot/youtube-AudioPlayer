const audioPlayer = document.getElementById('player');
const searchInput = document.getElementById('searchInput');
const resultDiv = document.getElementById('result');
const recentSongsList = document.getElementById('recent-songs');

async function search() {
    const query = searchInput.value;
    if (!query) return;

    resultDiv.innerHTML = 'Searching...';
    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displayResults(data.results);
    } catch (error) {
        resultDiv.textContent = 'Error searching';
    }
}

function displayResults(results) {
    resultDiv.innerHTML = '';
    if (!results || results.length === 0) {
        resultDiv.textContent = 'No results found';
        return;
    }
    results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.textContent = result.title;
        div.onclick = () => playTrack(result.url);
        resultDiv.appendChild(div);
    });
}

function playTrack(url) {
    audioPlayer.src = `/stream?url=${encodeURIComponent(url)}`;
    audioPlayer.play();
    resultDiv.textContent = `Playing: ${url.split('v=')[1] || url}`;

    audioPlayer.onended = async () => {
        try {
            const recResponse = await fetch('/recommend');
            const recData = await recResponse.json();
            if (recData.url) playTrack(recData.url);
            else resultDiv.textContent = 'No recommendation available';
        } catch (error) {
            resultDiv.textContent = 'Error getting recommendation';
        }
    };
}

async function loadRecentSongs() {
    try {
        const response = await fetch('/recent');
        const data = await response.json();
        recentSongsList.innerHTML = '';
        data.forEach(song => {
            const li = document.createElement('li');
            li.textContent = song.query;
            li.onclick = () => playTrack(song.url);
            recentSongsList.appendChild(li);
        });
    } catch (error) {
        recentSongsList.innerHTML = '<li>Error loading recent songs</li>';
    }
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') search();
});

// Load recent songs on page load
window.onload = loadRecentSongs;