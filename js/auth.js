// auth.js - User authentication and management functions
// Part of AP Statistics Consensus Quiz
// Dependencies: Must be loaded after data_manager.js (for initClassData, initializeProgressTracking)
// This module handles "who is the user" - username generation, prompting, and session management

// ========================================
// USERNAME GENERATION
// ========================================

// Arrays for generating random usernames
const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pear', 'Plum', 'Berry', 'Melon', 'Kiwi', 'Lime', 'Papaya', 'Guava', 'Apricot', 'Date', 'Fig', 'Coconut'];
const animals = ['Bear', 'Cat', 'Dog', 'Eagle', 'Fox', 'Goat', 'Horse', 'Iguana', 'Jaguar', 'Koala', 'Lion', 'Monkey', 'Newt', 'Owl', 'Panda', 'Quail', 'Rabbit', 'Snake', 'Tiger', 'Wolf'];

/**
 * Generates a random username in the format "Fruit_Animal"
 * @returns {string} Random username
 */
function generateRandomUsername() {
    const fruit = fruits[Math.floor(Math.random() * fruits.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${fruit}_${animal}`;
}

// ========================================
// USERNAME PROMPTING & SESSION MANAGEMENT
// ========================================

/**
 * Main entry point for username workflow
 * Checks for saved username or shows prompt
 */
function promptUsername() {
    const savedUsername = localStorage.getItem('consensusUsername');
    if (savedUsername) {
        currentUsername = savedUsername;
        initClassData();
        initializeProgressTracking(); // Initialize progress tracking for returning user
        showUsernameWelcome();
        initializeFromEmbeddedData(); // Initialize from embedded data
        updateCurrentUsernameDisplay();
    } else {
        showUsernamePrompt();
    }
}

/**
 * Displays the username selection UI
 * Shows options for new users (generate) and returning users (restore)
 */
function showUsernamePrompt() {
    const suggestedName = generateRandomUsername();
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = `
        <div class="username-prompt-enhanced">
            <div class="welcome-header">
                <h1>📊 AP Statistics Consensus Quiz</h1>
                <p class="subtitle">Collaborative Learning Platform</p>
            </div>

            <!-- Returning User Section -->
            <div class="user-section returning-user">
                <h2>🔄 Returning Student?</h2>
                <p>Restore your data from a master database file:</p>

                <div class="recovery-options">
                    <!-- CSV Import - renamed to Restore -->
                    <div class="recovery-option">
                        <div class="option-icon">🔄</div>
                        <h3>Restore</h3>
                        <p class="option-description">Import master data using CSV student roster</p>
                        <button onclick="showRestoreOptionsModal()"
                                class="action-button primary">
                            Restore Data
                        </button>
                    </div>
                </div>

                <!-- Recently Used Usernames (if any in localStorage) -->
                <div id="recentUsernames" style="display: none;">
                    <h3>📝 Recently Used on This Device:</h3>
                    <div id="recentUsernamesList"></div>
                </div>
            </div>

            <!-- New User Section -->
            <div class="user-section new-user">
                <h2>🆕 New Student?</h2>
                <p>Generate a unique username to get started:</p>

                <div class="name-generator">
                    <div class="generated-name-display">
                        <span class="name-label">Your Username:</span>
                        <span class="generated-name" id="generatedName">${suggestedName}</span>
                    </div>

                    <div class="generator-buttons">
                        <button onclick="acceptUsername('${suggestedName}')" class="action-button primary large">
                            <span class="button-icon">✅</span>
                            Accept & Start
                        </button>
                        <button onclick="rerollUsername()" class="action-button secondary">
                            <span class="button-icon">🎲</span>
                            Generate New
                        </button>
                    </div>

                    <div class="name-explanation">
                        <small>💡 Tip: Write down your username or export it for future use!</small>
                    </div>
                </div>
            </div>

        </div>
    `;

    // Check for recently used usernames
    loadRecentUsernames();
}

/**
 * Generates a new random username and updates the display
 * Exposed to window for onclick handlers
 */
window.rerollUsername = function() {
    const newName = generateRandomUsername();
    const generatedNameElement = document.getElementById('generatedName');
    if (generatedNameElement) {
        generatedNameElement.textContent = newName;
        // Update the accept button to use the new name
        const acceptButton = generatedNameElement.closest('.name-generator').querySelector('.action-button.primary.large');
        if (acceptButton) {
            acceptButton.onclick = () => acceptUsername(newName);
        }
    } else {
        // Fallback to full refresh if element not found
        showUsernamePrompt();
    }
}

/**
 * Accepts a username and initializes user session
 * Exposed to window for onclick handlers
 * @param {string} name - The username to accept
 */
window.acceptUsername = function(name) {
    currentUsername = name;
    localStorage.setItem('consensusUsername', currentUsername);

    // Save to recent usernames list
    let recentUsernames = JSON.parse(localStorage.getItem('recentUsernames') || '[]');
    if (!recentUsernames.includes(name)) {
        recentUsernames.unshift(name);
        // Keep only last 5 usernames
        recentUsernames = recentUsernames.slice(0, 5);
        localStorage.setItem('recentUsernames', JSON.stringify(recentUsernames));
    }

    initClassData();
    initializeProgressTracking(); // Initialize progress tracking for new session
    showUsernameWelcome();
    initializeFromEmbeddedData();
    updateCurrentUsernameDisplay();
}

/**
 * Allows manual username input for recovery
 * Exposed to window for onclick handlers
 */
window.recoverUsername = function() {
    const input = document.getElementById('manualUsername');
    const username = input.value.trim();

    if (!username) {
        showMessage('Please enter a username', 'error');
        return;
    }

    // Validate username format (optional)
    if (!username.match(/^[A-Za-z]+_[A-Za-z]+$/)) {
        if (!confirm('This username doesn\'t match the standard format (Fruit_Animal). Use it anyway?')) {
            return;
        }
    }

    // Check if this username has existing data
    checkExistingData(username);
}

/**
 * Checks if a username has existing data in localStorage
 * @param {string} username - Username to check
 */
function checkExistingData(username) {
    const existingData = localStorage.getItem(`answers_${username}`);
    const classData = JSON.parse(localStorage.getItem('classData') || '{}');
    const hasData = existingData || (classData.users && classData.users[username]);

    if (hasData) {
        if (confirm(`Found existing data for ${username}. Would you like to continue with this username and restore your progress?`)) {
            acceptUsername(username);
            showMessage('Welcome back! Your progress has been restored.', 'success');
        }
    } else {
        if (confirm(`No existing data found for ${username}. Would you like to start fresh with this username?`)) {
            acceptUsername(username);
            showMessage('Username set! Starting fresh.', 'info');
        }
    }
}

// ========================================
// USER DISPLAY & RECENT USERNAMES
// ========================================

/**
 * Updates the UI to show current username
 * Reinitializes pig sprite with user's saved color
 */
function updateCurrentUsernameDisplay() {
    // Reinitialize pig sprite with user's saved color
    if (typeof initializePigSprite === 'function') {
        initializePigSprite();
    }
}

/**
 * Loads and displays recently used usernames from localStorage
 * Checks both answers_ keys and classData for all users on this device
 */
function loadRecentUsernames() {
    const recentUsers = [];

    // Check localStorage for any stored usernames
    for (let key in localStorage) {
        if (key.startsWith('answers_')) {
            const username = key.replace('answers_', '');
            if (username && username !== 'undefined') {
                recentUsers.push(username);
            }
        }
    }

    // Also check class data
    const classData = JSON.parse(localStorage.getItem('classData') || '{}');
    if (classData.users) {
        Object.keys(classData.users).forEach(u => {
            if (!recentUsers.includes(u)) {
                recentUsers.push(u);
            }
        });
    }

    // Display recent usernames if any found
    if (recentUsers.length > 0) {
        const container = document.getElementById('recentUsernames');
        const list = document.getElementById('recentUsernamesList');

        container.style.display = 'block';
        list.innerHTML = recentUsers.map(u => `
            <button onclick="checkExistingData('${u}')" class="recent-username-btn">
                ${u}
            </button>
        `).join('');
    }
}

/**
 * Displays a welcome message for the logged-in user
 */
function showUsernameWelcome() {
    const container = document.querySelector('.container');
    if (!container) return;
    const existingWelcome = document.querySelector('.username-welcome');
    if (existingWelcome) existingWelcome.remove();

    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'username-welcome';
    welcomeDiv.textContent = `Welcome ${currentUsername}!`;
    container.insertBefore(welcomeDiv, container.firstChild.nextSibling);
}

/**
 * Exports username to JSON file for recovery
 * Exposed to window for onclick handlers
 */
window.exportUsername = function() {
    if (!currentUsername) {
        showMessage('No username to export', 'error');
        return;
    }

    const exportData = {
        username: currentUsername,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUsername}_identity.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('Username exported successfully!', 'success');
}
