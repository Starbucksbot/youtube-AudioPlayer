const audioPlayer = document.getElementById('player');
const searchInput = document.getElementById('searchInput');
const resultDiv = document.querySelector('.track-info');
const recentSongsList = document.getElementById('recent-songs');
const nextSongDiv = document.getElementById('next-song');
const replayBtn = document.querySelector('.replay-btn');

let nextTrack = null;
let currentTrack = null;

async function search() {
    const query = searchInput.value;
    if (!query) return;

    resultDiv.textContent = 'Searching...';
    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displayResults(data.results);
    } catch (error) {
        resultDiv.textContent = 'Error searching';
    }
}

function displayResults(results) {
    resultDiv.textContent = '';
    if (!results || results.length === 0) {
        resultDiv.textContent = 'No results found';
        return;
    }
    results.forEach(result => {
        const div = document.createElement('div');
        div.textContent = result.title;
        div.onclick = () => playTrack(result.url, result.title);
        resultDiv.appendChild(div);
    });
}

async function playTrack(url, title) {
    if (!url) {
        resultDiv.textContent = 'No valid URL to play';
        return;
    }
    currentTrack = { url, title };
    audioPlayer.src = `/stream?url=${encodeURIComponent(url)}`;
    audioPlayer.play();
    resultDiv.textContent = `Now Playing: ${title}`;
    replayBtn.classList.add('active');
    setTimeout(() => replayBtn.classList.remove('active'), 2000);
    replayBtn.classList.add('recently-played');
    await queueNextTrack();
}

function replayTrack() {
    if (currentTrack) {
        playTrack(currentTrack.url, currentTrack.title);
        replayBtn.classList.add('active');
        setTimeout(() => replayBtn.classList.remove('active'), 2000);
    }
}

async function queueNextTrack() {
    try {
        const recResponse = await fetch('/recommend');
        const recData = await recResponse.json();
        if (recData.url && recData.title) {
            nextTrack = { url: recData.url, title: recData.title };
            nextSongDiv.textContent = `Next: ${nextTrack.title}`;
            predownloadTrack(nextTrack.url);
        } else {
            nextSongDiv.textContent = 'No next track';
            nextTrack = null;
        }
    } catch (error) {
        nextSongDiv.textContent = 'Error getting next track';
        nextTrack = null;
    }

    audioPlayer.onended = () => {
        if (nextTrack) {
            playTrack(nextTrack.url, nextTrack.title);
        } else {
            resultDiv.textContent = 'Playback ended';
        }
    };
}

async function predownloadTrack(url) {
    try {
        const response = await fetch(`/stream?url=${encodeURIComponent(url)}`, {
            headers: { Range: 'bytes=0-163840' }
        });
        const blob = await response.blob();
        console.log('Predownloaded 10 seconds of:', url);
    } catch (error) {
        console.error('Predownload failed:', error);
    }
}

async function loadRecentSongs() {
    try {
        const response = await fetch('/recent');
        const data = await response.json();
        recentSongsList.innerHTML = '';
        data.forEach(song => {
            const li = document.createElement('li');
            li.textContent = song.title || song.query;
            li.onclick = () => playTrack(song.url, song.title || song.query);
            recentSongsList.appendChild(li);
        });
    } catch (error) {
        recentSongsList.innerHTML = '<li>Error loading recent songs</li>';
    }
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') search();
});

window.onload = loadRecentSongs;