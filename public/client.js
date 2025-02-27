const audioPlayer = document.getElementById('player');
const searchInput = document.getElementById('searchInput');
const resultDiv = document.getElementById('result');

async function search() {
    const query = searchInput.value;
    if (!query) return;

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        playTrack(data.url);
    } catch (error) {
        resultDiv.textContent = 'Error searching';
    }
}

function playTrack(url) {
    audioPlayer.src = `/stream?url=${encodeURIComponent(url)}`;
    audioPlayer.play();
    resultDiv.textContent = `Playing: ${url.split('v=')[1]}`;

    audioPlayer.onended = async () => {
        try {
            const recResponse = await fetch('/recommend');
            const recData = await recResponse.json();
            if (recData.url) playTrack(recData.url);
        } catch (error) {
            resultDiv.textContent = 'Error getting recommendation';
        }
    };
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') search();
});