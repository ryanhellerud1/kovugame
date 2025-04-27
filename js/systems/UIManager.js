export class UIManager {
    constructor() {
        // Get UI elements
        this.introOverlay = document.getElementById('intro-overlay');
        this.winMessage = document.getElementById('win-message');
        this.levelTransitionOverlay = document.getElementById('level-transition-overlay');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.kccStatusElement = document.getElementById('kcc-status');
        this.objectiveDisplay = document.getElementById('objective-display');
        this.approvalMeter = document.getElementById('approval-meter');
        this.feedbackArea = document.getElementById('feedback-area');
        this.levelIndicator = document.getElementById('level-indicator');
        this.mobileTutorial = document.getElementById('mobile-tutorial');

        // Ensure intro overlay is visible and show first panel
        this.introOverlay.style.display = 'block';
        // Force reflow
        this.introOverlay.offsetHeight;
        requestAnimationFrame(() => {
            this.introOverlay.style.opacity = '1';
            this.showIntroPanel(1);
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Setup intro panel handlers
        const introButtons = document.querySelectorAll('#intro-overlay button');
        introButtons.forEach(button => {
            this.setupButtonHandler(button, (nextAction) => {
                if (nextAction === 'start') {
                    this.hideIntroShowTutorial();
                } else {
                    this.showIntroPanel(parseInt(nextAction));
                }
            });
        });

        // Setup tutorial panel handlers
        const tutorialButtons = document.querySelectorAll('#tutorial-overlay button');
        tutorialButtons.forEach(button => {
            this.setupButtonHandler(button, (nextAction) => {
                if (nextAction === 'start') {
                    this.hideTutorial();
                } else {
                    this.showTutorialPanel(parseInt(nextAction));
                }
            });
        });

        // Setup restart and play again buttons
        const restartButton = document.getElementById('restart-button');
        const playAgainButton = document.getElementById('play-again-button');

        if (restartButton) {
            this.setupButtonHandler(restartButton, () => this.emit('gamestart'));
        }
        if (playAgainButton) {
            this.setupButtonHandler(playAgainButton, () => this.emit('gamerestart'));
        }
    }

    setupButtonHandler(button, callback) {
        let isHandling = false;
        const debouncedHandler = (e) => {
            e.preventDefault();
            if (isHandling) return;
            
            const currentPanel = button.closest('.intro-panel, .tutorial-panel');
            if (!currentPanel || !currentPanel.classList.contains('active')) return;
            
            isHandling = true;
            callback(button.dataset.next);
            setTimeout(() => { isHandling = false; }, 300);
        };

        button.addEventListener('touchstart', debouncedHandler, { passive: false });
        button.addEventListener('click', debouncedHandler);
    }

    showIntroPanel(panelNumber) {
        // Hide all panels first
        const allPanels = document.querySelectorAll('.intro-panel');
        allPanels.forEach(panel => {
            panel.style.display = 'none';
            panel.classList.remove('active');
        });

        const nextPanel = document.querySelector(`.intro-panel[data-panel="${panelNumber}"]`);
        if (!nextPanel) return;

        // Show the selected panel
        nextPanel.style.display = 'block';
        // Force reflow
        nextPanel.offsetHeight;
        requestAnimationFrame(() => {
            nextPanel.classList.add('active');
        });
    }

    showTutorialPanel(panelNumber) {
        // Hide all tutorial panels first
        const allPanels = document.querySelectorAll('.tutorial-panel');
        allPanels.forEach(panel => {
            panel.style.display = 'none';
            panel.classList.remove('active');
        });

        const nextPanel = document.querySelector(`.tutorial-panel[data-panel="${panelNumber}"]`);
        if (!nextPanel) return;

        // Show the selected panel
        nextPanel.style.display = 'block';
        // Force reflow
        nextPanel.offsetHeight;
        requestAnimationFrame(() => {
            nextPanel.classList.add('active');
        });
    }

    transitionPanels(currentPanel, nextPanel) {
        currentPanel.classList.remove('active');
        
        currentPanel.addEventListener('transitionend', () => {
            currentPanel.style.display = 'none';
            this.showPanel(nextPanel);
        }, { once: true });
    }

    showPanel(panel) {
        panel.style.display = 'block';
        panel.offsetHeight; // Force reflow
        requestAnimationFrame(() => {
            panel.classList.add('active');
        });
    }

    hideIntroShowTutorial() {
        // Fade out intro overlay
        this.introOverlay.style.opacity = '0';
        setTimeout(() => {
            this.introOverlay.style.display = 'none';
            
            // Show tutorial overlay
            this.tutorialOverlay.style.display = 'flex';
            // Force reflow
            this.tutorialOverlay.offsetHeight;
            requestAnimationFrame(() => {
                this.tutorialOverlay.style.opacity = '1';
                // Show first tutorial panel
                this.showTutorialPanel(1);
            });
        }, 300);
    }

    hideTutorial() {
        // Fade out tutorial overlay and current panel
        this.tutorialOverlay.style.opacity = '0';
        const currentPanel = document.querySelector('.tutorial-panel.active');
        if (currentPanel) {
            currentPanel.classList.remove('active');
        }

        setTimeout(() => {
            // Hide tutorial overlay and panel
            this.tutorialOverlay.style.display = 'none';
            if (currentPanel) {
                currentPanel.style.display = 'none';
            }
            // Start the game after tutorial is hidden
            this.emit('gamestart');
        }, 300);
    }

    showMobileTutorial() {
        if (window.innerWidth <= 768) {
            this.mobileTutorial.style.display = 'block';
            setTimeout(() => {
                this.mobileTutorial.style.opacity = '1';
                setTimeout(() => {
                    this.mobileTutorial.style.opacity = '0';
                    setTimeout(() => {
                        this.mobileTutorial.style.display = 'none';
                    }, 300);
                }, 1500);
            }, 100);
        }
    }

    updateLevel(level) {
        this.levelIndicator.textContent = `Level: ${level}`;
    }

    updateObjective(text) {
        this.objectiveDisplay.textContent = text;
    }

    updateApprovalMeter(value) {
        this.approvalMeter.value = value;
    }

    updateKCCStatus(online) {
        this.kccStatusElement.innerHTML = online ? '🟢<span>LIVE</span>' : '🔴<span>OFFLINE</span>';
        this.kccStatusElement.classList.toggle('live', online);
    }

    showLevelTransition() {
        this.levelTransitionOverlay.style.display = 'flex';
        this.levelTransitionOverlay.style.opacity = '1';
        this.updateKCCStatus(false);
    }

    hideLevelTransition() {
        this.levelTransitionOverlay.style.display = 'none';
        this.levelTransitionOverlay.style.opacity = '0';
        this.updateKCCStatus(true);
    }

    showGameOver() {
        this.gameOverOverlay.style.display = 'flex';
        // Force reflow
        this.gameOverOverlay.offsetHeight;
        requestAnimationFrame(() => {
            this.gameOverOverlay.style.opacity = '1';
        });
        this.updateKCCStatus(false);
    }

    showWinScreen() {
        this.winMessage.style.display = 'flex';
        // Force reflow
        this.winMessage.offsetHeight;
        requestAnimationFrame(() => {
            this.winMessage.style.opacity = '1';
        });
        this.updateKCCStatus(false);
    }

    addFeedbackMessage(messageData) {
        const msgElement = document.createElement('div');
        msgElement.className = 'feedback-message';
        if (messageData.negative) {
            msgElement.classList.add('negative');
        }
        msgElement.textContent = messageData.text;
        this.feedbackArea.appendChild(msgElement);

        while (this.feedbackArea.children.length > 5) {
            this.feedbackArea.removeChild(this.feedbackArea.firstChild);
        }

        setTimeout(() => {
            msgElement.classList.add('fade-out');
            msgElement.addEventListener('transitionend', () => {
                if (msgElement.parentElement === this.feedbackArea) {
                    this.feedbackArea.removeChild(msgElement);
                }
            }, { once: true });
        }, 2000);
    }

    // Custom event emitter
    emit(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}