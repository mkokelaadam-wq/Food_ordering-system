// Food Express - Frontend JavaScript
console.log('Food Express Website');

// Simple function to display message
function showWelcome() {
    document.getElementById('message').innerHTML = 
        'Welcome to Food Express! Order online now.';
}

// Run when page loads
window.onload = showWelcome;
