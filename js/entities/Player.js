import { GAME_CONFIG } from '../config.js';

export class Player {
    constructor(x, y) {
        const config = GAME_CONFIG.player;
        this.x = x;
        this.y = y;
        this.width = config.width;
        this.height = config.height;
        this.speed = config.speed;
        this.isDashing = false;
        this.dashCooldown = config.dashCooldown;
        this.lastDashTime = 0;
        this.dashDuration = config.dashDuration;
        this.dashParticles = [];
        this.particleSpawnTimer = 0;
        this.laserCooldown = config.laserCooldown;
        this.lastLaserTime = 0;
        this.isFiringLaser = false;
        this.laserDuration = config.laserDuration;
        this.laserRange = config.laserRange;
        this.laserWidth = config.laserWidth;
        this.lastMoveDx = 1;
        this.lastMoveDy = 0;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = config.invulnerabilityDuration;
        this.lastHitTime = 0;
        this.img = null;
    }

    loadImage(img) {
        this.img = img;
    }

    update(deltaTime, moveX, moveY, canvasWidth, canvasHeight) {
        // Update position
        if (moveX !== 0 || moveY !== 0) {
            this.lastMoveDx = moveX;
            this.lastMoveDy = moveY;
            const currentSpeed = this.isDashing ? this.speed * 2.5 : this.speed;
            this.x += moveX * currentSpeed * deltaTime;
            this.y += moveY * currentSpeed * deltaTime;
        }

        // Keep player in bounds
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));

        // Update dash particles
        this.dashParticles = this.dashParticles.filter(p => p.life > 0);
        this.dashParticles.forEach(p => {
            p.life--;
            // Handle particles that might not have velocity properties
            if (typeof p.vx === 'undefined') {
                p.vx = -this.lastMoveDx * 2;
                p.vy = -this.lastMoveDy * 2;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95; // Add drag
            p.vy *= 0.95;
        });

        // Spawn new particles during dash
        if (this.isDashing) {
            this.particleSpawnTimer += deltaTime;
            if (this.particleSpawnTimer >= 0.02) { // Spawn every 20ms during dash
                this.particleSpawnTimer = 0;
                const spread = 10;
                const offsetX = (Math.random() - 0.5) * spread;
                const offsetY = (Math.random() - 0.5) * spread;
                this.dashParticles.push({
                    x: this.x + this.width / 2 + offsetX,
                    y: this.y + this.height / 2 + offsetY,
                    vx: -this.lastMoveDx * 2 + (Math.random() - 0.5) * 2,
                    vy: -this.lastMoveDy * 2 + (Math.random() - 0.5) * 2,
                    life: 30 + Math.random() * 20
                });
            }
        }

        // Check invulnerability
        if (this.isInvulnerable && Date.now() - this.lastHitTime > this.invulnerabilityDuration) {
            this.isInvulnerable = false;
        }
    }

    startDash() {
        const now = Date.now();
        if (!this.isDashing && now - this.lastDashTime > this.dashCooldown) {
            this.isDashing = true;
            this.lastDashTime = now;
            this.particleSpawnTimer = 0;
            
            // Create initial burst of particles in the direction of movement
            const burstCount = 8;
            for (let i = 0; i < burstCount; i++) {
                const angle = (i / burstCount) * Math.PI * 2;
                const speed = 2 + Math.random() * 2;
                const baseVx = this.lastMoveDx !== 0 ? -this.lastMoveDx * 3 : Math.cos(angle) * speed;
                const baseVy = this.lastMoveDy !== 0 ? -this.lastMoveDy * 3 : Math.sin(angle) * speed;
                
                this.dashParticles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: baseVx + (Math.random() - 0.5) * 2,
                    vy: baseVy + (Math.random() - 0.5) * 2,
                    life: 40 + Math.random() * 20
                });
            }
            
            setTimeout(() => {
                this.isDashing = false;
            }, this.dashDuration);
            return true;
        }
        return false;
    }

    fireLaser() {
        const now = Date.now();
        if (!this.isFiringLaser && now - this.lastLaserTime > this.laserCooldown) {
            this.isFiringLaser = true;
            this.lastLaserTime = now;
            setTimeout(() => {
                this.isFiringLaser = false;
            }, this.laserDuration);
            return true;
        }
        return false;
    }

    makeInvulnerable() {
        this.isInvulnerable = true;
        this.lastHitTime = Date.now();
        setTimeout(() => {
            this.isInvulnerable = false;
        }, this.invulnerabilityDuration);
    }

    draw(ctx) {
        if (this.img) {
            if (this.isInvulnerable) {
                ctx.save();
                ctx.globalAlpha = (Math.floor(Date.now() / 100) % 2 === 0) ? 1.0 : 0.5;
            }
            
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

            if (this.isInvulnerable) {
                ctx.restore();
            }
        }

        // Draw dash particles with glow effect
        ctx.save();
        this.dashParticles.forEach(p => {
            const lifeRatio = p.life / 40;
            const alpha = lifeRatio * 0.7;
            const size = Math.max(0, this.width * 0.3 * lifeRatio);
            
            // Draw glow
            ctx.beginPath();
            ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
            ctx.shadowBlur = 15;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
            ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw core
            ctx.beginPath();
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.arc(p.x, p.y, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Draw laser beam
        if (this.isFiringLaser) {
            const laserDx = this.lastMoveDx;
            const laserDy = this.lastMoveDy;
            const eyeOffsetX = this.width * 0.22;
            const eyeOffsetY = -this.height * 0.05;
            const laserStartX = this.x + this.width / 2 + eyeOffsetX * (laserDx > 0 ? 1 : (laserDx < 0 ? -1 : 1));
            const laserStartY = this.y + this.height / 2 + eyeOffsetY;
            const laserEndX = laserStartX + laserDx * this.laserRange;
            const laserEndY = laserStartY + laserDy * this.laserRange;

            // Draw laser beam with glow effect
            ctx.beginPath();
            ctx.moveTo(laserStartX, laserStartY);
            ctx.lineTo(laserEndX, laserEndY);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = this.laserWidth;
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.stroke();

            // Draw laser core
            ctx.beginPath();
            ctx.moveTo(laserStartX, laserStartY);
            ctx.lineTo(laserEndX, laserEndY);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = this.laserWidth * 0.4;
            ctx.shadowBlur = 0;
            ctx.stroke();
            ctx.shadowColor = 'transparent';
        }
    }
}