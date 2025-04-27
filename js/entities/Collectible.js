import { GAME_CONFIG } from '../config.js';

export class Collectible {
    constructor(x, y) {
        const config = GAME_CONFIG.collectible;
        this.x = x;
        this.y = y;
        this.radius = config.radius;
        this.width = config.width;
        this.height = config.height;
        this.collected = false;
    }

    checkCollision(player) {
        if (this.collected) return false;

        const dx = (player.x + player.width / 2) - this.x;
        const dy = (player.y + player.height / 2) - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius + player.width / 2) {
            this.collected = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (this.collected) return;

        const packetX = this.x - this.width / 2;
        const packetY = this.y - this.height / 2;

        // Draw data packet with glow effect
        ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(packetX, packetY, this.width, this.height);

        // Draw data lines
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        // Top line
        ctx.moveTo(packetX + 2, packetY + 2);
        ctx.lineTo(packetX + this.width - 2, packetY + 2);
        // Middle line
        ctx.moveTo(packetX + 2, packetY + this.height / 2);
        ctx.lineTo(packetX + this.width - 2, packetY + this.height / 2);
        // Bottom line
        ctx.moveTo(packetX + 2, packetY + this.height - 2);
        ctx.lineTo(packetX + this.width - 2, packetY + this.height - 2);
        ctx.stroke();
    }

    static generateCollectibles(level, canvasWidth, canvasHeight, player, rivals, targetZone) {
        const collectibles = [];
        const totalCollectibles = level.numCollectibles;
        const isMobile = window.innerWidth <= 768;
        
        // Define UI-safe zones where collectibles cannot spawn
        const uiSafeZones = isMobile ? [
            // Mobile layout
            { x: 0, y: 0, width: canvasWidth * 0.3, height: 50 }, // Top UI
            { x: canvasWidth * 0.7, y: 0, width: canvasWidth * 0.3, height: 100 }, // Right UI
            { x: 0, y: canvasHeight - 150, width: canvasWidth, height: 150 }, // Bottom controls
            { x: canvasWidth * 0.7, y: canvasHeight - 100, width: canvasWidth * 0.3, height: 100 } // Bottom feedback
        ] : [
            // Desktop layout
            { x: 0, y: 0, width: canvasWidth * 0.3, height: 50 }, // Top UI
            { x: canvasWidth * 0.7, y: 0, width: canvasWidth * 0.3, height: 100 }, // Right UI
            { x: canvasWidth * 0.7, y: canvasHeight - 100, width: canvasWidth * 0.3, height: 100 } // Bottom feedback
        ];

        const topMargin = 40;
        const bottomMargin = isMobile ? 150 : 50;

        for (let i = 0; i < totalCollectibles; i++) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 100) {
                attempts++;
                const potentialX = GAME_CONFIG.collectible.radius + 
                    Math.random() * (canvasWidth - GAME_CONFIG.collectible.radius * 2);
                const potentialY = topMargin + 
                    Math.random() * (canvasHeight - topMargin - bottomMargin);

                // Skip if in UI-safe zones
                let inUISafeZone = false;
                for (const zone of uiSafeZones) {
                    if (potentialX >= zone.x && 
                        potentialX <= zone.x + zone.width && 
                        potentialY >= zone.y && 
                        potentialY <= zone.y + zone.height) {
                        inUISafeZone = true;
                        break;
                    }
                }
                if (inUISafeZone) continue;

                // Skip if too close to edges
                if (potentialY < topMargin || potentialY > canvasHeight - bottomMargin) continue;

                // Check distance from player start position
                const distToPlayerStart = Math.sqrt(
                    Math.pow(potentialX - canvasWidth / 4, 2) + 
                    Math.pow(potentialY - canvasHeight / 2, 2)
                );

                // Check distance from target zone
                const distToTarget = Math.sqrt(
                    Math.pow(potentialX - targetZone.x, 2) + 
                    Math.pow(potentialY - targetZone.y, 2)
                );

                // Check distance from rival start positions
                let tooCloseToRivalStart = false;
                for (const rival of rivals) {
                    if (!rival.isDestroyed) {
                        const distToRival = Math.sqrt(
                            Math.pow(potentialX - rival.startX, 2) + 
                            Math.pow(potentialY - rival.startY, 2)
                        );
                        if (distToRival < rival.width * 2) {
                            tooCloseToRivalStart = true;
                            break;
                        }
                    }
                }

                // Place collectible if all conditions are met
                if (distToPlayerStart > player.width * 2 && 
                    distToTarget > targetZone.radius * 1.5 && 
                    !tooCloseToRivalStart) {
                    collectibles.push(new Collectible(potentialX, potentialY));
                    placed = true;
                }
            }
        }

        return collectibles;
    }
}