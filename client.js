const audioPlayer = document.getElementById('player');
const searchInput = document.getElementById('searchInput');
const resultDiv = document.querySelector('.track-info');
const recentSongsList = document.getElementById('recent-songs');
const nextSongDiv = document.getElementById('next-song');
const playBtn = document.querySelector('.play-btn');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const progress = document.querySelector('.progress');
const timeDisplay = document.querySelector('.time');
const volumeBtn = document.querySelector('.volume-btn');
const volumeSlider = document.querySelector('.volume-slider');
const sleepBtn = document.querySelector('.sleep-btn');
const sleepOptions = document.getElementById('sleep-options');
const sleepTimeSelect = document.getElementById('sleep-time');

let nextTrack = null;
let currentTrack = null;
let sleepTimer = null;
let isPlaying = false;
let isMuted = false;

audioPlayer.volume = 1; // Default volume

async function search() {
    const query = searchInput.value.trim(); // Trim to avoid empty searches
    if (!query) {
        resultDiv.textContent = 'Please enter a search term';
        return;
    }

    resultDiv.textContent = 'Searching...';
    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            displayResults(data.results);
        } else {
            resultDiv.textContent = 'No results found';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultDiv.textContent = 'Error searching. Check console for details.';
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
        div.textContent = result.title;
        div.onclick = () => playTrack(result.url, result.title);
        div.style.cursor = 'pointer';
        div.style.margin = '5px 0';
        resultDiv.appendChild(div);
    });
}

async function playTrack(url, title) {
    if (!url) {
        resultDiv.textContent = 'No valid URL to play';
        return;
    }
    if (sleepTimer) {
        clearTimeout(sleepTimer);
        setSleepTimer();
    }
    currentTrack = { url, title };
    audioPlayer.src = `/stream?url=${encodeURIComponent(url)}`;
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa fa-pause"></i>';
    try {
        await audioPlayer.play();
        resultDiv.textContent = `Now Playing: ${title}`;
        updateProgress();
    } catch (error) {
        console.error('Playback error:', error);
        resultDiv.textContent = 'Error playing track. Check console for details.';
    }
    await queueNextTrack();
}

function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fa fa-play"></i>';
    } else if (currentTrack) {
        audioPlayer.play();
        isPlaying = true;
        playBtn.innerHTML = '<i class="fa fa-pause"></i>';
    }
}

function previousTrack() {
    // Placeholder: Implement history if needed
    resultDiv.textContent = 'Previous not implemented';
}

function nextTrack() {
    if (nextTrack) {
        playTrack(nextTrack.url, nextTrack.title);
    } else {
        resultDiv.textContent = 'No next track available';
    }
}

function updateProgress() {
    const interval = setInterval(() => {
        if (audioPlayer.src && !isNaN(audioPlayer.duration)) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = `${progressPercent}%`;
            const currentTime = formatTime(audioPlayer.currentTime);
            const duration = formatTime(audioPlayer.duration);
            timeDisplay.textContent = `${currentTime} / ${duration}`;
        }
        if (audioPlayer.ended) {
            clearInterval(interval);
            if (nextTrack) nextTrack();
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function toggleVolume() {
    isMuted = !isMuted;
    audioPlayer.muted = isMuted;
    volumeBtn.innerHTML = isMuted ? '<i class="fa fa-volume-mute"></i>' : '<i class="fa fa-volume-up"></i>';
    volumeSlider.classList.toggle('active');
}

function toggleSleepOptions() {
    sleepOptions.classList.toggle('active');
}

function setSleepTimer() {
    const hours = parseInt(sleepTimeSelect.value);
    const milliseconds = hours * 60 * 60 * 1000;
    sleepOptions.classList.remove('active');
    if (sleepTimer) clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => {
        audioPlayer.pause();
        audioPlayer.src = '';
        resultDiv.textContent = 'Sleep timer ended. Restart to play.';
        nextTrack = null;
        nextSongDiv.textContent = 'No next track';
        isPlaying = false;
        playBtn.innerHTML = '<i class="fa fa-play"></i>';
    }, milliseconds);
    console.log(`Sleep timer set for ${hours} hours`);
}

async function queueNextTrack() {
    try {
        const recResponse = await fetch('/recommend');
        if (!recResponse.ok) throw new Error('Network response was not ok');
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
        console.error('Recommendation error:', error);
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
        if (!response.ok) throw new Error('Predownload failed');
        const blob = await response.blob();
        console.log('Predownloaded 10 seconds of:', url);
    } catch (error) {
        console.error('Predownload failed:', error);
    }
}

async function loadRecentSongs() {
    try {
        const response = await fetch('/recent');
        if (!response.ok) throw new Error('Network response was not ok');
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
        console.error('Recent songs error:', error);
    }
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') search();
});

document.querySelector('.search-btn').addEventListener('click', search);
sleepBtn.addEventListener('click', toggleSleepOptions);
document.querySelector('.sleep-options button').addEventListener('click', setSleepTimer);
volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});
volumeBtn.addEventListener('click', toggleVolume);

window.onload = () => {
    loadRecentSongs();
    updateProgress();
};