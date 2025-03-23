import { gameState } from './gameState.js';

// Audio system for the hot air balloon game
const audioSystem = {
    // Sound effect for the burner
    burnerSound: null,
    
    // Background music
    backgroundTracks: [],
    currentTrackIndex: -1,
    backgroundPlayer: null,
    
    // Volume levels
    soundEffectVolume: 0.3,
    backgroundVolume: 0.2,  // Lower volume for background music
    
    // Initialize audio system
    init: function(burnerSoundPath, musicTrackPaths) {
        // Create Audio objects
        this.burnerSound = new Audio(burnerSoundPath);
        this.burnerSound.volume = this.soundEffectVolume;
        this.burnerSound.loop = true;  // Continuous burner sound while W is pressed
        
        // Load background music tracks
        if (musicTrackPaths && musicTrackPaths.length > 0) {
            for (const path of musicTrackPaths) {
                const track = new Audio(path);
                track.volume = this.backgroundVolume;
                this.backgroundTracks.push(track);
            }
            
            // Create a player for background music
            this.backgroundPlayer = document.createElement('audio');
            this.backgroundPlayer.volume = this.backgroundVolume;
            
            // When a track ends, play the next one
            this.backgroundPlayer.addEventListener('ended', () => {
                this.playNextTrack();
            });
            
            // Shuffle the tracks initially
            this.shuffleTracks();
        }
    },
    
    // Start playing background music
    startBackgroundMusic: function() {
        if (this.backgroundTracks.length > 0) {
            this.playNextTrack();
        }
    },
    
    // Play the next track in the sequence
    playNextTrack: function() {
        if (this.backgroundTracks.length === 0) return;
        
        // Move to the next track, or back to the beginning if at the end
        this.currentTrackIndex++;
        if (this.currentTrackIndex >= this.backgroundTracks.length) {
            // Reshuffle when we've gone through all tracks
            this.shuffleTracks();
            this.currentTrackIndex = 0;
        }
        
        // Get the current track
        const currentTrack = this.backgroundTracks[this.currentTrackIndex];
        
        // Set as source and play
        this.backgroundPlayer.src = currentTrack.src;
        this.backgroundPlayer.play().catch(error => {
            console.warn('Could not play audio automatically:', error);
        });
    },
    
    // Shuffle the tracks to randomize order
    shuffleTracks: function() {
        for (let i = this.backgroundTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.backgroundTracks[i], this.backgroundTracks[j]] = 
            [this.backgroundTracks[j], this.backgroundTracks[i]];
        }
    },
    
    // Play burner sound
    playBurnerSound: function() {
        if (this.burnerSound.paused) {
            this.burnerSound.play().catch(error => {
                console.warn('Could not play burner sound:', error);
            });
        }
    },
    
    // Stop burner sound
    stopBurnerSound: function() {
        if (!this.burnerSound.paused) {
            this.burnerSound.pause();
            this.burnerSound.currentTime = 0;
        }
    },
    
    // Set sound effect volume
    setSoundEffectVolume: function(volume) {
        this.soundEffectVolume = Math.max(0, Math.min(1, volume));
        if (this.burnerSound) {
            this.burnerSound.volume = this.soundEffectVolume;
        }
    },
    
    // Set background music volume
    setBackgroundVolume: function(volume) {
        this.backgroundVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundPlayer) {
            this.backgroundPlayer.volume = this.backgroundVolume;
        }
    },
    
    // Mute/unmute all audio
    setMute: function(mute) {
        if (this.burnerSound) {
            this.burnerSound.muted = mute;
        }
        if (this.backgroundPlayer) {
            this.backgroundPlayer.muted = mute;
        }
    }
};

export default audioSystem;