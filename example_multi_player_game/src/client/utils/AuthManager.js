export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'hybrid_party_battle_session';
    }

    async register(username, pin) {
        // For MVP, we'll store auth locally
        // In production, this would connect to Supabase
        const users = this.getStoredUsers();

        if (users[username]) {
            throw new Error('Username already exists');
        }

        const hashedPin = this.hashPin(pin);
        const user = {
            id: this.generateUserId(),
            username,
            pin: hashedPin,
            createdAt: new Date().toISOString(),
            stats: {
                gamesPlayed: 0,
                wins: 0,
                totalScore: 0
            }
        };

        users[username] = user;
        localStorage.setItem('hybrid_users', JSON.stringify(users));

        return user;
    }

    async signIn(username, pin) {
        const users = this.getStoredUsers();
        const user = users[username];

        if (!user) {
            throw new Error('User not found');
        }

        const hashedPin = this.hashPin(pin);
        if (user.pin !== hashedPin) {
            throw new Error('Invalid PIN');
        }

        this.currentUser = user;
        this.saveSession(user);

        return user;
    }

    signOut() {
        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
    }

    getStoredUsers() {
        const stored = localStorage.getItem('hybrid_users');
        return stored ? JSON.parse(stored) : {};
    }

    hashPin(pin) {
        // Simple hash for MVP - in production use proper hashing
        let hash = 0;
        for (let i = 0; i < pin.length; i++) {
            const char = pin.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveSession(user) {
        const session = {
            username: user.username,
            id: user.id,
            timestamp: Date.now()
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    getSavedSession() {
        const stored = localStorage.getItem(this.sessionKey);
        if (!stored) return null;

        const session = JSON.parse(stored);

        // Session expires after 7 days
        if (Date.now() - session.timestamp > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(this.sessionKey);
            return null;
        }

        return session;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    updateStats(stats) {
        if (!this.currentUser) return;

        const users = this.getStoredUsers();
        const user = users[this.currentUser.username];

        if (user) {
            user.stats = { ...user.stats, ...stats };
            users[this.currentUser.username] = user;
            localStorage.setItem('hybrid_users', JSON.stringify(users));
            this.currentUser = user;
        }
    }
}