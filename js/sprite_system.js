/**
 * Unified Sprite System - Canvas-based multiplayer sprite renderer
 * Replaces the failed dual-implementation (PigSprite/PeerPig) system
 *
 * Architecture: Single Canvas overlay with unified Sprite class
 * Principles: Offline-first, zero build step, deceptively simple
 */

class Sprite {
    constructor(username, options = {}) {
        this.username = username;
        this.isPlayer = options.isPlayer || false;

        // Position (sprites positioned near bottom of screen)
        this.x = options.x || Math.random() * (window.innerWidth - 40);
        this.y = options.y || window.innerHeight - 80; // Near bottom

        // Animation state
        this.frameIndex = 0;
        this.animationState = options.animationState || 'idle';
        this.animationTimer = 0;
        this.frameDelay = 150; // ms between frames

        // Visual properties
        this.opacity = 1;
        this.scale = 1;
        this.facingRight = true;

        // Color generation (use saved color for player, hash for peers)
        this.hue = this.generateHue(username);

        // Activity tracking
        this.lastActivity = Date.now();
        this.currentQuestion = null;

        // Physics (only for local player)
        this.velocity = { x: 0, y: 0 };
        this.isJumping = false;
    }

    generateHue(username) {
        // Use saved color for current player
        if (this.isPlayer && typeof currentUsername !== 'undefined' && username === currentUsername) {
            const savedHue = localStorage.getItem('spriteColorHue');
            if (savedHue) return parseInt(savedHue);
        }

        // Generate consistent hue from username hash for peers
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 360;
    }

    update(deltaTime) {
        // Update animation timer
        this.animationTimer += deltaTime;

        // Frame advancement based on animation state
        if (this.animationTimer > this.frameDelay) {
            this.animationTimer = 0;

            switch(this.animationState) {
                case 'idle':
                    // Idle animation: frames 0-2
                    this.frameIndex = (this.frameIndex % 3);
                    if (this.frameIndex === 2) {
                        this.frameIndex = 0;
                    } else {
                        this.frameIndex++;
                    }
                    break;

                case 'walking':
                    // Walking animation: frames 3-6
                    if (this.frameIndex < 3 || this.frameIndex >= 7) {
                        this.frameIndex = 3;
                    } else {
                        this.frameIndex++;
                        if (this.frameIndex >= 7) this.frameIndex = 3;
                    }
                    break;

                case 'thinking':
                    // Thinking animation: frames 7-8
                    if (this.frameIndex < 7 || this.frameIndex > 8) {
                        this.frameIndex = 7;
                    } else {
                        this.frameIndex = this.frameIndex === 7 ? 8 : 7;
                    }
                    break;

                case 'submitted':
                    // Celebration: frame 9-10
                    if (this.frameIndex < 9 || this.frameIndex > 10) {
                        this.frameIndex = 9;
                    } else {
                        this.frameIndex = this.frameIndex === 9 ? 10 : 9;
                    }
                    // Reset to idle after celebration
                    setTimeout(() => {
                        this.animationState = 'idle';
                    }, 2000);
                    break;

                default:
                    this.frameIndex = 0;
            }
        }

        // Update physics for local player
        if (this.isPlayer) {
            this.updatePhysics(deltaTime);
        }

        // Fade out inactive sprites
        const inactivityTime = Date.now() - this.lastActivity;
        if (inactivityTime > 30000 && !this.isPlayer) { // 30 seconds
            this.opacity = Math.max(0.3, 1 - (inactivityTime - 30000) / 30000);
        } else {
            this.opacity = 1;
        }
    }

    updatePhysics(deltaTime) {
        // Only for local player
        if (!this.isPlayer) return;

        // Apply velocity
        if (this.velocity.x !== 0) {
            this.x += this.velocity.x * deltaTime / 16;
            this.x = Math.max(20, Math.min(window.innerWidth - 52, this.x));
        }

        // Gravity and jumping
        if (this.isJumping || this.y < window.innerHeight - 80) {
            this.velocity.y += 0.8; // Gravity
            this.y += this.velocity.y;

            // Ground check
            if (this.y >= window.innerHeight - 80) {
                this.y = window.innerHeight - 80;
                this.velocity.y = 0;
                this.isJumping = false;
            }
        }
    }

    draw(ctx, spriteSheet, frameAtlas) {
        if (!spriteSheet || !spriteSheet.complete) return;

        const { frameWidth, frameHeight, cols, paddingX, paddingY } = frameAtlas;

        // Calculate source position in sprite sheet, accounting for padding
        const col = this.frameIndex % cols;
        const row = Math.floor(this.frameIndex / cols);
        const sx = col * (frameWidth + paddingX);
        const sy = row * (frameHeight + paddingY);

        // Save context state
        ctx.save();

        // Apply transformations
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);

        // Flip horizontally if facing left
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Apply scale
        ctx.scale(this.scale, this.scale);

        // Apply hue rotation filter
        if (this.hue !== 0) {
            ctx.filter = `hue-rotate(${this.hue}deg)`;
        }

        // Draw sprite centered at the new origin (0,0) after translation
        ctx.drawImage(
            spriteSheet,
            sx, sy, frameWidth, frameHeight,  // Source rectangle
            -frameWidth / 2, -frameHeight,    // Destination (draw centered and above the y-position "feet")
            frameWidth, frameHeight
        );

        // Reset filter for text
        ctx.filter = 'none';

        // Draw username label
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-30, -45, 60, 14);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(this.username, 0, -35);

        // Restore context state
        ctx.restore();
    }

    setActivity(state, questionId = null) {
        this.animationState = state;
        this.currentQuestion = questionId;
        this.lastActivity = Date.now();

        // Trigger jump for submission
        if (state === 'submitted' && this.isPlayer) {
            this.jump();
        }
    }

    jump() {
        if (!this.isJumping && this.isPlayer) {
            this.isJumping = true;
            this.velocity.y = -12;
        }
    }

    moveLeft() {
        if (this.isPlayer) {
            this.velocity.x = -5;
            this.facingRight = false;
            this.animationState = 'walking';
        }
    }

    moveRight() {
        if (this.isPlayer) {
            this.velocity.x = 5;
            this.facingRight = true;
            this.animationState = 'walking';
        }
    }

    stopMoving() {
        if (this.isPlayer) {
            this.velocity.x = 0;
            if (this.animationState === 'walking') {
                this.animationState = 'idle';
            }
        }
    }
}

class SpriteManager {
    constructor(options = {}) {
        this.options = options;
        this.canvas = null;
        this.ctx = null;
        this.sprites = new Map();
        this.spriteSheet = null;
        this.isSpriteSheetLoaded = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.enabled = true;

        // Frame atlas for sprite sheet (920x196, 11x2 grid, 80x96 frames, 4px padding)
        this.frameAtlas = {
            frameWidth: 80,
            frameHeight: 96,
            cols: 11,
            rows: 2,
            paddingX: 4,
            paddingY: 4
        };

        // Initialize
        this.init();
    }

    init() {
        // Create canvas
        this.createCanvas();

        // Load sprite sheet
        this.loadSpriteSheet();

        // Bind keyboard controls for local player
        this.bindKeyboardControls();

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    createCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'sprite-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Don't block clicks
        this.canvas.style.zIndex = '150'; // Above main UI, below modals

        // Get context FIRST
        this.ctx = this.canvas.getContext('2d');

        // Set canvas dimensions and scale context AFTER getting context
        this.setCanvasDimensions();

        // Configure context
        this.ctx.imageSmoothingEnabled = false; // Pixel art style

        // Append to body
        document.body.appendChild(this.canvas);
    }

    setCanvasDimensions() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Set actual dimensions
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        // Set CSS dimensions
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        // Scale context for DPR
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
    }

    handleResize() {
        this.setCanvasDimensions();

        // Update sprite positions to stay relative
        this.sprites.forEach(sprite => {
            if (!sprite.isPlayer) {
                sprite.y = window.innerHeight - 80;
            }
        });
    }

    loadSpriteSheet() {
        this.spriteSheet = new Image();

        // Use the global SPRITE_BASE64 constant from index.html
        this.spriteSheet.src = this.options.spriteSheetSrc || (typeof SPRITE_BASE64 !== 'undefined' ? SPRITE_BASE64 : '');

        this.spriteSheet.onload = () => {
            console.log('Sprite Sheet Natural Dimensions:', this.spriteSheet.naturalWidth, 'x', this.spriteSheet.naturalHeight);
            console.assert(this.spriteSheet.naturalWidth === 920 && this.spriteSheet.naturalHeight === 196, "Sprite sheet dimensions are incorrect! Expected 920x196.");
            this.isSpriteSheetLoaded = true;
            console.log('Sprite sheet loaded successfully');

            // Start render loop
            this.start();
        };

        this.spriteSheet.onerror = (e) => {
            console.error('Failed to load sprite sheet:', e);
            this.isSpriteSheetLoaded = false;
        };
    }

    bindKeyboardControls() {
        // Keyboard controls for local player sprite
        document.addEventListener('keydown', (e) => {
            // Check if user is typing
            const activeElement = document.activeElement;
            const isTyping = activeElement && (
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'INPUT' ||
                activeElement.contentEditable === 'true'
            );

            if (isTyping) return;

            // Get local player sprite
            const localSprite = this.getLocalPlayerSprite();
            if (!localSprite) return;

            switch(e.key) {
                case 'ArrowLeft':
                    localSprite.moveLeft();
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    localSprite.moveRight();
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                case ' ':
                    localSprite.jump();
                    e.preventDefault();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            const activeElement = document.activeElement;
            const isTyping = activeElement && (
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'INPUT' ||
                activeElement.contentEditable === 'true'
            );

            if (isTyping) return;

            const localSprite = this.getLocalPlayerSprite();
            if (!localSprite) return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                localSprite.stopMoving();
            }
        });
    }

    getLocalPlayerSprite() {
        // Find the local player sprite
        for (const [username, sprite] of this.sprites) {
            if (sprite.isPlayer) return sprite;
        }
        return null;
    }

    start() {
        if (!this.enabled || !this.isSpriteSheetLoaded) return;

        // Start render loop
        this.lastFrameTime = performance.now();
        this.render();
    }

    render() {
        if (!this.enabled) return;

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Reset transform and apply DPR scaling robustly at the start of every frame
        const dpr = window.devicePixelRatio || 1;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clear canvas using CSS units, not physical pixels
        this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

        // Update and draw all sprites
        this.sprites.forEach(sprite => {
            sprite.update(deltaTime);
            sprite.draw(this.ctx, this.spriteSheet, this.frameAtlas);
        });

        // Continue render loop
        this.animationFrameId = requestAnimationFrame(() => this.render());
    }

    addOrUpdateSprite(username, activityData = {}) {
        if (!this.enabled) return;

        let sprite = this.sprites.get(username);

        if (!sprite) {
            // Create new sprite
            const isPlayer = typeof currentUsername !== 'undefined' && username === currentUsername;
            sprite = new Sprite(username, {
                isPlayer,
                animationState: activityData.state || 'idle'
            });
            this.sprites.set(username, sprite);

            console.log(`Added sprite for ${username} (${isPlayer ? 'player' : 'peer'})`);
        } else {
            // Update existing sprite
            if (activityData.state) {
                sprite.setActivity(activityData.state, activityData.questionId);
            }
        }

        return sprite;
    }

    removeSprite(username) {
        if (this.sprites.has(username)) {
            this.sprites.delete(username);
            console.log(`Removed sprite for ${username}`);
        }
    }

    removeInactiveSprites(maxInactivityMs = 60000) {
        const now = Date.now();
        const toRemove = [];

        this.sprites.forEach((sprite, username) => {
            if (!sprite.isPlayer && (now - sprite.lastActivity) > maxInactivityMs) {
                toRemove.push(username);
            }
        });

        toRemove.forEach(username => this.removeSprite(username));
    }

    updateSpriteActivity(username, state, questionId = null) {
        const sprite = this.sprites.get(username);
        if (sprite) {
            sprite.setActivity(state, questionId);
        }
    }

    toggle() {
        this.enabled = !this.enabled;

        if (this.enabled) {
            this.canvas.style.display = 'block';
            this.start();
        } else {
            this.canvas.style.display = 'none';
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }

        return this.enabled;
    }

    destroy() {
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        // Clear sprites
        this.sprites.clear();

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);

        console.log('SpriteManager destroyed');
    }
}

// Export for use in index.html
if (typeof window !== 'undefined') {
    window.SpriteManager = SpriteManager;
    window.Sprite = Sprite;
}