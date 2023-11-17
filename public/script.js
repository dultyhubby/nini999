document.getElementById('loginBtn').addEventListener('click', () => {
    console.log('Login button clicked');
    const spotifyAuthURL = 'https://dultyhubby.github.io/nini999/public/index.html';
    window.open(spotifyAuthURL, '_blank');
});


document.getElementById('generateBtn').addEventListener('click', () => {
    // Implement logic to generate a single image from the user's top 50 album covers
});

async function fetchTopAlbums() {
    // Implement logic to fetch the user's top 50 albums from Spotify API
    // Display the album covers on the webpage
}
