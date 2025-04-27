export class InputManager {
    constructor(gameContainer) {
        this.keys = {};
        this.joystickActive = false;
        this.joystickDx = 0;
        this.joystickDy = 0;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickRadius = 0;
        this.knobRadius = 0;
        this.maxJoystickDist = 0;
        this.joystickDimensionsCalculated = false;

        this.gameContainer = gameContainer;
        this.joystickArea = document.getElementById('joystick-area');
        this.joystickKnob = document.getElementById('joystick-knob');
        this.laserButton = document.getElementById('laser-button');

        this.setupKeyboardControls();
        this.setupTouchControls();
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "e"].includes(key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    setupTouchControls() {
        // Joystick touch handlers
        this.joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystickActive = true;
            this.joystickArea.classList.add('active');
            const touch = e.changedTouches[0];
            this.joystickStartX = touch.clientX;
            this.joystickStartY = touch.clientY;
        }, { passive: false });

        this.joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive || !this.joystickDimensionsCalculated || this.maxJoystickDist <= 0) return;

            const touch = e.changedTouches[0];
            const areaRect = this.joystickArea.getBoundingClientRect();
            const areaCenterX = areaRect.left + areaRect.width / 2;
            const areaCenterY = areaRect.top + areaRect.height / 2;
            
            let dx = touch.clientX - areaCenterX;
            let dy = touch.clientY - areaCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const clampedDist = Math.min(dist, this.maxJoystickDist);
            
            const knobX = clampedDist * Math.cos(angle);
            const knobY = clampedDist * Math.sin(angle);
            this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

            const deadZone = this.maxJoystickDist * 0.15;
            if (clampedDist > deadZone) {
                const magnitude = Math.sqrt(dx * dx + dy * dy);
                this.joystickDx = dx / magnitude;
                this.joystickDy = dy / magnitude;
            } else {
                this.joystickDx = 0;
                this.joystickDy = 0;
            }
        }, { passive: false });

        this.joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;
            this.joystickActive = false;
            this.joystickArea.classList.remove('active');
            this.joystickKnob.style.transform = 'translate(-50%, -50%)';
            this.joystickDx = 0;
            this.joystickDy = 0;
        }, { passive: false });

        // Game area tap handler for dashing and targeting
        this.gameContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const target = e.target;
            
            // Ignore taps on controls
            if (target.id === 'laser-button' ||
                target.className === 'laser-button-inner' ||
                target.id === 'joystick-area' ||
                target.id === 'joystick-base' ||
                target.id === 'joystick-knob') {
                return;
            }

            const touch = e.touches[0];
            const rect = this.gameContainer.getBoundingClientRect();
            const tapX = touch.clientX - rect.left;
            const tapY = touch.clientY - rect.top;

            // Emit tap event with coordinates
            const tapEvent = new CustomEvent('gametap', {
                detail: { x: tapX, y: tapY }
            });
            this.gameContainer.dispatchEvent(tapEvent);
        }, { passive: false });
    }

    calculateJoystickDimensions() {
        if (this.joystickArea.offsetWidth > 0) {
            this.joystickRadius = this.joystickArea.offsetWidth / 2;
            this.knobRadius = this.joystickKnob.offsetWidth / 2;
            this.maxJoystickDist = this.joystickRadius - this.knobRadius;
            
            if (this.maxJoystickDist > 0) {
                this.joystickDimensionsCalculated = true;
                return true;
            }
        }
        return false;
    }

    getMovementVector() {
        // Prioritize joystick input if active
        if (this.joystickActive && (this.joystickDx !== 0 || this.joystickDy !== 0)) {
            return {
                x: this.joystickDx,
                y: this.joystickDy
            };
        }

        // Fall back to keyboard input
        let moveX = 0;
        let moveY = 0;

        if (this.keys['arrowup'] || this.keys['w']) moveY -= 1;
        if (this.keys['arrowdown'] || this.keys['s']) moveY += 1;
        if (this.keys['arrowleft'] || this.keys['a']) moveX -= 1;
        if (this.keys['arrowright'] || this.keys['d']) moveX += 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= magnitude;
            moveY /= magnitude;
        }

        return { x: moveX, y: moveY };
    }

    isSpacePressed() {
        return this.keys[' '] === true;
    }

    isLaserKeyPressed() {
        return this.keys['e'] === true;
    }
}