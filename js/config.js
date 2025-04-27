export const GAME_CONFIG = {
    player: {
        width: 56,
        height: 56,
        speed: 180,
        dashCooldown: 1500,
        dashDuration: 400,
        laserCooldown: 2000,
        laserDuration: 150,
        laserRange: 300,
        laserWidth: 5,
        invulnerabilityDuration: 1000
    },
    rival: {
        baseSpeed: 60,
        hazardRadius: 50,
        hazardWarningDuration: 800,
        hazardActiveDuration: 1000,
        width: 38,
        height: 38
    },
    collectible: {
        radius: 10,
        width: 15,
        height: 10
    },
    targetZone: {
        radius: 40,
        color: 'rgba(0, 255, 0, 0.3)',
        borderColor: '#00ff00'
    },
    levels: [
        {
            level: 1,
            numRivals: 3,
            numCollectibles: 5,
            targetXRatio: 0.85,
            targetYRatio: 0.8,
            objectiveText: "Objective: Reach the Viral Stage!",
            rivalSpeedMultiplier: 1.0,
            rivalHazardCooldownBase: 3500
        },
        {
            level: 2,
            numRivals: 4,
            numCollectibles: 7,
            targetXRatio: 0.15,
            targetYRatio: 0.2,
            objectiveText: "Objective: Reach the Upload Point!",
            rivalSpeedMultiplier: 1.1,
            rivalHazardCooldownBase: 3000
        },
        {
            level: 3,
            numRivals: 5,
            numCollectibles: 8,
            targetXRatio: 0.5,
            targetYRatio: 0.15,
            objectiveText: "Objective: Secure the Data Core!",
            rivalSpeedMultiplier: 1.15,
            rivalHazardCooldownBase: 2800
        },
        {
            level: 4,
            numRivals: 6,
            numCollectibles: 10,
            targetXRatio: 0.8,
            targetYRatio: 0.2,
            objectiveText: "Objective: Final Broadcast Point!",
            rivalSpeedMultiplier: 1.2,
            rivalHazardCooldownBase: 2500
        }
    ],
    feedback: [
        { trigger: 'dash', text: '#KovuBoost!', approval: 3, sound: 'dash' },
        { trigger: 'halfway', text: 'Looking good! #Progress', approval: 5, sound: 'feedbackPositive', note: 'G4' },
        { trigger: 'dodge', text: 'Nice dodge! #Skillz', approval: 4, sound: 'feedbackPositive', note: 'A4' },
        { trigger: 'hazard_hit', text: 'Hazard Hit! Approval Lost!', approval: -15, sound: 'playerHit', negative: true },
        { trigger: 'rival_collision', text: 'Collision! Ouch!', approval: -10, sound: 'playerHit', negative: true },
        { trigger: 'collect', text: 'Data Packet! +Approval!', approval: 5, sound: 'collect', note: 'C5' },
        { trigger: 'destroy_rival', text: '#Victory! Community Morale Soaring!', approval: 10, sound: 'rivalDestroyed' },
        { trigger: 'win', text: '#Victory! Community Morale Soaring!', approval: 20, sound: 'win', note: 'C5' }
    ]
};