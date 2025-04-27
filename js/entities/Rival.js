import { GAME_CONFIG } from '../config.js';

export class Rival {
    constructor(startX, startY, level) {
        const config = GAME_CONFIG.rival;
        this.x = startX;
        this.y = startY;
        this.width = config.width;
        this.height = config.height;
        this.speed = config.baseSpeed * level.rivalSpeedMultiplier * (0.8 + Math.random() * 0.4);
        this.direction = Math.random() < 0.5 ? 1 : -1;
        this.patrolRange = 70 + Math.random() * 60;
        this.startX = startX;
        this.startY = startY;
        this.img = null;
        this.hazardActive = false;
        this.isInWarning = false;
        this.lastHazardTime = Date.now() - Math.random() * level.rivalHazardCooldownBase + 2000;
        this.hazardElement = this.createHazardElement();
        this.hazardFeedbackGiven = false;
        this.dodgeFeedbackGiven = false;
        this.isDestroyed = false;
        this.hazardCooldown = level.rivalHazardCooldownBase;
        this.hazardTimer = level.rivalHazardCooldownBase + Math.random() * 1500 + 2000;
        this.hazardTargetX = 0;
        this.hazardTargetY = 0;
    }

    createHazardElement() {
        const element = document.createElement('div');
        element.className = 'dogen-hazard';
        element.style.width = `${GAME_CONFIG.rival.hazardRadius * 2}px`;
        element.style.height = `${GAME_CONFIG.rival.hazardRadius * 2}px`;
        return element;
    }

    loadImage(img) {
        this.img = img;
    }

    update(deltaTime, canvasWidth, canvasHeight, player) {
        if (this.isDestroyed) {
            if (this.hazardElement && this.hazardElement.style.opacity !== '0') {
                this.hazardElement.style.opacity = '0';
                this.hazardElement.classList.remove('active', 'warning');
            }
            return;
        }

        // Movement
        const rivalSpeedThisFrame = this.speed * deltaTime;
        const intendedX = this.x + (rivalSpeedThisFrame * this.direction);
        
        // Calculate patrol boundaries
        const patrolLeftBound = Math.max(0, this.startX - this.patrolRange);
        const patrolRightBound = Math.min(canvasWidth - this.width, this.startX + this.patrolRange);
        
        // Check if we need to reverse direction
        if ((this.direction === 1 && intendedX >= patrolRightBound) ||
            (this.direction === -1 && intendedX <= patrolLeftBound)) {
            this.direction *= -1;
        }
        
        // Update position with bounds checking
        this.x = Math.max(patrolLeftBound, Math.min(patrolRightBound, intendedX));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));

        // Hazard Logic
        const now = Date.now();
        if (!this.isInWarning && !this.hazardActive && now - this.lastHazardTime > this.hazardTimer) {
            this.startHazardWarning(player);
        }
    }

    startHazardWarning(player) {
        this.isInWarning = true;
        this.lastHazardTime = Date.now();
        
        // Calculate hazard target position
        const predictDistance = 50;
        const randomOffsetRange = 40;
        const targetBaseX = player.x + player.width / 2 + player.lastMoveDx * predictDistance;
        const targetBaseY = player.y + player.height / 2 + player.lastMoveDy * predictDistance;
        
        this.hazardTargetX = targetBaseX + (Math.random() - 0.5) * randomOffsetRange;
        this.hazardTargetY = targetBaseY + (Math.random() - 0.5) * randomOffsetRange;
        
        // Ensure hazard stays within canvas bounds
        this.hazardTargetX = Math.max(GAME_CONFIG.rival.hazardRadius, 
            Math.min(window.innerWidth - GAME_CONFIG.rival.hazardRadius, this.hazardTargetX));
        this.hazardTargetY = Math.max(GAME_CONFIG.rival.hazardRadius, 
            Math.min(window.innerHeight - GAME_CONFIG.rival.hazardRadius, this.hazardTargetY));

        // Update hazard element position and appearance
        if (this.hazardElement) {
            this.hazardElement.style.left = `${this.hazardTargetX - GAME_CONFIG.rival.hazardRadius}px`;
            this.hazardElement.style.top = `${this.hazardTargetY - GAME_CONFIG.rival.hazardRadius}px`;
            this.hazardElement.classList.add('warning');
            this.hazardElement.style.opacity = '0.8';
        }

        // Set timeout for hazard activation
        setTimeout(() => {
            if (!this.isInWarning) return;
            this.activateHazard();
        }, GAME_CONFIG.rival.hazardWarningDuration);
    }

    activateHazard() {
        this.isInWarning = false;
        this.hazardActive = true;
        this.hazardFeedbackGiven = false;
        this.dodgeFeedbackGiven = false;

        if (this.hazardElement) {
            this.hazardElement.classList.remove('warning');
            this.hazardElement.classList.add('active');
        }

        setTimeout(() => {
            if (!this.hazardActive) return;
            this.deactivateHazard();
        }, GAME_CONFIG.rival.hazardActiveDuration);
    }

    deactivateHazard() {
        this.hazardActive = false;
        this.lastHazardTime = Date.now();
        this.hazardTimer = this.hazardCooldown + Math.random() * 1500;

        if (this.hazardElement) {
            this.hazardElement.classList.remove('active');
            this.hazardElement.style.opacity = '0';
        }
    }

    checkHazardCollision(player) {
        if (this.hazardActive && !player.isInvulnerable) {
            const dx = (player.x + player.width / 2) - this.hazardTargetX;
            const dy = (player.y + player.height / 2) - this.hazardTargetY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < GAME_CONFIG.rival.hazardRadius + player.width / 2;
        }
        return false;
    }

    checkDodge(player) {
        if (player.isDashing && this.hazardActive && !this.dodgeFeedbackGiven) {
            const dx = (player.x + player.width / 2) - this.hazardTargetX;
            const dy = (player.y + player.height / 2) - this.hazardTargetY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dodgeRange = GAME_CONFIG.rival.hazardRadius + player.width * 1.5;
            return distance < dodgeRange && distance > GAME_CONFIG.rival.hazardRadius - player.width;
        }
        return false;
    }

    draw(ctx) {
        if (!this.isDestroyed && this.img) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }

    destroy() {
        this.isDestroyed = true;
        if (this.hazardElement && this.hazardElement.parentNode) {
            this.hazardElement.parentNode.removeChild(this.hazardElement);
        }
    }
}