import { GAME_CONFIG } from './config.js';
import { Player } from './entities/Player.js';
import { Rival } from './entities/Rival.js';
import { Collectible } from './entities/Collectible.js';
import { InputManager } from './systems/InputManager.js';
import { SoundManager } from './systems/SoundManager.js';
import { UIManager } from './systems/UIManager.js';
import { ParticleSystem } from './systems/ParticleSystem.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameContainer = document.getElementById('game-container');

        // Initialize managers
        this.inputManager = new InputManager(this.gameContainer);
        this.soundManager = new SoundManager();
        this.uiManager = new UIManager();
        this.particleSystem = new ParticleSystem();

        // Game state
        this.gameState = 'intro';
        this.currentLevel = 1;
        this.collectiblesCollected = 0;
        this.totalCollectibles = 0;
        this.isTargetZoneActive = false;
        this.halfwayReached = false;
        this.lastTimestamp = 0;
        this.animationFrameId = null;

        // Game objects
        this.player = null;
        this.rivals = [];
        this.collectibles = [];
        this.particles = [];
        this.targetZone = {
            x: 600,
            y: 400,
            radius: GAME_CONFIG.targetZone.radius,
            color: GAME_CONFIG.targetZone.color,
            borderColor: GAME_CONFIG.targetZone.borderColor,
            element: null
        };

        this.setupEventListeners();
    }

    async initialize() {
        // Create initial game setup without sound
        await this.setupGame(this.currentLevel - 1);
        
        // Start with intro screen and show first panel
        this.gameState = 'intro';
        window.addEventListener('resize', () => this.handleResize());

        // Initialize sound system after user interaction
        const initSound = async () => {
            await this.soundManager.initialize();
            document.removeEventListener('click', initSound);
            document.removeEventListener('keydown', initSound);
        };

        document.addEventListener('click', initSound);
        document.addEventListener('keydown', initSound);

        // Start the game loop even in intro state
        this.gameLoop(performance.now());
    }

    setupEventListeners() {
        document.addEventListener('gamestart', () => this.startGame());
        document.addEventListener('gamerestart', () => this.restartGame());
    }

    async setupGame(levelIndex) {
        const levelConf = GAME_CONFIG.levels[levelIndex];
        if (!levelConf) {
            this.gameState = 'win';
            this.uiManager.showWinScreen();
            return;
        }

        // Setup canvas dimensions
        this.canvasWidth = this.gameContainer.clientWidth;
        this.canvasHeight = this.gameContainer.clientHeight;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // Update UI
        this.uiManager.updateLevel(levelConf.level);
        document.getElementById('enemy-count').textContent = `Rivals Destroyed: 0/${levelConf.numRivals}`;

        // Initialize player with shiba image
        this.player = new Player(this.canvasWidth / 4, this.canvasHeight / 2);
        const playerImg = new Image();
        playerImg.src = 'k2.png';
        await new Promise((resolve) => {
            playerImg.onload = resolve;
        });
        this.player.loadImage(playerImg);

        // Setup target zone
        this.targetZone.x = this.canvasWidth * levelConf.targetXRatio;
        this.targetZone.y = this.canvasHeight * levelConf.targetYRatio;
        this.setupTargetZone();

        // Initialize rivals and wait for their images to load
        await this.setupRivals(levelConf);

        // Generate collectibles
        this.collectibles = Collectible.generateCollectibles(
            levelConf,
            this.canvasWidth,
            this.canvasHeight,
            this.player,
            this.rivals,
            this.targetZone
        );
        this.totalCollectibles = this.collectibles.length;
        this.collectiblesCollected = 0;

        // Reset state
        this.isTargetZoneActive = false;
        this.halfwayReached = false;
        this.updateObjectiveText();
    }

    setupTargetZone() {
        if (!this.targetZone.element) {
            this.targetZone.element = document.createElement('div');
            this.targetZone.element.className = 'target-zone';
            this.gameContainer.appendChild(this.targetZone.element);
        }
        this.targetZone.element.style.left = `${this.targetZone.x - this.targetZone.radius}px`;
        this.targetZone.element.style.top = `${this.targetZone.y - this.targetZone.radius}px`;
        this.targetZone.element.style.width = `${this.targetZone.radius * 2}px`;
        this.targetZone.element.style.height = `${this.targetZone.radius * 2}px`;
        this.targetZone.element.classList.remove('active');
    }

    async setupRivals(levelConf) {
        this.rivals = [];
        const rivalImages = ['doge.png', 'pepe.png', 'shaggy.png', 'shiba.png'];
        
        const loadPromises = [];
        
        for (let i = 0; i < levelConf.numRivals; i++) {
            const startX = this.canvasWidth * (0.5 + Math.random() * 0.3);
            const startY = this.canvasHeight * (0.15 + Math.random() * 0.7);
            const rival = new Rival(startX, startY, levelConf);
            
            // Load random rival image
            const img = new Image();
            const loadPromise = new Promise((resolve) => {
                img.onload = resolve;
            });
            img.src = rivalImages[Math.floor(Math.random() * rivalImages.length)];
            loadPromises.push(loadPromise);
            rival.loadImage(img);
            
            // Add hazard element to game container
            if (rival.hazardElement) {
                this.gameContainer.appendChild(rival.hazardElement);
            }
            
            this.rivals.push(rival);
        }
        
        // Wait for all images to load
        await Promise.all(loadPromises);
    }

    startGame() {
        this.gameState = 'playing';
        this.currentLevel = 1;
        this.uiManager.updateKCCStatus(true);
        this.resetGameState(this.currentLevel - 1);
        this.setupGame(this.currentLevel - 1).then(() => {
            this.uiManager.showMobileTutorial();
            this.gameLoop(performance.now());
        });
    }

    restartGame() {
        this.gameState = 'playing';
        this.currentLevel = 1;
        this.uiManager.updateKCCStatus(true);
        this.resetGameState(this.currentLevel - 1);
        this.setupGame(this.currentLevel - 1).then(() => {
            this.uiManager.showMobileTutorial();
            this.gameLoop(performance.now());
        });
    }

    resetGameState(levelIndex) {
        const levelConf = GAME_CONFIG.levels[levelIndex];
        if (!levelConf) return;

        // Reset player state
        if (this.player) {
            Object.assign(this.player, {
                isDashing: false,
                lastDashTime: 0,
                dashParticles: [],
                isFiringLaser: false,
                lastLaserTime: 0,
                isInvulnerable: false,
                lastHitTime: 0
            });
        }

        // Reset rival states
        this.rivals.forEach(rival => rival.destroy());
        this.rivals = [];

        // Reset collectibles and particles
        this.collectibles = [];
        this.particles = [];
        this.collectiblesCollected = 0;
        this.isTargetZoneActive = false;
        this.halfwayReached = false;

        // Reset UI
        this.uiManager.updateApprovalMeter(10);
        if (this.targetZone.element) {
            this.targetZone.element.classList.remove('active');
        }
    }

    handleResize() {
        if (this.gameState === 'playing' || this.gameState === 'level_transition') {
            this.setupGame(this.currentLevel - 1);
        }
    }

    updateObjectiveText() {
        const levelConf = GAME_CONFIG.levels[this.currentLevel - 1];
        if (this.isTargetZoneActive) {
            this.uiManager.updateObjective(levelConf.objectiveText);
        } else {
            this.uiManager.updateObjective(`Collect Data! (${this.collectiblesCollected}/${this.totalCollectibles})`);
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        // Get input
        const movement = this.inputManager.getMovementVector();
        
        // Update player
        this.player.update(deltaTime, movement.x, movement.y, this.canvasWidth, this.canvasHeight);

        // Handle dash input
        if (this.inputManager.isSpacePressed() && this.player.startDash()) {
            this.triggerFeedback('dash');
        }

        // Handle laser input
        if (this.inputManager.isLaserKeyPressed() && this.player.fireLaser()) {
            this.soundManager.playSound('laserFire');
            this.checkLaserHits();
        }

        // Update rivals
        this.rivals.forEach(rival => {
            rival.update(deltaTime, this.canvasWidth, this.canvasHeight, this.player);
            
            // Check hazard collisions
            if (rival.checkHazardCollision(this.player)) {
                this.applyDamage('hazard_hit');
            }

            // Check direct rival collision
            if (!rival.isDestroyed && this.checkRivalCollision(rival, this.player)) {
                this.applyDamage('rival_collision');
            }

            // Check dodge feedback
            if (rival.checkDodge(this.player)) {
                this.triggerFeedback('dodge');
                rival.dodgeFeedbackGiven = true;
            }
        });

        // Check collectibles
        this.collectibles.forEach(collectible => {
            if (collectible.checkCollision(this.player)) {
                this.collectiblesCollected++;
                this.triggerFeedback('collect');
                this.updateObjectiveText();
            }
        });

        // Update particle system
        this.particleSystem.update(deltaTime);

        // Check halfway point
        if (!this.halfwayReached && this.player.x > this.canvasWidth / 2) {
            this.halfwayReached = true;
            this.triggerFeedback('halfway');
        }

        // Check win condition
        this.checkWinCondition();
    }

    checkRivalCollision(rival, player) {
        return !player.isInvulnerable &&
            player.x < rival.x + rival.width &&
            player.x + player.width > rival.x &&
            player.y < rival.y + rival.height &&
            player.y + player.height > rival.y;
    }

    checkLaserHits() {
        const laserDx = this.player.lastMoveDx;
        const laserDy = this.player.lastMoveDy;
        const laserStartX = this.player.x + this.player.width / 2;
        const laserStartY = this.player.y + this.player.height / 2;
        const laserEndX = laserStartX + laserDx * this.player.laserRange;
        const laserEndY = laserStartY + laserDy * this.player.laserRange;

        for (const rival of this.rivals) {
            if (!rival.isDestroyed) {
                const rivalCenterX = rival.x + rival.width / 2;
                const rivalCenterY = rival.y + rival.height / 2;
                
                // Calculate distance from rival to laser line
                const sx = rivalCenterX - laserStartX;
                const sy = rivalCenterY - laserStartY;
                const segDx = laserEndX - laserStartX;
                const segDy = laserEndY - laserStartY;
                const segLenSq = segDx * segDx + segDy * segDy;
                
                if (segLenSq > 0) {
                    let t = (sx * segDx + sy * segDy) / segLenSq;
                    t = Math.max(0, Math.min(1, t));
                    
                    const closestX = laserStartX + t * segDx;
                    const closestY = laserStartY + t * segDy;
                    const distSq = Math.pow(rivalCenterX - closestX, 2) + Math.pow(rivalCenterY - closestY, 2);
                    
                    const hitThreshold = rival.width / 2 + this.player.laserWidth;
                    if (distSq < hitThreshold * hitThreshold) {
                        rival.destroy();
                        this.triggerFeedback('destroy_rival');
                        this.createDisintegrationEffect(rivalCenterX, rivalCenterY);
                        
                        // Update enemy count
                        const remainingRivals = this.rivals.filter(r => !r.isDestroyed).length;
                        const totalRivals = this.rivals.length;
                        const destroyedRivals = totalRivals - remainingRivals;
                        document.getElementById('enemy-count').textContent = `Rivals Destroyed: ${destroyedRivals}/${totalRivals}`;
                        
                        this.updateObjectiveText();
                        break;
                    }
                }
            }
        }
    }

    createDisintegrationEffect(x, y) {
        // Create golden explosion effect
        this.particleSystem.createExplosion(x, y, '#FFD700', 30);
        // Create additional orange-red particles for more dramatic effect
        this.particleSystem.createExplosion(x, y, '#FF4500', 15);
    }

    applyDamage(type) {
        if (this.player.isInvulnerable) return;
        this.player.makeInvulnerable();
        this.triggerFeedback(type);
    }

    triggerFeedback(eventType) {
        const messageData = GAME_CONFIG.feedback.find(m => m.trigger === eventType);
        if (!messageData) return;

        const currentApproval = parseInt(this.uiManager.approvalMeter.value);
        const newApproval = Math.max(0, currentApproval + messageData.approval);
        this.uiManager.updateApprovalMeter(newApproval);
        this.uiManager.addFeedbackMessage(messageData);

        if (messageData.sound) {
            this.soundManager.playSound(messageData.sound, messageData.note || null);
        }

        if (newApproval <= 0 && this.gameState !== 'gameOver') {
            this.triggerGameOver();
        }
    }

    checkWinCondition() {
        const allCollectiblesGathered = this.collectiblesCollected >= this.totalCollectibles;
        const allEnemiesDestroyed = this.rivals.every(rival => rival.isDestroyed);

        // Activate target zone when conditions are met
        if (allCollectiblesGathered && allEnemiesDestroyed && !this.isTargetZoneActive) {
            this.isTargetZoneActive = true;
            if (this.targetZone.element) {
                this.targetZone.element.classList.add('active');
            }
            this.updateObjectiveText();
        }

        // Check if player reached target zone
        if (this.isTargetZoneActive) {
            const distToTargetX = this.player.x + this.player.width / 2 - this.targetZone.x;
            const distToTargetY = this.player.y + this.player.height / 2 - this.targetZone.y;
            const distanceToTarget = Math.sqrt(distToTargetX * distToTargetX + distToTargetY * distToTargetY);

            if (distanceToTarget < this.targetZone.radius + this.player.width / 2) {
                if (this.currentLevel < GAME_CONFIG.levels.length) {
                    this.startLevelTransition();
                } else {
                    this.triggerWin();
                }
            }
        }
    }

    startLevelTransition() {
        this.gameState = 'level_transition';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.soundManager.playSound('win', 'C5');
        this.uiManager.showLevelTransition();

        setTimeout(() => {
            this.uiManager.hideLevelTransition();
            this.currentLevel++;
            this.resetGameState(this.currentLevel - 1);
            this.setupGame(this.currentLevel - 1).then(() => {
                this.gameState = 'playing';
                this.gameLoop(performance.now());
            });
        }, 2500);
    }

    triggerGameOver() {
        if (this.gameState === 'gameOver') return;
        
        this.gameState = 'gameOver';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.soundManager.playSound('gameOver');
        this.uiManager.showGameOver();
    }

    triggerWin() {
        this.gameState = 'win';
        this.triggerFeedback('win');
        this.uiManager.showWinScreen();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw background elements
        this.drawBackground();

        // Draw collectibles
        this.collectibles.forEach(collectible => collectible.draw(this.ctx));

        // Draw player
        this.player.draw(this.ctx);

        // Draw rivals
        this.rivals.forEach(rival => rival.draw(this.ctx));

        // Draw particles
        this.drawParticles();
    }

    drawBackground() {
        // Draw decorative rectangles
        this.ctx.fillStyle = 'rgba(74, 74, 138, 0.1)';
        this.ctx.fillRect(this.canvasWidth * 0.1, this.canvasHeight * 0.1, 
            this.canvasWidth * 0.2, this.canvasHeight * 0.15);
        this.ctx.fillRect(this.canvasWidth * 0.7, this.canvasHeight * 0.6, 
            this.canvasWidth * 0.15, this.canvasHeight * 0.2);

        // Draw decorative border
        this.ctx.strokeStyle = 'rgba(74, 74, 138, 0.2)';
        this.ctx.strokeRect(this.canvasWidth * 0.5, this.canvasHeight * 0.2, 
            this.canvasWidth * 0.25, this.canvasHeight * 0.3);

        // Draw grid
        this.ctx.strokeStyle = 'rgba(74, 74, 138, 0.2)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvasWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvasHeight; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    drawParticles() {
        this.particleSystem.draw(this.ctx);
    }

    gameLoop(timestamp) {
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }

        const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
        this.lastTimestamp = timestamp;

        // Calculate joystick dimensions if needed
        if (this.gameState === 'playing' && !this.inputManager.joystickDimensionsCalculated) {
            this.inputManager.calculateJoystickDimensions();
        }

        // Always draw the game state
        this.draw();
        
        // Only update game logic if playing
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(timestamp => this.gameLoop(timestamp));
    }
}