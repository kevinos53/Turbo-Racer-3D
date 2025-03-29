        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        // Game State Manager
        class GameState {
            constructor() {
                this.states = {
                    LOADING: 'loading',
                    MENU: 'menu',
                    COUNTDOWN: 'countdown',
                    RACING: 'racing',
                    PAUSED: 'paused',
                    RACE_COMPLETE: 'race_complete'
                };
                this.currentState = this.states.LOADING;
                this.selectedTrack = 0;
                this.selectedCar = 0;
                this.weather = 'clear'; // clear, rain, fog
                this.timeOfDay = 'day'; // day, sunset, night
                this.loadingProgress = 0;
            }

            changeState(newState) {
                const oldState = this.currentState;
                this.currentState = newState;
                console.log(`Game state changed from ${oldState} to ${newState}`);
                
                // Handle UI changes based on state
                switch(newState) {
                    case this.states.LOADING:
                        document.getElementById('loading-screen').style.display = 'flex';
                        document.getElementById('main-menu').style.display = 'none';
                        document.getElementById('hud').style.display = 'none';
                        document.getElementById('race-results').style.display = 'none';
                        document.getElementById('pause-menu').style.display = 'none';
                        break;
                    case this.states.MENU:
                        document.getElementById('loading-screen').style.display = 'none';
                        document.getElementById('main-menu').style.display = 'flex';
                        document.getElementById('hud').style.display = 'none';
                        document.getElementById('race-results').style.display = 'none';
                        document.getElementById('pause-menu').style.display = 'none';
                        break;
                    case this.states.COUNTDOWN:
                    case this.states.RACING:
                        document.getElementById('loading-screen').style.display = 'none';
                        document.getElementById('main-menu').style.display = 'none';
                        document.getElementById('hud').style.display = 'block';
                        document.getElementById('race-results').style.display = 'none';
                        document.getElementById('pause-menu').style.display = 'none';
                        break;
                    case this.states.PAUSED:
                        document.getElementById('pause-menu').style.display = 'flex';
                        break;
                    case this.states.RACE_COMPLETE:
                        document.getElementById('race-results').style.display = 'flex';
                        break;
                }
            }

            updateLoadingProgress(progress) {
                this.loadingProgress = progress;
                document.getElementById('loading-bar').style.width = `${progress * 100}%`;
                document.getElementById('loading-text').textContent = `Loading... ${Math.floor(progress * 100)}%`;
                
                if (progress >= 1) {
                    setTimeout(() => {
                        this.changeState(this.states.MENU);
                    }, 500);
                }
            }
        }

        // Input Manager
        class InputManager {
            constructor() {
                this.keys = {};
                this.gamepad = null;
                this.touchControls = {
                    accelerate: false,
                    brake: false,
                    left: false,
                    right: false,
                    boost: false
                };
                
                this.setupKeyboardListeners();
                this.setupTouchListeners();
                this.setupGamepadListeners();
            }
            
            setupKeyboardListeners() {
                window.addEventListener('keydown', (e) => {
                    this.keys[e.code] = true;
                });
                
                window.addEventListener('keyup', (e) => {
                    this.keys[e.code] = false;
                });
            }
            
            setupTouchListeners() {
                const accelerateBtn = document.getElementById('accelerate-btn');
                const brakeBtn = document.getElementById('brake-btn');
                const leftBtn = document.getElementById('left-btn');
                const rightBtn = document.getElementById('right-btn');
                const boostBtn = document.getElementById('boost-btn');
                
                // Helper function for touch events
                const handleTouch = (element, controlName, isActive) => {
                    const setActive = () => {
                        this.touchControls[controlName] = isActive;
                        element.classList.toggle('pressed', isActive);
                    };
                    
                    element.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        setActive();
                    });
                    
                    element.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        this.touchControls[controlName] = false;
                        element.classList.remove('pressed');
                    });
                    
                    element.addEventListener('touchcancel', (e) => {
                        e.preventDefault();
                        this.touchControls[controlName] = false;
                        element.classList.remove('pressed');
                    });
                };
                
                handleTouch(accelerateBtn, 'accelerate', true);
                handleTouch(brakeBtn, 'brake', true);
                handleTouch(leftBtn, 'left', true);
                handleTouch(rightBtn, 'right', true);
                handleTouch(boostBtn, 'boost', true);
            }
            
            setupGamepadListeners() {
                window.addEventListener('gamepadconnected', (e) => {
                    console.log('Gamepad connected:', e.gamepad.id);
                    this.gamepad = e.gamepad;
                });
                
                window.addEventListener('gamepaddisconnected', (e) => {
                    console.log('Gamepad disconnected',e);
                    this.gamepad = null;
                });
            }
            
            update() {
                this.updateGamepad();
            }
            
            updateGamepad() {
                const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                if (gamepads.length > 0 && gamepads[0]) {
                    this.gamepad = gamepads[0];
                }
            }
            
            isPressed(keyCode) {
                return !!this.keys[keyCode];
            }
            
            isAccelerating() {
                return this.isPressed('KeyW') || 
                       this.isPressed('ArrowUp') || 
                       this.touchControls.accelerate || 
                       (this.gamepad && this.gamepad.buttons[7] && this.gamepad.buttons[7].pressed);
            }
            
            isBraking() {
                return this.isPressed('KeyS') || 
                       this.isPressed('ArrowDown') || 
                       this.isPressed('ShiftLeft') || 
                       this.isPressed('ShiftRight') || 
                       this.touchControls.brake || 
                       (this.gamepad && this.gamepad.buttons[6] && this.gamepad.buttons[6].pressed);
            }
            
            isTurningLeft() {
                return this.isPressed('KeyA') || 
                       this.isPressed('ArrowLeft') || 
                       this.touchControls.left || 
                       (this.gamepad && this.gamepad.axes[0] < -0.2);
            }
            
            isTurningRight() {
                return this.isPressed('KeyD') || 
                       this.isPressed('ArrowRight') || 
                       this.touchControls.right || 
                       (this.gamepad && this.gamepad.axes[0] > 0.2);
            }
            
            isBoostPressed() {
                return this.isPressed('Space') || 
                       this.touchControls.boost || 
                       (this.gamepad && this.gamepad.buttons[0] && this.gamepad.buttons[0].pressed);
            }
            
            isPausePressed() {
                return this.isPressed('Escape') || 
                       this.isPressed('KeyP') || 
                       (this.gamepad && this.gamepad.buttons[9] && this.gamepad.buttons[9].pressed);
            }
        }

        // Sound Manager
        class SoundManager {
            constructor() {
                this.sounds = {};
                this.musicTracks = {};
                this.currentMusic = null;
                this.engineSound = null;
                this.enginePitch = 1;
                this.musicVolume = 0.5;
                this.sfxVolume = 0.7;
                this.muted = false;
                this.audioUnlocked = false; 
                
                this.initSounds();
            }

            unlockAudio() {
                if (this.audioUnlocked) return;
                console.log("Unlocking audio context...");
                this.audioUnlocked = true;
                // Tenter de jouer un son silencieux peut aider à débloquer
                // sur certains navigateurs/appareils, bien que souvent non nécessaire
                // avec les éléments <audio>.
                // On pourrait aussi reprendre un AudioContext ici si on l'utilisait directement.
                
                // Essayer de rejouer la musique en cours si elle était bloquée
                if (this.currentMusic && this.currentMusic.paused) {
                    this.currentMusic.play().catch(e => console.warn("Audio play failed after unlock:", e));
                }
            }
            
            initSounds() {
                // Engine sound (looped)
                this.engineSound = new Audio();
                this.engineSound.src = this.generateEngineSound();
                this.engineSound.loop = true;
                
                // SFX
                this.sounds.crash = new Audio();
                this.sounds.crash.src = this.generateCrashSound();
                
                this.sounds.skid = new Audio();
                this.sounds.skid.src = this.generateSkidSound();
                this.sounds.skid.loop = true;
                
                this.sounds.boost = new Audio();
                this.sounds.boost.src = this.generateBoostSound();
                
                this.sounds.countdown = new Audio();
                this.sounds.countdown.src = this.generateCountdownSound();
                
                this.sounds.countdownGo = new Audio();
                this.sounds.countdownGo.src = this.generateCountdownGoSound();
                
                // Music tracks
                this.musicTracks.menu = new Audio();
                this.musicTracks.menu.src = this.generateMenuMusic();
                this.musicTracks.menu.loop = true;
                
                this.musicTracks.race = new Audio();
                this.musicTracks.race.src = this.generateRaceMusic();
                this.musicTracks.race.loop = true;
                
                this.musicTracks.finish = new Audio();
                this.musicTracks.finish.src = this.generateFinishMusic();
                this.musicTracks.finish.loop = true;
                
                // Set volumes
                this.setMusicVolume(this.musicVolume);
                this.setSFXVolume(this.sfxVolume);
            }
            
            setMusicVolume(volume) {
                this.musicVolume = Math.max(0, Math.min(1, volume));
                Object.values(this.musicTracks).forEach(track => {
                    track.volume = this.musicVolume;
                });
            }
            
            setSFXVolume(volume) {
                this.sfxVolume = Math.max(0, Math.min(1, volume));
                Object.values(this.sounds).forEach(sound => {
                    sound.volume = this.sfxVolume;
                });
                this.engineSound.volume = this.sfxVolume * 0.5; // Engine a bit quieter
            }
            
            playMusic(trackName) {
                if (!this.audioUnlocked) {
                    console.log("Audio not unlocked, delaying music:", trackName);
                    // On pourrait mettre en file d'attente, mais pour l'instant on ignore
                    return; 
                }
                if (this.currentMusic) {
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                }
                
                this.currentMusic = this.musicTracks[trackName];
                if (this.currentMusic) {
                    this.currentMusic.volume = this.musicVolume;
                    this.currentMusic.play();
                }
            }
            
            stopMusic() {
                if (this.currentMusic) {
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                    this.currentMusic = null;
                }
            }
            
            playSound(soundName) {
                if (!this.audioUnlocked) {
                    console.log("Audio not unlocked, skipping sound:", soundName);
                    return; 
                }
                const sound = this.sounds[soundName];
                if (sound) {
                    sound.currentTime = 0;
                    sound.play();
                }
            }
            
            startEngineSound() {
                this.engineSound.play();
            }
            
            stopEngineSound() {
                this.engineSound.pause();
            }
            
            updateEngineSound(speed, maxSpeed) {
                if (!this.engineSound) return;
                
                // Calculate engine pitch and volume based on speed
                const speedRatio = Math.min(speed / maxSpeed, 1);
                this.enginePitch = 0.8 + speedRatio * 1.2; // Range 0.8-2.0
                
                // Apply pitch using playbackRate (not perfect but works ok)
                this.engineSound.playbackRate = this.enginePitch;
            }
            
            startSkidSound() {
                this.sounds.skid.play();
            }
            
            stopSkidSound() {
                this.sounds.skid.pause();
            }
            
            toggleMute() {
                this.muted = !this.muted;
                
                if (this.muted) {
                    this.setMusicVolume(0);
                    this.setSFXVolume(0);
                } else {
                    this.setMusicVolume(this.musicVolume);
                    this.setSFXVolume(this.sfxVolume);
                }
                
                return this.muted;
            }
            
            // Sound generation functions using AudioContext
            generateEngineSound() {
                return "data:audio/wav;base64,UklGRnQOAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YU8OAACBf4mMkZt4VkA/T2VpaWhdaYapspmehHx+epuDWUwxLyonPGBidW1xc2ZJQUBKVWdtdISEfGhgW1pPRUdOUGJyd3t9fHp5d2xWQ0NCRExdaHJ1dHBnX1dQUExIQj1BRkxWYGx6gYWCf3p3dXN1c29tbm9ucG9wcnF0dXZ2dnZ3eHh3dnZ3eHl3d3d4eHl6ent7e3t8fH19fn5+fX18fH19fn9/f39/f39/f39/f3+AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
            }
            
            generateCrashSound() {
                return "data:audio/wav;base64,UklGRn4QAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YV0QAAAAAAEGDRUbHR0aFhMVGRwdHBsaFhENBwEBBhIaICMiIB8dGxodICMjIyIgGxMKBAQJERgeIiQkIyEeGhkbHiIlJSUkIRwVCwcFCxMaICQmJiUjIB0bHB8jJigoKCYiGxMKBwcMFBshJCcnJiQhHh0eICMmKCkpKCUeFA0HBw0VHCIlJygnJiMgHh8hIyYoKSopKCMcEgkICw8YHiMmKCgnJiMhICEjJScoKSopJiEYDgkJDBEaICQmKSknJiMhISIkJigoKiooJR8UDAoKDRMcISUoKSkoJiQiIiQmKCkqKysoIxwSDAsLDxUdIiYpKiooJiQjJCUmKCkrKysnIhkQDAsMEBYfIyYpKSkoJyUkJCUmKCkqKyomIBcODAwNERgfIycpKSkoJyUlJSYnKCkqKykjHhQNDA0OExkgJCcpKSkoJyYmJiYnKCkqKygmHhUODQ0OExogJCcpKSkoJycmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKykjHRQNDQ0OExogJCcpKSkoJycmJiYnKCkqKygmHhUODQ0OExkgJCcpKSkoJyYmJiYnKCkqKygmHhUODQ0OEhkfIycpKSkpJyYmJiYnKCkqKiglHRQNDQ0OEhggJCcpKSkpJyYmJiYnKCkqKiglHRMNDQ0OEhgfJCcpKSkpJyYmJiYnKCkqKiglHRMNDAwOEhgfJCcpKSkpJyYmJiYnKCkqKiglHRMNDAwOEhgfJCcpKSkoJyYmJiYnKCkqKiglHRMNDAwOEhgfJCcpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfJCcpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfJCcpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfJCcpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfJCcpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKiglHBMNDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigkHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigkHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKSgkHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkoJyYmJiYnKCkqKigjHBINDAwOEhgfIyYpKSkn";
            }
            
            generateSkidSound() {
                return "data:audio/wav;base64,UklGRp4MAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YXoMAACBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGB";
            }
            
            generateBoostSound() {
                return "data:audio/wav;base64,UklGRqQFAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YYAFAAAAAAAAAAAAgAB0AG0Aj3lsADaQGgA5oBkAT10MAG9uKACCdx0AL5IXECyeFiJsmCw8KM0rNgCHARsA8QK7APsGOAW9DWZzrXSOhJl0pn6Sc7WCj3W3gYtzvYOScaF7nHOXe5xzln2Zc5Z7mXOWe5tzlHybdZN8m3WTfJl1kXyaddB9mHXffpl1232cddt8onPUd6pxyHO0ccF1unOzdsRxsoK5b8pxwG/XbMdv0XTLbNh00WnZdNdq0nXWbNB33G3Jd+BxyXfcdc121XbYetF32nfTeN911XrbeNV823fUfdx41X/adtWA2nbWgdl21IPZdtWG2HfUiNd41IrWeNWM1HnVjtJ41ZDSd9aSz3jWlM142JbNedeXzXjXmct42JrIeNmcyHnamsh63pzFeNyfxHjdosF43aW+eN6nunjerqd44bGleOKzpHnktaN54bejeuC4oXzeuqB94L2ff9++n4HdwJ+D3cGfhNzDoYXaw6OG28Olht3CpYbfwqWG38Olh97CpYnewKaL376mjN+9po3hvqaO47+mkOPAp5Hi";
            }
            
            generateCountdownSound() {
                return "data:audio/wav;base64,UklGRgQDAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YeACAAAAAAEGDRIWGRsdHh4eHRsYFBEOCgYDAP37+Pb08vHv7u3t7e7v8PHz9ff5/P8BBQkNERUYGx0eHx8eHBkWEw8LBwMAPjz59Pbz8fDu7e3t7u/x8vT3+fz+AQQIDAwQFBcaHB4fHx4cGRYSjw0JBAEAPz37+PXz8e/t7Ozt7/Dy9Pb5+/3/AwYJDREVGBodHh8eHRsYFREOCgcDAD/8+fb08vDu7ezs7e7w8vT2+fr9/wIFCQwQFBcaHB0eHh0bGRYTDwoGAgD++/j18/Hv7ezt7e7w8fP29/r8/gEEBwsOEhYZGx0eHh0cGhcUEAwIBAEA/fr39PLw7u3s7O3u8PL09vj7/P4BBQgMDxMWGRsdHh4dGxkWEw8LBwQB/vv59fPx7+3s7Ozt7/Hz9ff6/P4BBAgLDxMWGRsdHh4dHBkWEw8LBwMBP/z49vTy8O7t7Ozt7vDy9Pb4+vz+AQQHCw4RFRgbHR4eHRwZFxQQDAkFAgD++/j18/Hv7ezt7e7w8fP";
            }
            
            generateCountdownGoSound() {
                return "data:audio/wav;base64,UklGRtwEAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YbgEAAAAAQAAAAAAAQAAAAEAAAAAAQAAAAAAAAD+/wAA//8AAAEAAAABAAAAAAAA/f8AAP3/AAAAAP7/AAD+/wAA/v/+//3//f/9//3/+//8//z//P/7//v/+//9//v//P/8//z//P/8//v//f/8//3//P/9//3//f/9//3//f/9//3//P/8//z//P/8//z//f/7//3//P/9//3//f/9//3//f/9//3//v/+//3//f/+//7//v/+//7//v/+//7//v/9//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v8=";
            }

            generateMenuMusic() {
                return "data:audio/wav;base64,UklGRvQGAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YdAGAADw7+3r6unn5eTj4uHg3t3c29rZ2NbV1NPS0dDPzs3My8rJyMbGxcTDwsHAwL++vr28u7q6ubm4uLe3t7e3t7e3t7e3uLi4ubq6u7y9vr/AwcLExcbHycrLzM3P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX19vf4+Pn6+vv7/Pz9/f3+/v7+/v7+/v79/f38/Pv7+vr5+Pj39vX19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcDAv76+vby7urq5ubi4t7e3t7e3t7e3t7e4uLi5urq7vL2+v8DBwsTFxsfJysvMzc/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fX29/j4+fr6+/v8/P39/f7+/v7+/v7+/v39/fz8+/v6+vn4+Pf29fX08/Ly8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcDAv76+vby7urq5ubi4t7e3t7e3t7e3t7e4uLi5urq7vL2+v8DBwsTFxsfJysvMzc/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fX29/j4+fr6+/v8/P39/f7+/v7+/v7+/v39/fz8+/v6+vn4+Pf29fX08/Ly8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcDAv76+vby7urq5ubi4t7e3t7e3t7e3t7e4uLi5urq7vL2+v8DBwsTFxsfJysvMzc/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fX29/j4+fr6+/v8/P39/f7+/v7+/v7+/v39/fz8+/v6+vn4+Pf29fX08/Ly8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcDAv76+vby7urq5ubi4t7e3t7e3t7e3t7e4uLi5urq7vL2+v8DBwsTFxsfJysvMzc/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fX29/j4+fr6+/v8/P39/f7+/v7+/v7+/v39/fz8+/v6+vn4+Pf29fX08/Ly8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcDAv76+vby7urq5ubi4t7e3t7e3t7e3t7e4uLi5urq7vL2+v8DBwsTFxsfJysvMzc/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fX29/j4+fr6+/v8/P39/f7+/v7+/v7+/v39/fz8+/v6+vn4+Pf29fX08/Ly8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcDAv76+vby7urq5ubi4t7e3t7e3t7e3t7e4uLi5urq7vL2+v8DBwsTFxsfJysvMzc/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fX29/j4+fr6+/v8/P39/f7+/v7+/v7+/v39/fz8+/v6+vn4+Pf29fX08/Ly8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcDAv76+vby7urq5ubi4t7e3t7e3t7e3t7e4uA==";
            }
            
            generateRaceMusic() {
                return "data:audio/wav;base64,UklGRqQJAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YYAJAACBAX0CeQZpDEgSGBjnHbEjmClLLwA1wDqIQFZGJUz0UcpXpl2BYzppF2/uasNq2WrJastow2a2ZKJinGCUXptCkX+JfYJ7fnl7d3l2d3R3cXdueGp5Znpjezp8IX0PgfB+237Rfsp+x37FfsR+xX7GfpJ/4orLnMquyrLKtsq6yr3Kwcq1ypXKb8euyH8KfgR+AH7+fft9+X34ffZ99H3yfSGCOpaLys/K1Mrbyuvus++z77Xvte+177fvue+777/v8/ck+Hf4d/h3+Hf4d/h3+Hf4d/h3+CLtksPKzcuMhA59Dq0OvA7IDtcO5g73DgYPFQ8yEeUZSif3NKhCWlA2XQ5q5XbCg5qQcZ1nql23gsOOzprZpeOt7LX0vfzF9B9+H34ffh9+H34ffh9+H34ffh9+xNsWywnMEM0azifPM9A+0UrSVdNh1GzVkNb31oHX2Nbv1cbUm9NxcnJycnJycnJy2HnYedh52HnYedh57XmLf5d/o3+vf7t/x3/Tf99/63/3fwOAD4Azhb6QYJxFqCm0DcDxxtzTwL+svZi7hbl5t3O1bbNpJ2cqZy5nMmc3Z3NnXGhoaGhoaGholliWWJZYlliWWKtYwVh7em58cn50fnZ+eH56fnx+fn6AfoKAwIDCgMSAxoDIgMqAzIDOgNKAcnYRdvt16HXSdbt1pXWOdXh1YXVLdTR1HXUHdeN0xXSndIl0a3RNdC90EXTzc9ZzuHOac31zX3NBcyRzBnPpcslyrHKPcnJyVXI3cj+IKHArcS1yL3MxdDN1NXY3dzl4O3k9ej98QX1Dfk1/wohQkj2cKqYXsPO5wMPDUU9PT09PT09Pb09vT29Pb09vT29Pb09vT29P53Pnc+dz53Pnc+dz53Pnc+dz53MtOiw6LDosOiw6LDosOiw6LDosOuEzgDOAM4AzgDOAM4AzgDOAM4Az+jLfMt8y3zLfMt8y3zLfMt8y3zL6Md8x3zHfMd8x3zHfMd8x3zHfMfowZUXOQGlF7Uo9UGlVe1pvXIteXGGrY09mEmn0a9duc3GSdKl25Hj8eiB9Pn9cgHyBmIK1g9GE7YUJhyWIQIlbi3WMjo2nju2PBZFXmJmXl5aVlJOSkJFIkhSTLprJnKCek6CHooWjg6SBpX+mfad7qHmpd6p1q8euwbK8tre1srSttKi1o7aduJm5lLqQu4y8iL2EvYBAv5/DnseazJfNl86Tz4/QjNGI0oXTgdR+1XrWdtdz2G/ZbNpp2/OAnn+cf5p/mH+Wf5R/kn+Qf45/jH+Kf4h/hn+Ef4J/gH9+f3x/en94f3Z/dH9yf3B/bn9sf2p/aH9mf2R/Yn9gf15/XH9af1h/Vn9Uf1J/UH9Of0x/Sn9If0Z/RH9Cf0B/Pn88fzp/OH82fzR/Mn8wfy5/LH8qfyh/Jn8kfyJ/IH8efxx/Gn8Yfxh/lYx6PVAigDOAMoAygDKAMoAygDKAMoAygDNONOU0gDaAN4A4gDmAOoA7gD2APoA/gEGAQoBDgEWARoBHgEmASoBLgE2AToA7gDWNMY0tjSmNJY0hjR2NGY0VjRGND40LjQeNA40wjC2MLIwrjCqMKYwojCeMJowljCSMI4wyjDGMMIwvjC6ML4wwjDGMMowzjDSMNYw2jDeMOIw5jDqMO4w8jD2MHow/jECMQYxCjEOMRIxFjEaMR4xIjEmMSoxLjEyMTYxOjE+MUIxRjFKMU4xUjFWMVoxXjFiMWYxajFuMXIxdjF6MX4xgjGGMYoxjjGSMZYxmjGeMaIxpjGqMa4xsjG2MboxvjHCMcYxyjHOMdIx1jHaMd4x4jHmMeox7jHyMfYx+jH+MgIyBjIKMg4yEjIWMhoyHjIiMiYyKjIuMjIyNjI6Mj4yQjJGMkoyTjJSMlYyWjJeMmIyZjJqMm4ycjJ2MnoyfkXKScpJyknKSchFyEXIRchFyEXIpcilyKXIpchmIN4g3iDeIN4gqiCqIKogqiCqIJ4gniCeIJ4gdiBmIGYgZiBmIG4gbiP+HGogaiBqIGogaiDmIOYg5iDmIOYgniCeIJ4gniCeIJ4gniCeIJ4gniCeIJ4gniCeIJ4gniCeIJ4gniCeI9of2h/aH9of2h/aH9of2h/aH9od9iEaGMIYwhq2C4YL+gimDToNyg5eDvYPng0qETISPpvmsK8t4zMbNE853zsLPD9Bd0KrQ+NA9";
            }
            
            generateFinishMusic() {
                return "data:audio/wav;base64,UklGRiwHAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQgHAACXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5iYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmpqampqampqampqampqampqampqampqbm5ubm5ubm5ubm5ubm5ubm5ubm5ucnJycnJycnJycnJycnJycnJycnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnp6enp6enp6enp6enp6enp+fn5+fn5+fn5+fn5+fn5+goKCgoKCgoKCgoKCgoKChoaGhoaGhoaGhoaGhoaGioqKioqKioqKioqKioqOjo6Ojo6Ojo6Ojo6Ojo6SkpKSkpKSkpKSkpKSkpaWlpaWlpaWlpaWlpaWmpqampqampqampqampqenpqampqeoqKioqKioqKioqKioqampqampqampqampqampqqqqqqqqqqqqqqqqqqqq6urq6urq6urq6urq6urq6urq6urq6usrKysrKysrKysrKysrKysrKysrKysra2tra2tra2tra2tra2tra2tra2tra2tra2tra2urq6urq6urq6urq6urq6urq6urq6urq6ysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKyrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanZ+foKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCfoKCgn5+fn6Cfnp+fnp+enp+enZ6enZ6dnZ2dnZ2dnZ2dnJ2cnJycnJycnJubnJubm5ubm5uam5qampqampqamZqZmZmZmZmZmZiZmJiYmJiYmJiYl5iXl5eXl5eXl5aXlpaWlpaWlpaVlpWVlZWVlZWVlJWUlJSUlJSUlJOUk5OTk5OTk5OSkpKSkpKSkpKRkpGRkZGRkZGRkJGQkJCQkJCQkI+Qj4+Pj4+Pj4+Oj46Ojo6Ojo6OjY6NjY2NjY2NjYyNjIyMjIyMjIyLjIuLi4uLi4uLiouKioqKioqKiomKiYmJiYmJiYmIiYiIiIiIiIiIh4iHh4eHh4eHh4aHhoaGhoaGhoaFhoWFhYWFhYWFhIWEhISEhISEhIOEg4ODg4ODg4OChIKCgoKCgn+Ag4GBf36EcImBgH6BeHaBbIBcgWF5ZYJNckaCU25ugGdnfWl6aHd3bHpwdGJ/YXRsg1l3Xn9gdFaAN2xEiTBwO4UyeDt9NYEzbTaKF30lfSF4K3UqdSl5G3kidiF1HHcebiJ2FnkIgfp86H7qe+N+3n3ZftJ/0X7Sgc14z4DFedCAxHvJgcJ9xIHAfr+CvYC5g7WCtYOyg7KEr4Swha2FrIashKqGp4emiaGKmo2WjpSPkJGNk4qVhpeDmYGcfJ97oXadcqNvpm2oaqtlrmKxXbRYt1S6T71KwUXEQMc7yznONNEv1SrYJdwf4Bnkw+qo8HX3GYB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfIB8gHyAfw==";
            }
        }
        
        // Vehicle class to handle car physics
        class Vehicle {
            constructor(params = {}) {
                // Visual properties
                this.mesh = null;
                this.wheelMeshes = [];
                this.chassisMesh = null;
                this.carType = params.carType || 0;
                this.color = params.color || new THREE.Color(0xff0000);
                
                // Physical properties
                this.position = new THREE.Vector3(0, 0, 0);
                this.rotation = new THREE.Euler(0, 0, 0);
                this.velocity = new THREE.Vector3(0, 0, 0);
                this.acceleration = new THREE.Vector3(0, 0, 0);
                this.angularVelocity = 0;
                this.speed = 0;
                this.direction = new THREE.Vector3(0, 0, 1);
                
                // Car performance characteristics
                this.maxSpeed = params.maxSpeed || 200; // km/h
                this.acceleration = params.acceleration || 8; // m/s²
                this.braking = params.braking || 12; // m/s²
                this.handling = params.handling || 2.5; // turning rate
                this.grip = params.grip || 0.9; // 0-1, affects skidding
                this.weight = params.weight || 1200; // kg
                
                // State
                this.throttle = 0; // 0-1
                this.brake = 0; // 0-1
                this.steering = 0; // -1 to 1
                this.drifting = false;
                this.boostAmount = 1.0; // 0-1
                this.boosting = false;
                this.boostFactor = 1.3; // Speed multiplier when boosting
                this.boostRecoveryRate = 0.1; // How fast boost recovers
                this.boostDepletionRate = 0.3; // How fast boost depletes
                
                // Race tracking
                this.lap = 0;
                this.checkpoint = 0;
                this.totalCheckpoints = 0;
                this.bestLapTime = null;
                this.currentLapTime = 0;
                this.totalTime = 0;
                this.finished = false;
                this.racePosition = 1; // Race position (1st, 2nd, etc.)
                this.isPlayer = params.isPlayer || false;
                
                // AI attributes (for non-player vehicles)
                this.isAI = params.isAI || false;
                this.aiDifficulty = params.aiDifficulty || 0.5; // 0-1
                this.aiWaypointTarget = 0;
                this.aiThinkInterval = 0.2; // seconds between AI decisions
                this.aiThinkTimer = 0;
                
                // Collision
                this.boundingBox = new THREE.Box3();
                this.collidedLastFrame = false;
                this.collisionCooldown = 0;
                
                // Update helper properties
                this._lastPosition = new THREE.Vector3();
                this._tmpVector = new THREE.Vector3();
            }
            
            init(scene, startPosition, startRotation) {
                this.position.copy(startPosition);
                this.rotation.y = startRotation;
                this._lastPosition.copy(this.racePosition);
                
                // Create visual representation
                this.createMesh(scene);
                
                // Update direction vector based on initial rotation
                this.updateDirection();
            }
            
            createMesh(scene) {
                // Create a group to hold all car parts
                this.mesh = new THREE.Group();
                
                // Different car models based on carType
                const carModels = [
                    this.createSportsCar.bind(this),
                    this.createRaceCar.bind(this),
                    this.createMuscleCar.bind(this)
                ];
                
                // Create the selected car model
                carModels[this.carType](this.mesh);
                
                // Add car to scene
                scene.add(this.mesh);
                
                // Update initial position and rotation
                this.updateVisuals();
            }
            
            createSportsCar(parent) {
                // Chassis
                const chassisGeometry = new THREE.BoxGeometry(1.8, 0.6, 4);
                const chassisMaterial = new THREE.MeshPhongMaterial({
                    color: this.color,
                    specular: 0x111111,
                    shininess: 100
                });
                this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
                this.chassisMesh.position.y = 0.5;
                parent.add(this.chassisMesh);
                
                // Cabin
                const cabinGeometry = new THREE.BoxGeometry(1.5, 0.5, 2);
                const cabinMaterial = new THREE.MeshPhongMaterial({
                    color: 0x111111,
                    specular: 0x111111,
                    shininess: 100,
                });
                const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
                cabin.position.set(0, 0.85, 0);
                parent.add(cabin);
                
                // Wheels
                const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
                const wheelMaterial = new THREE.MeshPhongMaterial({
                    color: 0x333333,
                    specular: 0x444444,
                    shininess: 50
                });
                
                // Position wheels at the corners
                const wheelPositions = [
                    [-0.9, 0.4, -1.3], // Front left
                    [0.9, 0.4, -1.3],  // Front right
                    [-0.9, 0.4, 1.3],  // Rear left
                    [0.9, 0.4, 1.3]    // Rear right
                ];
                
                this.wheelMeshes = [];
                wheelPositions.forEach(position => {
                    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                    wheel.position.set(...position);
                    wheel.rotation.z = Math.PI / 2;
                    parent.add(wheel);
                    this.wheelMeshes.push(wheel);
                });
                
                // Spoiler for sports car
                const spoilerGeometry = new THREE.BoxGeometry(1.7, 0.1, 0.3);
                const spoilerMaterial = new THREE.MeshPhongMaterial({
                    color: 0x111111,
                    specular: 0x444444,
                    shininess: 50
                });
                const spoiler = new THREE.Mesh(spoilerGeometry, spoilerMaterial);
                spoiler.position.set(0, 0.9, 1.8);
                parent.add(spoiler);
                
                // Spoiler stands
                const standGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
                const leftStand = new THREE.Mesh(standGeometry, spoilerMaterial);
                leftStand.position.set(-0.7, 0.7, 1.8);
                parent.add(leftStand);
                
                const rightStand = new THREE.Mesh(standGeometry, spoilerMaterial);
                rightStand.position.set(0.7, 0.7, 1.8);
                parent.add(rightStand);
                
                // Headlights
                const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 8);
                const headlightMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffffcc,
                    specular: 0xffffff,
                    shininess: 100,
                    emissive: 0xffffcc,
                    emissiveIntensity: 0.5
                });
                
                const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
                leftHeadlight.position.set(-0.6, 0.6, -1.9);
                leftHeadlight.scale.z = 0.5;
                parent.add(leftHeadlight);
                
                const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
                rightHeadlight.position.set(0.6, 0.6, -1.9);
                rightHeadlight.scale.z = 0.5;
                parent.add(rightHeadlight);
                
                // Taillights
                const taillightGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
                const taillightMaterial = new THREE.MeshPhongMaterial({
                    color: 0xff0000,
                    specular: 0xff0000,
                    shininess: 100,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.5
                });
                
                const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
                leftTaillight.position.set(-0.7, 0.6, 1.9);
                parent.add(leftTaillight);
                
                const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
                rightTaillight.position.set(0.7, 0.6, 1.9);
                parent.add(rightTaillight);
                
                // Calculate bounding box
                this.boundingBox.setFromObject(parent);
            }
            
            createRaceCar(parent) {
                // Chassis - lower and wider than sports car
                const chassisGeometry = new THREE.BoxGeometry(2.0, 0.4, 4.2);
                const chassisMaterial = new THREE.MeshPhongMaterial({
                    color: this.color,
                    specular: 0x222222,
                    shininess: 100
                });
                this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
                this.chassisMesh.position.y = 0.4;
                parent.add(this.chassisMesh);
                
                // Formula-style open cockpit
                const cockpitGeometry = new THREE.BoxGeometry(1.2, 0.3, 2.5);
                const cockpitMaterial = new THREE.MeshPhongMaterial({
                    color: 0x111111,
                    specular: 0x111111,
                    shininess: 80,
                });
                const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
                cockpit.position.set(0, 0.55, -0.2);
                parent.add(cockpit);
                
                // Driver helmet
                const helmetGeometry = new THREE.SphereGeometry(0.2, 16, 16);
                const helmetMaterial = new THREE.MeshPhongMaterial({
                    color: 0xff0000,
                    specular: 0xffffff,
                    shininess: 100
                });
                const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
                helmet.position.set(0, 0.75, 0);
                helmet.scale.set(1, 0.8, 1);
                parent.add(helmet);
                
                // Front wing
                const frontWingGeometry = new THREE.BoxGeometry(2.2, 0.1, 0.6);
                const wingMaterial = new THREE.MeshPhongMaterial({
                    color: 0x111111,
                    specular: 0x444444,
                    shininess: 50
                });
                const frontWing = new THREE.Mesh(frontWingGeometry, wingMaterial);
                frontWing.position.set(0, 0.3, -2);
                parent.add(frontWing);
                
                // Rear wing
                const rearWingGeometry = new THREE.BoxGeometry(2.0, 0.8, 0.1);
                const rearWing = new THREE.Mesh(rearWingGeometry, wingMaterial);
                rearWing.position.set(0, 1.0, 2);
                parent.add(rearWing);
                
                // Wing supports
                const supportGeometry = new THREE.BoxGeometry(0.1, 0.7, 0.1);
                const leftSupport = new THREE.Mesh(supportGeometry, wingMaterial);
                leftSupport.position.set(-0.8, 0.65, 2);
                parent.add(leftSupport);
                
                const rightSupport = new THREE.Mesh(supportGeometry, wingMaterial);
                rightSupport.position.set(0.8, 0.65, 2);
                parent.add(rightSupport);
                
                // Wheels - larger at rear
                const frontWheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
                const rearWheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 16);
                const wheelMaterial = new THREE.MeshPhongMaterial({
                    color: 0x333333,
                    specular: 0x444444,
                    shininess: 50
                });
                
                // Front wheels
                const frontLeftWheel = new THREE.Mesh(frontWheelGeometry, wheelMaterial);
                frontLeftWheel.position.set(-1.0, 0.4, -1.5);
                frontLeftWheel.rotation.z = Math.PI / 2;
                parent.add(frontLeftWheel);
                this.wheelMeshes.push(frontLeftWheel);
                
                const frontRightWheel = new THREE.Mesh(frontWheelGeometry, wheelMaterial);
                frontRightWheel.position.set(1.0, 0.4, -1.5);
                frontRightWheel.rotation.z = Math.PI / 2;
                parent.add(frontRightWheel);
                this.wheelMeshes.push(frontRightWheel);
                
                // Rear wheels
                const rearLeftWheel = new THREE.Mesh(rearWheelGeometry, wheelMaterial);
                rearLeftWheel.position.set(-1.0, 0.45, 1.5);
                rearLeftWheel.rotation.z = Math.PI / 2;
                parent.add(rearLeftWheel);
                this.wheelMeshes.push(rearLeftWheel);
                
                const rearRightWheel = new THREE.Mesh(rearWheelGeometry, wheelMaterial);
                rearRightWheel.position.set(1.0, 0.45, 1.5);
                rearRightWheel.rotation.z = Math.PI / 2;
                parent.add(rearRightWheel);
                this.wheelMeshes.push(rearRightWheel);
                
                // Calculate bounding box
                this.boundingBox.setFromObject(parent);
            }
            
            createMuscleCar(parent) {
                // Muscle car - boxy, robust chassis
                const chassisGeometry = new THREE.BoxGeometry(2.2, 0.8, 4.5);
                const chassisMaterial = new THREE.MeshPhongMaterial({
                    color: this.color,
                    specular: 0x222222,
                    shininess: 80
                });
                this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
                this.chassisMesh.position.y = 0.6;
                parent.add(this.chassisMesh);
                
                // Cabin - muscle cars have a distinctive roofline
                const cabinGeometry = new THREE.BoxGeometry(2.0, 0.5, 2.2);
                const cabinMaterial = new THREE.MeshPhongMaterial({
                    color: 0x111111,
                    specular: 0x222222,
                    shininess: 60,
                });
                const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
                cabin.position.set(0, 1.15, -0.2);
                parent.add(cabin);
                
                // Hood scoop
                const scoopGeometry = new THREE.BoxGeometry(1.0, 0.2, 1.0);
                const scoopMaterial = new THREE.MeshPhongMaterial({
                    color: 0x111111,
                    specular: 0x222222,
                    shininess: 50
                });
                const scoop = new THREE.Mesh(scoopGeometry, scoopMaterial);
                scoop.position.set(0, 1.0, -1.2);
                parent.add(scoop);
                
                // Rear spoiler - more subtle than race car
                const spoilerGeometry = new THREE.BoxGeometry(2.1, 0.1, 0.4);
                const spoilerMaterial = new THREE.MeshPhongMaterial({
                    color: 0x111111,
                    specular: 0x444444,
                    shininess: 50
                });
                const spoiler = new THREE.Mesh(spoilerGeometry, spoilerMaterial);
                spoiler.position.set(0, 1.05, 2.1);
                parent.add(spoiler);
                
                // Spoiler stands
                const standGeometry = new THREE.BoxGeometry(0.1, 0.25, 0.1);
                const leftStand = new THREE.Mesh(standGeometry, spoilerMaterial);
                leftStand.position.set(-0.9, 0.95, 2.1);
                parent.add(leftStand);
                
                const rightStand = new THREE.Mesh(standGeometry, spoilerMaterial);
                rightStand.position.set(0.9, 0.95, 2.1);
                parent.add(rightStand);
                
                // Exhaust pipes
                const exhaustGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
                const exhaustMaterial = new THREE.MeshPhongMaterial({
                    color: 0x777777,
                    specular: 0xdddddd,
                    shininess: 100
                });
                
                const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
                leftExhaust.position.set(-0.8, 0.3, 2.2);
                leftExhaust.rotation.x = Math.PI / 2;
                parent.add(leftExhaust);
                
                const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
                rightExhaust.position.set(0.8, 0.3, 2.2);
                rightExhaust.rotation.x = Math.PI / 2;
                parent.add(rightExhaust);
                
                // Wheels - beefy muscle car wheels
                const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16);
                const wheelMaterial = new THREE.MeshPhongMaterial({
                    color: 0x333333,
                    specular: 0x444444,
                    shininess: 50
                });
                
                // Position wheels at the corners
                const wheelPositions = [
                    [-1.0, 0.45, -1.5], // Front left
                    [1.0, 0.45, -1.5],  // Front right
                    [-1.0, 0.45, 1.5],  // Rear left
                    [1.0, 0.45, 1.5]    // Rear right
                ];
                
                this.wheelMeshes = [];
                wheelPositions.forEach(position => {
                    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                    wheel.position.set(...position);
                    wheel.rotation.z = Math.PI / 2;
                    parent.add(wheel);
                    this.wheelMeshes.push(wheel);
                });
                
                // Headlights
                const headlightGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.1);
                const headlightMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffffcc,
                    specular: 0xffffff,
                    shininess: 100,
                    emissive: 0xffffcc,
                    emissiveIntensity: 0.5
                });
                
                const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
                leftHeadlight.position.set(-0.7, 0.7, -2.2);
                parent.add(leftHeadlight);
                
                const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
                rightHeadlight.position.set(0.7, 0.7, -2.2);
                parent.add(rightHeadlight);
                
                // Taillights
                const taillightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
                const taillightMaterial = new THREE.MeshPhongMaterial({
                    color: 0xff0000,
                    specular: 0xff0000,
                    shininess: 100,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.5
                });
                
                const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
                leftTaillight.position.set(-0.8, 0.7, 2.2);
                parent.add(leftTaillight);
                
                const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
                rightTaillight.position.set(0.8, 0.7, 2.2);
                parent.add(rightTaillight);
                
                // Calculate bounding box
                this.boundingBox.setFromObject(parent);
            }
            
            updateVisuals() {
                if (this.mesh) {
                    // Update position and rotation
                    this.mesh.position.copy(this.position);
                    this.mesh.rotation.y = this.rotation.y;
                    
                    // Update wheels rotation
                    if (this.wheelMeshes.length >= 4) {
                        // Front wheels steering
                        this.wheelMeshes[0].rotation.y = this.steering * 0.5;
                        this.wheelMeshes[1].rotation.y = this.steering * 0.5;
                        
                        // Wheel spinning based on speed
                        const wheelSpinRate = this.speed / 20;
                        this.wheelMeshes.forEach(wheel => {
                            wheel.rotation.x += wheelSpinRate;
                        });
                    }
                    
                    // Update bounding box position
                    this.boundingBox.setFromObject(this.mesh);
                }
            }
            
            updateDirection() {
                // Calculate direction vector from rotation
                this.direction.set(
                    Math.sin(this.rotation.y),
                    0,
                    Math.cos(this.rotation.y)
                );
                this.direction.normalize();
            }
            
            update(deltaTime, inputManager, trackSystem) {
                // Store previous position for collision resolution
                this._lastPosition.copy(this.position);
                
                if (this.isPlayer) {
                    // Handle player input
                    this.handlePlayerInput(inputManager, deltaTime);
                } else if (this.isAI) {
                    // Handle AI logic
                    this.handleAI(deltaTime, trackSystem);
                }
                
                // Apply physics
                this.applyPhysics(deltaTime);
                
                // Update visuals
                this.updateVisuals();
                
                // Check track checkpoints and update race progress
                if (trackSystem) {
                    this.updateRaceProgress(trackSystem, deltaTime);
                }
                
                // Cooldown for collision handling
                if (this.collisionCooldown > 0) {
                    this.collisionCooldown -= deltaTime;
                }
            }
            
            handlePlayerInput(inputManager, deltaTime) {
                // Get input values
                this.throttle = inputManager.isAccelerating() ? 1 : 0;
                this.brake = inputManager.isBraking() ? 1 : 0;
                
                // Progressive steering for smoother control
                let targetSteering = 0;
                if (inputManager.isTurningLeft()) targetSteering = -1;
                if (inputManager.isTurningRight()) targetSteering = 1;
                
                // Smoothly approach target steering
                const steeringSpeed = 5;
                this.steering = THREE.MathUtils.lerp(
                    this.steering,
                    targetSteering,
                    steeringSpeed * deltaTime
                );
                
                // Boost handling
                if (inputManager.isBoostPressed() && this.boostAmount > 0) {
                    this.boosting = true;
                    this.boostAmount = Math.max(0, this.boostAmount - this.boostDepletionRate * deltaTime);
                    
                    // Disable boost if empty
                    if (this.boostAmount <= 0) {
                        this.boosting = false;
                    }
                } else {
                    // Not boosting, recover boost
                    this.boosting = false;
                    this.boostAmount = Math.min(1, this.boostAmount + this.boostRecoveryRate * deltaTime);
                }
            }
            
            handleAI(deltaTime, trackSystem) {
                // Update AI thinking interval
                this.aiThinkTimer -= deltaTime;
                if (this.aiThinkTimer <= 0) {
                    this.aiThinkTimer = this.aiThinkInterval;
                    this.makeAIDecisions(trackSystem);
                }
                
                // Apply the decisions (throttle, brake, steering already set in makeAIDecisions)
                
                // Random boost usage based on difficulty
                if (this.boosting && this.boostAmount <= 0) {
                    this.boosting = false;
                }
                
                if (!this.boosting && Math.random() < this.aiDifficulty * 0.01 && this.boostAmount > 0.5) {
                    this.boosting = true;
                }
                
                if (this.boosting) {
                    this.boostAmount = Math.max(0, this.boostAmount - this.boostDepletionRate * deltaTime);
                } else {
                    this.boostAmount = Math.min(1, this.boostAmount + this.boostRecoveryRate * deltaTime);
                }
            }
            
            makeAIDecisions(trackSystem) {
                // Get next waypoint
                const waypoints = trackSystem.getAIWaypoints();
                if (!waypoints || waypoints.length === 0) return;
                
                // Target the current waypoint
                const targetWaypoint = waypoints[this.aiWaypointTarget % waypoints.length];
                
                // Vector to target
                const toTarget = new THREE.Vector3().subVectors(targetWaypoint, this.position);
                const distance = toTarget.length();
                
                // Check if we should move to next waypoint
                if (distance < 15) {
                    this.aiWaypointTarget++;
                }
                
                // Angle to target relative to car direction
                const targetAngle = Math.atan2(toTarget.x, toTarget.z);
                let angleDiff = targetAngle - this.rotation.y;
                
                // Normalize angle difference
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                // Set steering based on angle difference
                this.steering = THREE.MathUtils.clamp(angleDiff * 2, -1, 1);
                
                // Throttle control - reduce throttle for sharp turns
                const sharpTurn = Math.abs(angleDiff) > 0.3;
                this.throttle = sharpTurn ? 0.5 : 1;
                
                // Brake if turn is too sharp
                this.brake = (Math.abs(angleDiff) > 0.8) ? 0.5 : 0;
                
                // Add difficulty variations
                this.throttle *= 0.8 + this.aiDifficulty * 0.2;
                this.brake *= 1 - this.aiDifficulty * 0.3;
                
                // Occasionally make mistakes based on difficulty
                if (Math.random() < 0.01 * (1 - this.aiDifficulty)) {
                    this.throttle *= 0.5;
                    this.brake = 0.3;
                }
            }
            
            applyPhysics(deltaTime) {
                // Convert speed from km/h to m/s for calculations
                const speedMS = this.speed / 3.6;
                
                // Acceleration
                let acceleration = 0;
                if (this.throttle > 0) {
                    acceleration = this.acceleration * this.throttle;
                }
                
                // Apply boost
                if (this.boosting) {
                    acceleration *= this.boostFactor;
                }
                
                // Braking
                if (this.brake > 0) {
                    acceleration -= this.braking * this.brake;
                }
                
                // Air and rolling resistance
                const resistance = 0.2 + (speedMS * 0.01);
                acceleration -= resistance;
                
                // Calculate new speed in m/s
                let newSpeedMS = speedMS + acceleration * deltaTime;
                
                // Handle reversing logic
                if (newSpeedMS < 0) {
                    newSpeedMS = 0;
                }
                
                // Calculate maximum speed based on car characteristics
                let maxSpeedMS = this.maxSpeed / 3.6;
                if (this.boosting) {
                    maxSpeedMS *= this.boostFactor;
                }
                
                // Clamp speed
                newSpeedMS = Math.min(newSpeedMS, maxSpeedMS);
                
                // Convert back to km/h for display
                this.speed = newSpeedMS * 3.6;
                
                // Handling and turning
                const turnFactor = this.handling * this.steering * deltaTime;
                
                // Reduce turning effectiveness at higher speeds
                const speedTurnFactor = 1 - (speedMS / maxSpeedMS) * 0.4;
                const effectiveTurnFactor = turnFactor * speedTurnFactor;
                
                // Apply rotation
                this.rotation.y += effectiveTurnFactor * (newSpeedMS / maxSpeedMS);
                this.updateDirection();
                
                // Calculate skidding/drifting
                const turnSharpness = Math.abs(this.steering) * (newSpeedMS / maxSpeedMS);
                this.drifting = turnSharpness > this.grip;
                
                // If drifting, reduce grip and add some sliding
                if (this.drifting) {
                    // Add some side movement perpendicular to direction
                    const perpendicular = new THREE.Vector3(-this.direction.z, 0, this.direction.x);
                    perpendicular.multiplyScalar(this.steering * (1 - this.grip) * speedMS * 0.3);
                    
                    // Move in direction + some perpendicular slide
                    this.position.x += (this.direction.x * newSpeedMS + perpendicular.x) * deltaTime;
                    this.position.z += (this.direction.z * newSpeedMS + perpendicular.z) * deltaTime;
                } else {
                    // Normal movement in car's direction
                    this.position.x += this.direction.x * newSpeedMS * deltaTime;
                    this.position.z += this.direction.z * newSpeedMS * deltaTime;
                }
            }
            
            updateRaceProgress(trackSystem, deltaTime) {
                // Update checkpoint progress
                const checkpointInfo = trackSystem.checkVehicleCheckpoint(this);
                
                if (checkpointInfo.checkpoint !== this.checkpoint) {
                    // Changed checkpoint
                    const oldCheckpoint = this.checkpoint;
                    this.checkpoint = checkpointInfo.checkpoint;
                    
                    // Check for lap completion
                    if (oldCheckpoint > 0 && this.checkpoint === 0) {
                        this.lap++;
                        
                        // Store best lap time
                        if (this.bestLapTime === null || this.currentLapTime < this.bestLapTime) {
                            this.bestLapTime = this.currentLapTime;
                        }
                        
                        // Reset lap timer
                        this.currentLapTime = 0;
                    }
                }
                
                // Update lap and total time
                this.currentLapTime += deltaTime;
                this.totalTime += deltaTime;
            }
            
            handleCollision(otherVehicle) {
                if (this.collisionCooldown > 0) return;
                
                // Calculate collision response
                const pushForce = 2;
                
                // Direction from other vehicle to this vehicle
                this._tmpVector.subVectors(this.position, otherVehicle.position).normalize();
                
                // Push this vehicle away from collision
                this.position.x += this._tmpVector.x * pushForce;
                this.position.z += this._tmpVector.z * pushForce;
                
                // Reduce speed on collision
                this.speed *= 0.8;
                
                // Set cooldown to prevent multiple collisions in one frame
                this.collisionCooldown = 0.5;
                
                return true;
            }
            
            checkCollision(otherVehicle) {
                // Skip if same vehicle or either has collision cooldown
                if (this === otherVehicle || this.collisionCooldown > 0 || otherVehicle.collisionCooldown > 0) {
                    return false;
                }
                
                // Check bounding box intersection
                return this.boundingBox.intersectsBox(otherVehicle.boundingBox);
            }
            
            reset(position, rotation) {
                // Reset position and rotation
                this.position.copy(position);
                this.rotation.y = rotation;
                this._lastPosition.copy(this.position);
                
                // Reset physics state
                this.speed = 0;
                this.throttle = 0;
                this.brake = 0;
                this.steering = 0;
                this.drifting = false;
                this.updateDirection();
                
                // Reset race stats
                this.lap = 0;
                this.checkpoint = 0;
                this.bestLapTime = null;
                this.currentLapTime = 0;
                this.totalTime = 0;
                this.finished = false;
                
                // Reset boost
                this.boostAmount = 1.0;
                this.boosting = false;
                
                // Reset collision state
                this.collidedLastFrame = false;
                this.collisionCooldown = 0;
                
                // Update visuals
                this.updateVisuals();
            }
        }
        
        // Track generator class
        class TrackGenerator {
            constructor() {
                this.trackTypes = {
                    CIRCUIT_CITY: 0,
                    MOUNTAIN_PASS: 1,
                    DESERT_DRIFT: 2
                };
            }
            
            generateTrack(type, scene) {
                switch (type) {
                    case this.trackTypes.CIRCUIT_CITY:
                        return this.generateCityTrack(scene);
                    case this.trackTypes.MOUNTAIN_PASS:
                        return this.generateMountainTrack(scene);
                    case this.trackTypes.DESERT_DRIFT:
                        return this.generateDesertTrack(scene);
                    default:
                        return this.generateCityTrack(scene);
                }
            }
            
            generateCityTrack(scene) {
                // Create a city-themed track
                const track = new TrackSystem();
                
                // Set track properties
                track.name = "Circuit City";
                track.type = this.trackTypes.CIRCUIT_CITY;
                track.totalLaps = 3;
                
                // Track environment settings
                track.fogColor = new THREE.Color(0x999999);
                track.fogDensity = 0.02;
                track.groundColor = new THREE.Color(0x555555);
                track.skyColor = new THREE.Color(0x88aaff);
                track.ambientLightColor = new THREE.Color(0x444444);
                track.directionalLightColor = new THREE.Color(0xffffff);
                track.directionalLightIntensity = 1.0;
                
                // Generate track points - city circuit with 90-degree turns
                const trackPoints = [];
                
                // Start/finish straight
                trackPoints.push(new THREE.Vector3(0, 0, 0));
                trackPoints.push(new THREE.Vector3(0, 0, -150));
                
                // First turn (90 degrees)
                trackPoints.push(new THREE.Vector3(0, 0, -200));
                trackPoints.push(new THREE.Vector3(50, 0, -200));
                
                // Second straight
                trackPoints.push(new THREE.Vector3(150, 0, -200));
                trackPoints.push(new THREE.Vector3(200, 0, -200));
                
                // Second turn (90 degrees)
                trackPoints.push(new THREE.Vector3(250, 0, -200));
                trackPoints.push(new THREE.Vector3(250, 0, -150));
                
                // Third straight
                trackPoints.push(new THREE.Vector3(250, 0, -50));
                trackPoints.push(new THREE.Vector3(250, 0, 0));
                
                // Third turn (90 degrees)
                trackPoints.push(new THREE.Vector3(250, 0, 50));
                trackPoints.push(new THREE.Vector3(200, 0, 50));
                
                // Fourth straight
                trackPoints.push(new THREE.Vector3(100, 0, 50));
                trackPoints.push(new THREE.Vector3(50, 0, 50));
                
                // Fourth turn (90 degrees) back to start
                trackPoints.push(new THREE.Vector3(0, 0, 50));
                trackPoints.push(new THREE.Vector3(0, 0, 0));
                
                // Set track points
                track.setTrackPoints(trackPoints);
                
                // Generate track visuals
                this.generateTrackVisuals(track, scene);
                
                // Generate city environment
                this.generateCityEnvironment(track, scene);
                
                return track;
            }
            
            generateMountainTrack(scene) {
                // Create a mountain-themed track
                const track = new TrackSystem();
                
                // Set track properties
                track.name = "Mountain Pass";
                track.type = this.trackTypes.MOUNTAIN_PASS;
                track.totalLaps = 3;
                
                // Track environment settings
                track.fogColor = new THREE.Color(0xccccff);
                track.fogDensity = 0.01;
                track.groundColor = new THREE.Color(0x336633);
                track.skyColor = new THREE.Color(0x6688cc);
                track.ambientLightColor = new THREE.Color(0x666666);
                track.directionalLightColor = new THREE.Color(0xffffcc);
                track.directionalLightIntensity = 0.8;
                
                // Generate track points - mountain track with elevation changes and curves
                const trackPoints = [];
                
                // Start/finish area
                trackPoints.push(new THREE.Vector3(0, 0, 0));
                trackPoints.push(new THREE.Vector3(0, 0, -80));
                
                // Uphill section
                trackPoints.push(new THREE.Vector3(20, 5, -150));
                trackPoints.push(new THREE.Vector3(50, 10, -200));
                trackPoints.push(new THREE.Vector3(100, 15, -220));
                
                // Mountain ridge
                trackPoints.push(new THREE.Vector3(150, 20, -210));
                trackPoints.push(new THREE.Vector3(200, 20, -180));
                trackPoints.push(new THREE.Vector3(230, 20, -140));
                
                // Downhill section
                trackPoints.push(new THREE.Vector3(250, 15, -80));
                trackPoints.push(new THREE.Vector3(240, 10, -30));
                trackPoints.push(new THREE.Vector3(220, 5, 0));
                
                // Flat section
                trackPoints.push(new THREE.Vector3(180, 2, 30));
                trackPoints.push(new THREE.Vector3(130, 1, 40));
                trackPoints.push(new THREE.Vector3(80, 0, 30));
                
                // Return to start
                trackPoints.push(new THREE.Vector3(40, 0, 20));
                trackPoints.push(new THREE.Vector3(0, 0, 0));
                
                // Set track points
                track.setTrackPoints(trackPoints);
                
                // Generate track visuals
                this.generateTrackVisuals(track, scene);
                
                // Generate mountain environment
                this.generateMountainEnvironment(track, scene);
                
                return track;
            }
            
            generateDesertTrack(scene) {
                // Create a desert-themed track
                const track = new TrackSystem();
                
                // Set track properties
                track.name = "Desert Drift";
                track.type = this.trackTypes.DESERT_DRIFT;
                track.totalLaps = 3;
                
                // Track environment settings
                track.fogColor = new THREE.Color(0xffffcc);
                track.fogDensity = 0.005;
                track.groundColor = new THREE.Color(0xddbb77);
                track.skyColor = new THREE.Color(0xffddaa);
                track.ambientLightColor = new THREE.Color(0x997755);
                track.directionalLightColor = new THREE.Color(0xffffee);
                track.directionalLightIntensity = 1.2;
                
                // Generate track points - desert track with long straights and sweeping curves
                const trackPoints = [];
                
                // Start/finish straight
                trackPoints.push(new THREE.Vector3(0, 0, 0));
                trackPoints.push(new THREE.Vector3(0, 0, -200));
                
                // First turn (sweeping right)
                trackPoints.push(new THREE.Vector3(20, 0, -250));
                trackPoints.push(new THREE.Vector3(80, 0, -280));
                trackPoints.push(new THREE.Vector3(150, 0, -270));
                
                // Second straight
                trackPoints.push(new THREE.Vector3(200, 0, -240));
                trackPoints.push(new THREE.Vector3(250, 0, -200));
                
                // Second turn (sweeping left)
                trackPoints.push(new THREE.Vector3(280, 0, -150));
                trackPoints.push(new THREE.Vector3(290, 0, -80));
                trackPoints.push(new THREE.Vector3(270, 0, -20));
                
                // Third straight
                trackPoints.push(new THREE.Vector3(230, 0, 30));
                trackPoints.push(new THREE.Vector3(180, 0, 60));
                
                // Final turn back to start
                trackPoints.push(new THREE.Vector3(120, 0, 70));
                trackPoints.push(new THREE.Vector3(60, 0, 50));
                trackPoints.push(new THREE.Vector3(20, 0, 20));
                trackPoints.push(new THREE.Vector3(0, 0, 0));
                
                // Set track points
                track.setTrackPoints(trackPoints);
                
                // Generate track visuals
                this.generateTrackVisuals(track, scene);
                
                // Generate desert environment
                this.generateDesertEnvironment(track, scene);
                
                return track;
            }
            
            generateTrackVisuals(track, scene) {
                const trackPoints = track.getTrackPoints();
                if (!trackPoints || trackPoints.length < 2) return;
                
                // Create track mesh
                const trackWidth = 15;
                // const roadColor = (track.type === this.trackTypes.CIRCUIT_CITY) ? 0x333333 : 
                //                  (track.type === this.trackTypes.MOUNTAIN_PASS) ? 0x555555 : 0xccaa88;
                
                // Create a curve from track points
                const curve = new THREE.CatmullRomCurve3(trackPoints);
                curve.closed = true;
                
                // Generate track geometry
                const trackSegments = trackPoints.length * 10;
                const trackGeometry = new THREE.BufferGeometry();
                const points = curve.getPoints(trackSegments);
                
                // Create vertices for track (road + shoulders)
                const vertices = [];
                const normals = [];
                const uvs = [];
                
                // Create track mesh with proper UVs for texturing
                for (let i = 0; i < points.length; i++) {
                    const point = points[i];
                    const tangent = curve.getTangent(i / trackSegments);
                    
                    // Calculate normal (perpendicular to tangent in XZ plane)
                    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
                    
                    // Create left and right points of the track
                    const leftPoint = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(trackWidth / 2));
                    const rightPoint = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(-trackWidth / 2));
                    
                    // Add vertices for this track segment
                    vertices.push(leftPoint.x, leftPoint.y, leftPoint.z);
                    vertices.push(rightPoint.x, rightPoint.y, rightPoint.z);
                    
                    // Add normals (pointing up)
                    normals.push(0, 1, 0);
                    normals.push(0, 1, 0);
                    
                    // Add UVs for texturing
                    uvs.push(0, i / trackSegments * 20); // Left edge
                    uvs.push(1, i / trackSegments * 20); // Right edge
                }
                
                // Create indices for triangles
                const indices = [];
                for (let i = 0; i < points.length - 1; i++) {
                    const a = i * 2;
                    const b = i * 2 + 1;
                    const c = (i + 1) * 2;
                    const d = (i + 1) * 2 + 1;
                    
                    // Add two triangles for each track segment
                    indices.push(a, b, c);
                    indices.push(c, b, d);
                }
                
                // Add last segment connecting end to start
                const a = (points.length - 1) * 2;
                const b = (points.length - 1) * 2 + 1;
                const c = 0;
                const d = 1;
                indices.push(a, b, c);
                indices.push(c, b, d);
                
                // Set geometry attributes
                trackGeometry.setIndex(indices);
                trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                trackGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
                trackGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                
                // Generate appropriate texture based on track type
                const roadTexture = this.generateRoadTexture(track.type);
                const roadNormalMap = this.generateRoadNormalMap(track.type);
                
                // Create material
                const trackMaterial = new THREE.MeshStandardMaterial({
                    map: roadTexture,
                    normalMap: roadNormalMap,
                    roughness: 0.8,
                    metalness: 0.2,
                    side: THREE.DoubleSide
                });
                
                // Create mesh and add to scene
                const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
                trackMesh.receiveShadow = true;
                trackMesh.name = "track";
                scene.add(trackMesh);
                
                // Store track mesh in track system
                track.trackMesh = trackMesh;
                
                // Generate start/finish line
                this.generateStartFinishLine(track, scene);
                
                // Generate checkpoints
                this.generateCheckpoints(track, scene);
                
                // Generate track barriers
                this.generateTrackBarriers(track, scene);
            }
            
            generateRoadTexture(trackType) {
                // Create a canvas for the road texture
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');
                
                let asphaltColor, lineColor;
                
                switch (trackType) {
                    case this.trackTypes.CIRCUIT_CITY:
                        asphaltColor = '#333333';
                        lineColor = '#ffffff';
                        break;
                    case this.trackTypes.MOUNTAIN_PASS:
                        asphaltColor = '#555555';
                        lineColor = '#ffff00';
                        break;
                    case this.trackTypes.DESERT_DRIFT:
                        asphaltColor = '#bb9977';
                        lineColor = '#ffffff';
                        break;
                    default:
                        asphaltColor = '#444444';
                        lineColor = '#ffffff';
                }
                
                // Fill with asphalt color
                ctx.fillStyle = asphaltColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw road texture details
                ctx.fillStyle = asphaltColor;
                
                // Add some noise to the asphalt
                for (let i = 0; i < 20000; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 2 + 1;
                    const color = Math.random() * 30;
                    ctx.fillStyle = `rgb(${color + 40}, ${color + 40}, ${color + 40})`;
                    ctx.fillRect(x, y, size, size);
                }
                
                // Draw center dashed line
                ctx.fillStyle = lineColor;
                for (let y = 0; y < canvas.height; y += 40) {
                    ctx.fillRect(246, y, 20, 20);
                }
                
                // Draw side lines
                ctx.fillStyle = lineColor;
                ctx.fillRect(10, 0, 8, canvas.height);
                ctx.fillRect(canvas.width - 18, 0, 8, canvas.height);
                
                // Create texture from canvas
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                
                return texture;
            }
            
            generateRoadNormalMap(trackType) {
                // Create a canvas for the normal map
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');
                
                // Fill with neutral normal map color (128, 128, 255)
                ctx.fillStyle = 'rgb(128, 128, 255)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add some bumps to the road
                for (let i = 0; i < 5000; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 4 + 2;
                    
                    // Create a small circle for each bump
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                    gradient.addColorStop(0, 'rgb(140, 140, 255)'); // Slight bump
                    gradient.addColorStop(1, 'rgb(128, 128, 255)'); // Back to neutral
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // For desert track, add more pronounced bumps
                if (trackType === this.trackTypes.DESERT_DRIFT) {
                    for (let i = 0; i < 1000; i++) {
                        const x = Math.random() * canvas.width;
                        const y = Math.random() * canvas.height;
                        const size = Math.random() * 8 + 4;
                        
                        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                        gradient.addColorStop(0, 'rgb(160, 160, 255)'); // More pronounced bump
                        gradient.addColorStop(1, 'rgb(128, 128, 255)'); // Back to neutral
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                // Create texture from canvas
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                
                return texture;
            }
            
            generateStartFinishLine(track, scene) {
                const trackPoints = track.getTrackPoints();
                if (!trackPoints || trackPoints.length < 2) return;
                
                // Get start point and direction
                const startPoint = trackPoints[0];
                const dirToNext = new THREE.Vector3().subVectors(trackPoints[1], startPoint).normalize();
                
                // Perpendicular direction for width
                // const perpendicular = new THREE.Vector3(-dirToNext.z, 0, dirToNext.x);
                
                // Track width
                const trackWidth = 15;
                
                // Create start/finish line
                const lineWidth = trackWidth;
                const lineLength = 2;
                
                // Create geometry
                const lineGeometry = new THREE.PlaneGeometry(lineWidth, lineLength);
                
                // Create checker pattern texture
                const texture = this.generateStartLineTexture();
                
                // Create material
                const lineMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.8,
                    metalness: 0.2,
                    transparent: false,
                    side: THREE.DoubleSide
                });
                
                // Create mesh
                const startLineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
                
                // Position and rotate
                startLineMesh.position.copy(startPoint);
                startLineMesh.position.y += 0.05; // Slightly above track
                
                // Rotate to lie flat and align with track
                startLineMesh.rotation.x = -Math.PI / 2;
                startLineMesh.rotation.z = Math.atan2(dirToNext.x, dirToNext.z);
                
                // Add to scene
                startLineMesh.name = "startLine";
                scene.add(startLineMesh);
                
                // Store reference
                track.startLineMesh = startLineMesh;
            }
            
            generateStartLineTexture() {
                // Create a canvas for the checker pattern
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                
                // Draw checker pattern
                const squareSize = 32;
                for (let y = 0; y < canvas.height; y += squareSize) {
                    for (let x = 0; x < canvas.width; x += squareSize) {
                        const isEven = ((x / squareSize) + (y / squareSize)) % 2 === 0;
                        ctx.fillStyle = isEven ? '#ffffff' : '#000000';
                        ctx.fillRect(x, y, squareSize, squareSize);
                    }
                }
                
                // Create texture from canvas
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                
                return texture;
            }
            
            generateCheckpoints(track, scene) {
                const trackPoints = track.getTrackPoints();
                if (!trackPoints || trackPoints.length < 3) return;
                
                // Create checkpoints at regular intervals
                const totalCheckpoints = Math.max(8, trackPoints.length / 2);
                track.totalCheckpoints = totalCheckpoints;
                
                // Distribute checkpoints evenly along the track
                const checkpointMeshes = [];
                const checkpointPositions = [];
                
                // Use curve to get evenly spaced points
                const curve = new THREE.CatmullRomCurve3(trackPoints);
                curve.closed = true;
                
                for (let i = 0; i < totalCheckpoints; i++) {
                    // Get position along the curve
                    const t = i / totalCheckpoints;
                    const checkpointPosition = curve.getPoint(t);
                    
                    // Get direction at this point (tangent to curve)
                    // const tangent = curve.getTangent(t);
                    
                    // Store checkpoint position
                    checkpointPositions.push(checkpointPosition.clone());
                    
                    // Create a visual marker for debugging (invisible in final game)
                    const checkpointGeometry = new THREE.SphereGeometry(1, 16, 16);
                    const checkpointMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.0 // Invisible
                    });
                    
                    const checkpointMesh = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
                    checkpointMesh.position.copy(checkpointPosition);
                    checkpointMesh.name = `checkpoint_${i}`;
                    
                    scene.add(checkpointMesh);
                    checkpointMeshes.push(checkpointMesh);
                }
                
                // Store checkpoint data in track system
                track.checkpointMeshes = checkpointMeshes;
                track.checkpointPositions = checkpointPositions;
            }
            
            generateTrackBarriers(track, scene) {
                const trackPoints = track.getTrackPoints();
                if (!trackPoints || trackPoints.length < 2) return;
                
                // Create a curve from track points
                const curve = new THREE.CatmullRomCurve3(trackPoints);
                curve.closed = true;
                
                // Track width
                const trackWidth = 15;
                
                // Create barrier geometry and material based on track type
                let barrierGeometry, barrierMaterial;
                
                switch (track.type) {
                    case this.trackTypes.CIRCUIT_CITY:
                        // Concrete barriers for city track
                        barrierGeometry = new THREE.BoxGeometry(1, 1.5, 4);
                        barrierMaterial = new THREE.MeshStandardMaterial({
                            color: 0xcccccc,
                            roughness: 0.9,
                            metalness: 0.1
                        });
                        break;
                    case this.trackTypes.MOUNTAIN_PASS:
                        // Guardrails for mountain track
                        barrierGeometry = new THREE.BoxGeometry(0.2, 1, 4);
                        barrierMaterial = new THREE.MeshStandardMaterial({
                            color: 0xaaaaaa,
                            roughness: 0.6,
                            metalness: 0.8
                        });
                        break;
                    case this.trackTypes.DESERT_DRIFT:
                        // Tire stacks for desert track
                        barrierGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 16);
                        barrierMaterial = new THREE.MeshStandardMaterial({
                            color: 0x222222,
                            roughness: 0.9,
                            metalness: 0.1
                        });
                        break;
                    default:
                        // Default barriers
                        barrierGeometry = new THREE.BoxGeometry(0.5, 1, 2);
                        barrierMaterial = new THREE.MeshStandardMaterial({
                            color: 0x888888,
                            roughness: 0.8,
                            metalness: 0.2
                        });
                }
                
                // Create barriers along the track
                const barrierSegments = trackPoints.length * 5;
                const barriers = [];
                
                // Generate points along the curve
                const points = curve.getPoints(barrierSegments);
                
                // Create barriers on both sides of the track
                for (let i = 0; i < points.length; i += 4) { // Place barriers at intervals
                    const point = points[i];
                    const tangent = curve.getTangent(i / barrierSegments);
                    
                    // Perpendicular to tangent (normal to curve in XZ plane)
                    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
                    
                    // Left and right barrier positions
                    const leftPos = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(trackWidth / 2 + 1));
                    const rightPos = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(-trackWidth / 2 - 1));
                    
                    // Create left barrier
                    const leftBarrier = new THREE.Mesh(barrierGeometry.clone(), barrierMaterial.clone());
                    leftBarrier.position.copy(leftPos);
                    leftBarrier.position.y = barrierGeometry.parameters.height / 2; // Half height
                    
                    // Create right barrier
                    const rightBarrier = new THREE.Mesh(barrierGeometry.clone(), barrierMaterial.clone());
                    rightBarrier.position.copy(rightPos);
                    rightBarrier.position.y = barrierGeometry.parameters.height / 2; // Half height
                    
                    // Rotate to align with track
                    leftBarrier.rotation.y = Math.atan2(tangent.x, tangent.z);
                    rightBarrier.rotation.y = Math.atan2(tangent.x, tangent.z);
                    
                    // Add to scene
                    scene.add(leftBarrier);
                    scene.add(rightBarrier);
                    
                    // Store for collision detection
                    barriers.push(leftBarrier);
                    barriers.push(rightBarrier);
                }
                
                // Store barrier references in track system
                track.barriers = barriers;
            }
            
            generateCityEnvironment(track, scene) {
                // Add city buildings around the track
                const trackPoints = track.getTrackPoints();
                const trackBounds = this.calculateTrackBounds(trackPoints);
                
                // Extend bounds for city area
                const cityBounds = {
                    minX: trackBounds.minX - 150,
                    maxX: trackBounds.maxX + 150,
                    minZ: trackBounds.minZ - 150,
                    maxZ: trackBounds.maxZ + 150
                };
                
                // Generate city grid
                const gridSize = 40;
                const buildingGap = 5;
                const maxBuildingSize = 30;
                
                // Building materials
                const buildingMaterials = [
                    new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x111111, shininess: 30 }),
                    new THREE.MeshPhongMaterial({ color: 0x888888, specular: 0x111111, shininess: 30 }),
                    new THREE.MeshPhongMaterial({ color: 0x777777, specular: 0x111111, shininess: 30 }),
                    new THREE.MeshPhongMaterial({ color: 0x666666, specular: 0x111111, shininess: 30 }),
                ];
                
                // Window material (emissive for night effect)
                const windowMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffffcc,
                    specular: 0xffffff,
                    shininess: 100,
                    emissive: 0x999944,
                    emissiveIntensity: 0.2
                });
                
                // Create buildings
                for (let x = cityBounds.minX; x < cityBounds.maxX; x += gridSize) {
                    for (let z = cityBounds.minZ; z < cityBounds.maxZ; z += gridSize) {
                        // Skip if too close to track
                        if (this.isPointNearTrack(new THREE.Vector3(x, 0, z), trackPoints, 30)) {
                            continue;
                        }
                        
                        // Random building properties
                        const buildingWidth = Math.random() * 10 + maxBuildingSize - 10;
                        const buildingDepth = Math.random() * 10 + maxBuildingSize - 10;
                        const buildingHeight = Math.random() * 30 + 20;
                        
                        // Random position within grid cell
                        const posX = x + Math.random() * (gridSize - buildingWidth - buildingGap);
                        const posZ = z + Math.random() * (gridSize - buildingDepth - buildingGap);
                        
                        // Create building
                        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
                        const buildingMaterial = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
                        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                        
                        // Position building
                        building.position.set(posX, buildingHeight / 2, posZ);
                        
                        // Add windows
                        this.addWindowsToBuilding(building, buildingWidth, buildingHeight, buildingDepth, windowMaterial);
                        
                        // Add to scene
                        scene.add(building);
                    }
                }
                
                // Add ground plane
                const groundSize = Math.max(
                    cityBounds.maxX - cityBounds.minX,
                    cityBounds.maxZ - cityBounds.minZ
                ) * 1.5;
                
                const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
                const groundMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const ground = new THREE.Mesh(groundGeometry, groundMaterial);
                ground.rotation.x = -Math.PI / 2;
                ground.position.y = -0.1;
                ground.receiveShadow = true;
                scene.add(ground);
                
                // Add streetlights
                this.addStreetlights(track, scene);
            }
            
            generateMountainEnvironment(track, scene) {
                const trackPoints = track.getTrackPoints();
                const trackBounds = this.calculateTrackBounds(trackPoints);
                
                // Extended environment area
                const envBounds = {
                    minX: trackBounds.minX - 300,
                    maxX: trackBounds.maxX + 300,
                    minZ: trackBounds.minZ - 300,
                    maxZ: trackBounds.maxZ + 300
                };
                
                // Create terrain
                const terrainResolution = 256;
                const terrainSize = Math.max(
                    envBounds.maxX - envBounds.minX,
                    envBounds.maxZ - envBounds.minZ
                ) * 1.2;
                
                const terrainGeometry = new THREE.PlaneGeometry(
                    terrainSize, terrainSize, terrainResolution - 1, terrainResolution - 1
                );
                
                // Generate heightmap
                const heightMap = this.generateMountainHeightMap(terrainResolution, trackPoints);
                
                // Apply heightmap to terrain
                const vertices = terrainGeometry.attributes.position.array;
                const halfSize = terrainSize / 2;
                
                for (let i = 0; i < vertices.length; i += 3) {
                    // Get normalized position in heightmap
                    const x = Math.floor(((vertices[i] + halfSize) / terrainSize) * (terrainResolution - 1));
                    const z = Math.floor(((vertices[i + 2] + halfSize) / terrainSize) * (terrainResolution - 1));
                    
                    // Clamp to valid heightmap indices
                    const xClamped = THREE.MathUtils.clamp(x, 0, terrainResolution - 1);
                    const zClamped = THREE.MathUtils.clamp(z, 0, terrainResolution - 1);
                    
                    // Apply height
                    const height = heightMap[zClamped * terrainResolution + xClamped];
                    vertices[i + 1] = height;
                }
                
                // Update geometry
                terrainGeometry.attributes.position.needsUpdate = true;
                terrainGeometry.computeVertexNormals();
                
                // Create terrain material with texture
                const terrainMaterial = new THREE.MeshStandardMaterial({
                    color: 0x336633,
                    roughness: 0.9,
                    metalness: 0.1,
                    flatShading: false
                });
                
                // Create terrain mesh
                const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
                terrain.rotation.x = -Math.PI / 2;
                terrain.position.y = -0.5;
                terrain.receiveShadow = true;
                scene.add(terrain);
                
                // Add trees
                this.addTrees(track, scene, heightMap, terrainResolution, terrainSize);
                
                // Add mountain peaks
                this.addMountainPeaks(scene, trackBounds);
                
                // Add rocks
                this.addRocks(scene, trackBounds);
            }
            
            generateDesertEnvironment(track, scene) {
                const trackPoints = track.getTrackPoints();
                const trackBounds = this.calculateTrackBounds(trackPoints);
                
                // Extended environment area
                const envBounds = {
                    minX: trackBounds.minX - 250,
                    maxX: trackBounds.maxX + 250,
                    minZ: trackBounds.minZ - 250,
                    maxZ: trackBounds.maxZ + 250
                };
                
                // Create desert terrain
                const terrainSize = Math.max(
                    envBounds.maxX - envBounds.minX,
                    envBounds.maxZ - envBounds.minZ
                ) * 1.2;
                
                const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 100, 100);
                
                // Generate desert dunes
                const vertices = terrainGeometry.attributes.position.array;
                
                for (let i = 0; i < vertices.length; i += 3) {
                    const x = vertices[i];
                    const z = vertices[i + 2];
                    
                    // Generate smooth rolling dunes
                    const duneHeight = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 5;
                    const smallDunes = (Math.sin(x * 0.05) * Math.cos(z * 0.05)) * 2;
                    
                    // Avoid dunes on the track
                    const closestTrackPointDist = this.getMinDistanceToTrack(new THREE.Vector3(x, 0, z), trackPoints);
                    const trackFactor = Math.min(1, Math.max(0, (closestTrackPointDist - 10) / 20));
                    
                    // Final height
                    vertices[i + 1] = (duneHeight + smallDunes) * trackFactor;
                }
                
                // Update geometry
                terrainGeometry.attributes.position.needsUpdate = true;
                terrainGeometry.computeVertexNormals();
                
                // Create desert material
                const desertTexture = this.generateDesertTexture();
                
                const desertMaterial = new THREE.MeshStandardMaterial({
                    color: 0xddbb77,
                    roughness: 0.9,
                    metalness: 0.1,
                    map: desertTexture
                });
                
                // Create terrain mesh
                const terrain = new THREE.Mesh(terrainGeometry, desertMaterial);
                terrain.rotation.x = -Math.PI / 2;
                terrain.position.y = -0.5;
                terrain.receiveShadow = true;
                scene.add(terrain);
                
                // Add cacti and desert plants
                this.addDesertPlants(scene, trackPoints);
                
                // Add large rock formations
                this.addDesertRockFormations(scene, trackBounds);
            }
            
            generateDesertTexture() {
                // Create a canvas for the desert texture
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');
                
                // Base sand color
                ctx.fillStyle = '#ddbb77';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add noise for sand grains
                for (let i = 0; i < 100000; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 2 + 0.5;
                    
                    // Random sand grain color
                    const bright = Math.random() * 20;
                    ctx.fillStyle = `rgb(${221 + bright}, ${187 + bright}, ${119 + bright})`;
                    ctx.fillRect(x, y, size, size);
                }
                
                // Add some darker patches
                for (let i = 0; i < 200; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 40 + 20;
                    
                    ctx.fillStyle = 'rgba(160, 140, 100, 0.1)';
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Create texture from canvas
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(10, 10);
                
                return texture;
            }
            
            generateMountainHeightMap(resolution, trackPoints) {
                // Create empty heightmap array
                const heightMap = new Array(resolution * resolution).fill(0);
                
                // Generate perlin noise for mountains
                const simplex = new SimplexNoise();
                
                for (let z = 0; z < resolution; z++) {
                    for (let x = 0; x < resolution; x++) {
                        // Normalized coordinates
                        const nx = x / resolution - 0.5;
                        const nz = z / resolution - 0.5;
                        
                        // Multi-octave noise for natural terrain
                        const frequency = 2;
                        let height = 0;
                        
                        height += simplex.noise(nx * frequency, nz * frequency) * 30;
                        height += simplex.noise(nx * frequency * 2, nz * frequency * 2) * 15;
                        height += simplex.noise(nx * frequency * 4, nz * frequency * 4) * 7.5;
                        
                        // Store height
                        heightMap[z * resolution + x] = height;
                    }
                }
                
                // Flatten terrain around track
                for (let z = 0; z < resolution; z++) {
                    for (let x = 0; x < resolution; x++) {
                        // Convert heightmap coordinates to world space
                        const worldX = (x / resolution - 0.5) * 1000;
                        const worldZ = (z / resolution - 0.5) * 1000;
                        const point = new THREE.Vector3(worldX, 0, worldZ);
                        
                        // Find minimum distance to track
                        const minDist = this.getMinDistanceToTrack(point, trackPoints);
                        
                        // Flatten terrain near track (50 units away)
                        if (minDist < 30) {
                            // Get track height at nearest point
                            const trackHeight = this.getTrackHeightAt(point, trackPoints);
                            
                            // Completely flatten
                            heightMap[z * resolution + x] = trackHeight;
                        } else if (minDist < 50) {
                            // Blend between track height and terrain height
                            const trackHeight = this.getTrackHeightAt(point, trackPoints);
                            const terrainHeight = heightMap[z * resolution + x];
                            const blend = (minDist - 30) / 20; // 0 at 30 units, 1 at 50 units
                            
                            heightMap[z * resolution + x] = terrainHeight * blend + trackHeight * (1 - blend);
                        }
                    }
                }
                
                return heightMap;
            }
            
            calculateTrackBounds(trackPoints) {
                // Calculate bounds of track for environment generation
                let minX = Infinity;
                let maxX = -Infinity;
                let minZ = Infinity;
                let maxZ = -Infinity;
                
                trackPoints.forEach(point => {
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minZ = Math.min(minZ, point.z);
                    maxZ = Math.max(maxZ, point.z);
                });
                
                return { minX, maxX, minZ, maxZ };
            }
            
            isPointNearTrack(point, trackPoints, threshold) {
                // Check if a point is within threshold distance of any track point
                for (let i = 0; i < trackPoints.length; i++) {
                    const dist = point.distanceTo(trackPoints[i]);
                    if (dist < threshold) {
                        return true;
                    }
                }
                
                return false;
            }
            
            getMinDistanceToTrack(point, trackPoints) {
                // Find minimum distance from point to any track segment
                let minDist = Infinity;
                
                for (let i = 0; i < trackPoints.length; i++) {
                    const p1 = trackPoints[i];
                    const p2 = trackPoints[(i + 1) % trackPoints.length];
                    
                    // Calculate distance to line segment
                    const dist = this.distanceToLineSegment(point, p1, p2);
                    minDist = Math.min(minDist, dist);
                }
                
                return minDist;
            }
            
            distanceToLineSegment(point, lineStart, lineEnd) {
                // Calculate distance from point to line segment
                const lineVector = new THREE.Vector3().subVectors(lineEnd, lineStart);
                const pointVector = new THREE.Vector3().subVectors(point, lineStart);
                
                // Project point onto line
                const lineLength = lineVector.length();
                lineVector.normalize();
                const projection = pointVector.dot(lineVector);
                
                // Clamp projection to line segment
                const clampedProjection = THREE.MathUtils.clamp(projection, 0, lineLength);
                
                // Calculate closest point on line
                const closest = new THREE.Vector3().copy(lineStart).add(
                    lineVector.multiplyScalar(clampedProjection)
                );
                
                // Return distance
                return point.distanceTo(closest);
            }
            
            getTrackHeightAt(point, trackPoints) {
                // Find height of track at closest point
                let minDist = Infinity;
                let height = 0;
                
                for (let i = 0; i < trackPoints.length; i++) {
                    const p = trackPoints[i];
                    const dist = new THREE.Vector2(point.x, point.z).distanceTo(
                        new THREE.Vector2(p.x, p.z)
                    );
                    
                    if (dist < minDist) {
                        minDist = dist;
                        height = p.y;
                    }
                }
                
                return height;
            }
            
            addWindowsToBuilding(building, width, height, depth, windowMaterial) {
                // Add windows to building sides
                const windowSize = 1.5;
                const windowSpacing = 3;
                const windowInset = 0.1;
                
                // Calculate number of windows per floor
                const widthWindows = Math.floor(width / windowSpacing) - 1;
                const depthWindows = Math.floor(depth / windowSpacing) - 1;
                const floors = Math.floor(height / windowSpacing) - 1;
                
                // Window geometry
                const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowInset);
                
                // Add windows to front and back
                for (let floor = 1; floor <= floors; floor++) {
                    const y = floor * windowSpacing - height / 2;
                    
                    for (let i = 1; i <= widthWindows; i++) {
                        const x = i * windowSpacing - width / 2;
                        
                        // Front windows
                        const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                        frontWindow.position.set(x, y, depth / 2 + windowInset / 2);
                        building.add(frontWindow);
                        
                        // Back windows
                        const backWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                        backWindow.position.set(x, y, -depth / 2 - windowInset / 2);
                        backWindow.rotation.y = Math.PI;
                        building.add(backWindow);
                    }
                }
                
                // Add windows to sides
                for (let floor = 1; floor <= floors; floor++) {
                    const y = floor * windowSpacing - height / 2;
                    
                    for (let i = 1; i <= depthWindows; i++) {
                        const z = i * windowSpacing - depth / 2;
                        
                        // Left windows
                        const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                        leftWindow.position.set(-width / 2 - windowInset / 2, y, z);
                        leftWindow.rotation.y = -Math.PI / 2;
                        building.add(leftWindow);
                        
                        // Right windows
                        const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                        rightWindow.position.set(width / 2 + windowInset / 2, y, z);
                        rightWindow.rotation.y = Math.PI / 2;
                        building.add(rightWindow);
                    }
                }
            }
            
            addStreetlights(track, scene) {
                const trackPoints = track.getTrackPoints();
                if (!trackPoints || trackPoints.length < 2) return;
                
                // Create a curve from track points
                const curve = new THREE.CatmullRomCurve3(trackPoints);
                curve.closed = true;
                
                // Track width
                const trackWidth = 15;
                
                // Create streetlight geometry and materials
                const poleMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.7,
                    metalness: 0.5
                });
                
                const lightMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffee,
                    emissive: 0xffffee,
                    emissiveIntensity: 1,
                    roughness: 0.3,
                    metalness: 0.8
                });
                
                // Create streetlights along the track
                const numLights = trackPoints.length * 2;
                const streetlights = [];
                
                for (let i = 0; i < numLights; i++) {
                    // Get position along the curve
                    const t = i / numLights;
                    const position = curve.getPoint(t);
                    const tangent = curve.getTangent(t);
                    
                    // Perpendicular to tangent
                    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
                    
                    // Position on left side of track
                    const lightPos = position.clone().add(normal.clone().multiplyScalar(trackWidth / 2 + 3));
                    
                    // Create streetlight
                    const streetlight = new THREE.Group();
                    
                    // Pole
                    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 7, 8);
                    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                    pole.position.y = 3.5;
                    streetlight.add(pole);
                    
                    // Arm
                    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
                    const arm = new THREE.Mesh(armGeometry, poleMaterial);
                    arm.position.set(0, 6.5, 1);
                    arm.rotation.x = Math.PI / 2;
                    streetlight.add(arm);
                    
                    // Light fixture
                    const fixtureGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.5, 8);
                    const fixture = new THREE.Mesh(fixtureGeometry, poleMaterial);
                    fixture.position.set(0, 6.5, 2);
                    streetlight.add(fixture);
                    
                    // Light
                    const lightGeometry = new THREE.SphereGeometry(0.2, 16, 8);
                    const light = new THREE.Mesh(lightGeometry, lightMaterial);
                    light.position.set(0, 6.3, 2);
                    streetlight.add(light);
                    
                    // Position and rotate streetlight
                    streetlight.position.copy(lightPos);
                    streetlight.rotation.y = Math.atan2(tangent.x, tangent.z);
                    
                    // Add to scene
                    scene.add(streetlight);
                    streetlights.push(streetlight);
                    
                    // Add actual light source
                    const pointLight = new THREE.PointLight(0xffffee, 0.8, 20);
                    pointLight.position.set(0, 6.3, 2);
                    streetlight.add(pointLight);
                }
                
                // Store streetlights reference
                track.streetlights = streetlights;
            }
            
            addTrees(track, scene, heightMap, resolution, terrainSize) {
                const trackPoints = track.getTrackPoints();
                const treeCount = 200;
                const trees = [];
                
                // Create tree materials
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8B4513,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const leafMaterial = new THREE.MeshStandardMaterial({
                    color: 0x226622,
                    roughness: 0.9,
                    metalness: 0
                });
                
                for (let i = 0; i < treeCount; i++) {
                    // Random position within terrain bounds
                    const x = (Math.random() - 0.5) * terrainSize;
                    const z = (Math.random() - 0.5) * terrainSize;
                    
                    // Skip if too close to track
                    if (this.isPointNearTrack(new THREE.Vector3(x, 0, z), trackPoints, 30)) {
                        continue;
                    }
                    
                    // Get height at this position from heightmap
                    const heightMapX = Math.floor(((x + terrainSize / 2) / terrainSize) * (resolution - 1));
                    const heightMapZ = Math.floor(((z + terrainSize / 2) / terrainSize) * (resolution - 1));
                    
                    const xClamped = THREE.MathUtils.clamp(heightMapX, 0, resolution - 1);
                    const zClamped = THREE.MathUtils.clamp(heightMapZ, 0, resolution - 1);
                    
                    const y = heightMap[zClamped * resolution + xClamped];
                    
                    // Create tree
                    const tree = new THREE.Group();
                    
                    // Trunk
                    const trunkHeight = Math.random() * 2 + 3;
                    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.4, trunkHeight, 8);
                    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                    trunk.position.y = trunkHeight / 2;
                    tree.add(trunk);
                    
                    // Leaves (random between cone and sphere shapes)
                    const leafShape = Math.random() > 0.5 ? 'cone' : 'sphere';
                    let leaves;
                    
                    if (leafShape === 'cone') {
                        const leafGeometry = new THREE.ConeGeometry(1.5, 3, 8);
                        leaves = new THREE.Mesh(leafGeometry, leafMaterial);
                        leaves.position.y = trunkHeight + 1;
                    } else {
                        const leafGeometry = new THREE.SphereGeometry(1.5, 8, 8);
                        leaves = new THREE.Mesh(leafGeometry, leafMaterial);
                        leaves.position.y = trunkHeight + 0.5;
                        leaves.scale.y = 1.2;
                    }
                    
                    tree.add(leaves);
                    
                    // Position tree
                    tree.position.set(x, y, z);
                    
                    // Random rotation for variation
                    tree.rotation.y = Math.random() * Math.PI * 2;
                    
                    // Random scale for variety
                    const scale = Math.random() * 0.5 + 0.8;
                    tree.scale.set(scale, scale, scale);
                    
                    // Add to scene
                    scene.add(tree);
                    trees.push(tree);
                }
                
                // Store trees reference
                track.trees = trees;
            }
            
            addMountainPeaks(scene, trackBounds) {
                // Add distant mountain peaks
                const mountainCount = 8;
                const mountainDistance = 1000;
                
                // Mountain material
                const mountainMaterial = new THREE.MeshStandardMaterial({
                    color: 0x666666,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                // Get track center
                const centerX = (trackBounds.minX + trackBounds.maxX) / 2;
                const centerZ = (trackBounds.minZ + trackBounds.maxZ) / 2;
                
                for (let i = 0; i < mountainCount; i++) {
                    // Position in a circle around the track
                    const angle = (i / mountainCount) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * mountainDistance;
                    const z = centerZ + Math.sin(angle) * mountainDistance;
                    
                    // Create mountain peak
                    const mountainHeight = Math.random() * 300 + 200;
                    const mountainRadius = Math.random() * 200 + 150;
                    
                    const mountainGeometry = new THREE.ConeGeometry(mountainRadius, mountainHeight, 8);
                    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
                    
                    // Position mountain
                    mountain.position.set(x, mountainHeight / 2 - 50, z);
                    
                    // Add to scene
                    scene.add(mountain);
                }
            }
            
            addRocks(scene, trackBounds) {
                // Add rock formations
                const rockCount = 30;
                
                // Get extended track area
                const minX = trackBounds.minX - 50;
                const maxX = trackBounds.maxX + 50;
                const minZ = trackBounds.minZ - 50;
                const maxZ = trackBounds.maxZ + 50;
                
                // Rock material
                const rockMaterial = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                for (let i = 0; i < rockCount; i++) {
                    // Random position within extended track area
                    const x = minX + Math.random() * (maxX - minX);
                    const z = minZ + Math.random() * (maxZ - minZ);
                    
                    // Create rock (use dodecahedron for angular rock look)
                    const rockSize = Math.random() * 5 + 2;
                    const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
                    
                    // Apply random deformations for less perfect shape
                    const vertices = rockGeometry.attributes.position.array;
                    for (let j = 0; j < vertices.length; j += 3) {
                        vertices[j] += (Math.random() - 0.5) * rockSize * 0.2;
                        vertices[j + 1] += (Math.random() - 0.5) * rockSize * 0.2;
                        vertices[j + 2] += (Math.random() - 0.5) * rockSize * 0.2;
                    }
                    rockGeometry.attributes.position.needsUpdate = true;
                    rockGeometry.computeVertexNormals();
                    
                    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                    
                    // Position rock
                    rock.position.set(x, rockSize / 2, z);
                    
                    // Random rotation
                    rock.rotation.x = Math.random() * Math.PI;
                    rock.rotation.y = Math.random() * Math.PI;
                    rock.rotation.z = Math.random() * Math.PI;
                    
                    // Add to scene
                    scene.add(rock);
                }
            }
            
            addDesertPlants(scene, trackPoints) {
                const plantCount = 100;
                
                // Cactus material
                const cactusMaterial = new THREE.MeshStandardMaterial({
                    color: 0x116611,
                    roughness: 0.9,
                    metalness: 0
                });
                
                for (let i = 0; i < plantCount; i++) {
                    // Random position within terrain bounds
                    const x = (Math.random() - 0.5) * 1000;
                    const z = (Math.random() - 0.5) * 1000;
                    
                    // Skip if too close to track
                    if (this.isPointNearTrack(new THREE.Vector3(x, 0, z), trackPoints, 30)) {
                        continue;
                    }
                    
                    // Create plant (randomly choose cactus type)
                    const plantType = Math.floor(Math.random() * 3);
                    const plant = new THREE.Group();
                    
                    if (plantType === 0) {
                        // Saguaro cactus
                        const trunkHeight = Math.random() * 3 + 6;
                        const trunkGeometry = new THREE.CylinderGeometry(0.6, 0.8, trunkHeight, 8);
                        const trunk = new THREE.Mesh(trunkGeometry, cactusMaterial);
                        trunk.position.y = trunkHeight / 2;
                        plant.add(trunk);
                        
                        // Add arms
                        const armCount = Math.floor(Math.random() * 3) + 1;
                        for (let j = 0; j < armCount; j++) {
                            const armHeight = Math.random() * 2 + 3;
                            const armGeometry = new THREE.CylinderGeometry(0.4, 0.5, armHeight, 8);
                            const arm = new THREE.Mesh(armGeometry, cactusMaterial);
                            
                            // Position arm on trunk
                            const height = Math.random() * (trunkHeight * 0.6) + trunkHeight * 0.3;
                            const angle = Math.random() * Math.PI * 2;
                            
                            arm.position.set(
                                Math.cos(angle) * 0.8,
                                height,
                                Math.sin(angle) * 0.8
                            );
                            
                            // Rotate arm outward
                            arm.rotation.x = Math.PI / 4;
                            arm.rotation.y = angle;
                            
                            plant.add(arm);
                        }
                    } else if (plantType === 1) {
                        // Barrel cactus
                        const cactusGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
                        const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
                        cactus.position.y = 1;
                        plant.add(cactus);
                    } else {
                        // Prickly pear cactus (made of flattened spheres)
                        const padCount = Math.floor(Math.random() * 5) + 3;
                        
                        for (let j = 0; j < padCount; j++) {
                            const padGeometry = new THREE.SphereGeometry(1, 16, 16);
                            padGeometry.scale(1, 0.3, 1.3);
                            
                            const pad = new THREE.Mesh(padGeometry, cactusMaterial);
                            
                            // Position and rotate randomly
                            const angle = (j / padCount) * Math.PI * 2;
                            const radius = Math.random() * 0.5 + 0.3;
                            
                            pad.position.set(
                                Math.cos(angle) * radius,
                                1 + Math.random() * 1.5,
                                Math.sin(angle) * radius
                            );
                            
                            pad.rotation.y = angle;
                            pad.rotation.z = Math.random() * Math.PI / 4;
                            
                            plant.add(pad);
                        }
                    }
                    
                    // Position plant
                    plant.position.set(x, 0, z);
                    
                    // Random rotation for variation
                    plant.rotation.y = Math.random() * Math.PI * 2;
                    
                    // Random scale for variety
                    const scale = Math.random() * 0.5 + 0.8;
                    plant.scale.set(scale, scale, scale);
                    
                    // Add to scene
                    scene.add(plant);
                }
            }
            
            addDesertRockFormations(scene, trackBounds) {
                // Add larger rock formations
                const formationCount = 15;
                
                // Get extended track area
                const minX = trackBounds.minX - 150;
                const maxX = trackBounds.maxX + 150;
                const minZ = trackBounds.minZ - 150;
                const maxZ = trackBounds.maxZ + 150;
                
                // Rock materials (for variety)
                const rockMaterials = [
                    new THREE.MeshStandardMaterial({
                        color: 0xAA8866,
                        roughness: 0.9,
                        metalness: 0.1
                    }),
                    new THREE.MeshStandardMaterial({
                        color: 0xBB9977,
                        roughness: 0.8,
                        metalness: 0.1
                    }),
                    new THREE.MeshStandardMaterial({
                        color: 0xCC9966,
                        roughness: 0.7,
                        metalness: 0.1
                    })
                ];
                
                for (let i = 0; i < formationCount; i++) {
                    // Random position outside track area
                    let x, z;
                    let tooClose = true;
                    
                    // Keep trying until we find a spot far enough from track
                    while (tooClose) {
                        x = minX + Math.random() * (maxX - minX);
                        z = minZ + Math.random() * (maxZ - minZ);
                        
                        // Check distance to track bounding box
                        const dx = Math.max(minX - x, 0, x - maxX);
                        const dz = Math.max(minZ - z, 0, z - maxZ);
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        
                        tooClose = distance < 50;
                    }
                    
                    // Create rock formation
                    const formation = new THREE.Group();
                    
                    // Add several rocks in a cluster
                    const rockCount = Math.floor(Math.random() * 5) + 3;
                    
                    for (let j = 0; j < rockCount; j++) {
                        // Randomize rock properties
                        const rockSize = Math.random() * 6 + 4;
                        
                        // Create irregular rock shape
                        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 1);
                        
                        // Deform for more natural look
                        const vertices = rockGeometry.attributes.position.array;
                        for (let k = 0; k < vertices.length; k += 3) {
                            vertices[k] += (Math.random() - 0.5) * rockSize * 0.3;
                            vertices[k + 1] += (Math.random() - 0.5) * rockSize * 0.3;
                            vertices[k + 2] += (Math.random() - 0.5) * rockSize * 0.3;
                        }
                        rockGeometry.attributes.position.needsUpdate = true;
                        rockGeometry.computeVertexNormals();
                        
                        // Random material for variety
                        const rockMaterial = rockMaterials[Math.floor(Math.random() * rockMaterials.length)];
                        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                        
                        // Position within cluster
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * rockSize;
                        
                        rock.position.set(
                            Math.cos(angle) * radius,
                            rockSize / 2 - Math.random() * 2,
                            Math.sin(angle) * radius
                        );
                        
                        // Random rotation
                        rock.rotation.x = Math.random() * Math.PI;
                        rock.rotation.y = Math.random() * Math.PI;
                        rock.rotation.z = Math.random() * Math.PI;
                        
                        formation.add(rock);
                    }
                    
                    // Position formation
                    formation.position.set(x, 0, z);
                    
                    // Add to scene
                    scene.add(formation);
                }
            }
        }
        
        // Track system class
        class TrackSystem {
            constructor() {
                this.trackPoints = [];
                this.trackWidth = 15;
                this.startPosition = new THREE.Vector3(0, 0, 0);
                this.startRotation = 0;
                this.trackMesh = null;
                this.startLineMesh = null;
                this.checkpointPositions = [];
                this.checkpointMeshes = [];
                this.barriers = [];
                this.totalCheckpoints = 0;
                this.totalLaps = 3;
                this.name = "Default Track";
                this.type = 0;
            }
            
            setTrackPoints(points) {
                this.trackPoints = points;
                
                // Set start position and rotation at first point
                if (points.length > 1) {
                    this.startPosition = points[0].clone();
                    this.startPosition.y += 0.5; // Lift off ground slightly
                    
                    // Calculate initial rotation (direction to next point)
                    const direction = new THREE.Vector3().subVectors(points[1], points[0]).normalize();
                    this.startRotation = Math.atan2(direction.x, direction.z);
                }
            }
            
            getTrackPoints() {
                return this.trackPoints;
            }
            
            getStartPosition() {
                return this.startPosition;
            }
            
            getStartRotation() {
                return this.startRotation;
            }
            
            checkVehicleCheckpoint(vehicle) {
                // Check which checkpoint the vehicle is at
                const checkpointThreshold = 15;
                
                // Skip if no checkpoints
                if (!this.checkpointPositions || this.checkpointPositions.length === 0) {
                    return { checkpoint: 0, progress: 0 };
                }
                
                // Check distance to current and next checkpoints
                const currentCheckpoint = vehicle.checkpoint;
                const nextCheckpoint = (currentCheckpoint + 1) % this.totalCheckpoints;
                
                const distToCurrent = vehicle.position.distanceTo(this.checkpointPositions[currentCheckpoint]);
                const distToNext = vehicle.position.distanceTo(this.checkpointPositions[nextCheckpoint]);
                
                // Calculate progress within current segment
                let progress = 0;
                if (distToCurrent + distToNext > 0) {
                    progress = distToCurrent / (distToCurrent + distToNext);
                }
                
                // Check if vehicle has reached next checkpoint
                if (distToNext < checkpointThreshold) {
                    return { checkpoint: nextCheckpoint, progress };
                }
                
                // Still at current checkpoint
                return { checkpoint: currentCheckpoint, progress };
            }
            
            getAIWaypoints() {
                // Simplified waypoints for AI (just use checkpoint positions)
                return this.checkpointPositions;
            }
            
            getTrackLength() {
                let length = 0;
                
                // Calculate total track length
                for (let i = 0; i < this.trackPoints.length; i++) {
                    const p1 = this.trackPoints[i];
                    const p2 = this.trackPoints[(i + 1) % this.trackPoints.length];
                    length += p1.distanceTo(p2);
                }
                
                return length;
            }
        }
        
        // SimplexNoise class for terrain generation
        class SimplexNoise {
            constructor() {
                this.grad3 = [
                    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
                    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
                    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
                ];
                
                this.p = [];
                for (let i = 0; i < 256; i++) {
                    this.p[i] = Math.floor(Math.random() * 256);
                }
                
                // To remove the need for index wrapping, double the permutation table length
                this.perm = [];
                for (let i = 0; i < 512; i++) {
                    this.perm[i] = this.p[i & 255];
                }
            }
            
            dot(g, x, y) {
                return g[0] * x + g[1] * y;
            }
            
            noise(xin, yin) {
                // Noise contributions from the three corners
                let n0, n1, n2;
                
                // Skew the input space to determine which simplex cell we're in
                const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
                const s = (xin + yin) * F2; // Hairy factor for 2D
                const i = Math.floor(xin + s);
                const j = Math.floor(yin + s);
                
                const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
                const t = (i + j) * G2;
                const X0 = i - t; // Unskew the cell origin back to (x,y) space
                const Y0 = j - t;
                const x0 = xin - X0; // The x,y distances from the cell origin
                const y0 = yin - Y0;
                
                // For the 2D case, the simplex shape is an equilateral triangle.
                // Determine which simplex we are in.
                let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
                if (x0 > y0) {
                    i1 = 1;
                    j1 = 0;
                } else { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
                    i1 = 0;
                    j1 = 1;
                } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
                
                // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
                // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
                // c = (3-sqrt(3))/6
                const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
                const y1 = y0 - j1 + G2;
                const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
                const y2 = y0 - 1.0 + 2.0 * G2;
                
                // Work out the hashed gradient indices of the three simplex corners
                const ii = i & 255;
                const jj = j & 255;
                const gi0 = this.perm[ii + this.perm[jj]] % 12;
                const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
                const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
                
                // Calculate the contribution from the three corners
                let t0 = 0.5 - x0 * x0 - y0 * y0;
                if (t0 < 0) {
                    n0 = 0.0;
                } else {
                    t0 *= t0;
                    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); // (x,y) of grad3 used for 2D gradient
                }
                
                let t1 = 0.5 - x1 * x1 - y1 * y1;
                if (t1 < 0) {
                    n1 = 0.0;
                } else {
                    t1 *= t1;
                    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
                }
                
                let t2 = 0.5 - x2 * x2 - y2 * y2;
                if (t2 < 0) {
                    n2 = 0.0;
                } else {
                    t2 *= t2;
                    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
                }
                
                // Add contributions from each corner to get the final noise value.
                // The result is scaled to return values in the interval [-1,1].
                return 70.0 * (n0 + n1 + n2);
            }
        }
        
        // Main Game class
        class Game {
            constructor() {
                // Game state
                this.gameState = new GameState();
                
                // Input
                this.inputManager = new InputManager();
                
                // Audio
                this.soundManager = new SoundManager();
                
                // Scene setup
                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new THREE.WebGLRenderer({ antialias: true });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                document.getElementById('game-container').appendChild(this.renderer.domElement);
                
                // Rendering settings
                this.renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                
                // Camera settings
                this.cameraOffset = new THREE.Vector3(0, 7, -15);
                this.cameraLookAt = new THREE.Vector3(0, 0, 10);
                this.smoothCameraFactor = 0.1;
                
                // Current track
                this.track = null;
                
                // Vehicles
                this.playerVehicle = null;
                this.aiVehicles = [];
                
                // Race
                this.raceStartTime = 0;
                this.raceTimer = 0;
                this.countdown = 3;
                this.countdownTimer = 0;
                this.countdownElement = document.getElementById('countdown');
                
                // Game objects
                this.minimap = null;
                
                // Timing
                this.clock = new THREE.Clock();
                this.deltaTime = 0;
                this.lastTime = 0;
                
                // Setup
                this.init();
            }
            
            init() {
                // Setup event listeners
                window.addEventListener('resize', () => this.onWindowResize());
                this.setupEventListeners();
                
                // Initialize game elements
                this.setupLighting();
                this.initMinimap();
                
                // Start loading process
                this.gameState.changeState(this.gameState.states.LOADING);
                this.loadGame();
                
                // Start game loop
                this.animate();
            }
            
            setupEventListeners() {
                // Main menu buttons
                document.getElementById('start-game-btn').addEventListener('click', () => this.startRace());
                
                // Track selection
                document.querySelectorAll('.track-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        const trackId = parseInt(e.currentTarget.dataset.track);
                        this.selectTrack(trackId);
                    });
                });
                
                // Car selection
                document.querySelectorAll('.car-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        const carId = parseInt(e.currentTarget.dataset.car);
                        this.selectCar(carId);
                    });
                });
                
                // Race results screen
                document.getElementById('restart-btn').addEventListener('click', () => this.restartRace());
                document.getElementById('menu-btn').addEventListener('click', () => this.returnToMenu());
                
                // Pause menu
                document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
                document.getElementById('resume-btn').addEventListener('click', () => this.resumeRace());
                document.getElementById('restart-pause-btn').addEventListener('click', () => this.restartRace());
                document.getElementById('menu-pause-btn').addEventListener('click', () => this.returnToMenu());
            }
            
            setupLighting() {
                // Ambient light
                this.ambientLight = new THREE.AmbientLight(0x666666, 0.7);
                this.scene.add(this.ambientLight);
                
                // Directional light (sun)
                this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                this.directionalLight.position.set(50, 100, 0);
                this.directionalLight.castShadow = true;
                
                // Optimize shadow map
                this.directionalLight.shadow.mapSize.width = 2048;
                this.directionalLight.shadow.mapSize.height = 2048;
                this.directionalLight.shadow.camera.near = 0.5;
                this.directionalLight.shadow.camera.far = 500;
                this.directionalLight.shadow.camera.left = -150;
                this.directionalLight.shadow.camera.right = 150;
                this.directionalLight.shadow.camera.top = 150;
                this.directionalLight.shadow.camera.bottom = -150;
                
                this.scene.add(this.directionalLight);
            }
            
            loadGame() {
                // Simulate loading process
                let progress = 0;
                const loadingInterval = setInterval(() => {
                    progress += 0.1;
                    this.gameState.updateLoadingProgress(progress);
                    
                    if (progress >= 1) {
                        clearInterval(loadingInterval);
                        this.setupMainMenuScene();
                    }
                }, 200);
            }
            
            setupMainMenuScene() {
                // Clear any existing scene elements
                while (this.scene.children.length > 0) {
                    this.scene.remove(this.scene.children[0]);
                }
                
                // Re-add lights
                this.setupLighting();
                
                // Setup camera for menu view
                this.camera.position.set(10, 5, 10);
                this.camera.lookAt(0, 0, 0);
                
                // Generate track for background
                const trackGenerator = new TrackGenerator();
                this.track = trackGenerator.generateTrack(0, this.scene);
                
                // Setup car previews in menu
                this.setupCarPreviews();
                
              
                
                // Create simple orbit controls for menu scene
                const controls = new OrbitControls(this.camera, this.renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
                controls.enableZoom = false;
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.5;
                this.menuControls = controls;
            }
            
            setupCarPreviews() {
                // Create preview cars for the car selector
                const carOptions = document.querySelectorAll('.car-option');
                
                for (let i = 0; i < carOptions.length; i++) {
                    const carOption = carOptions[i];
                    const previewContainer = carOption.querySelector('.car-preview');
                    
                    // Create a renderer for this preview
                    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                    renderer.setSize(80, 60);
                    previewContainer.appendChild(renderer.domElement);
                    
                    // Create a scene and camera
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(40, 4/3, 0.1, 1000);
                    camera.position.set(3, 3, 3);
                    camera.lookAt(0, 0, 0);
                    
                    // Add lights
                    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
                    scene.add(ambientLight);
                    
                    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                    directionalLight.position.set(5, 5, 5);
                    scene.add(directionalLight);
                    
                    // Create car
                    const carColors = [0xff0000, 0x0066ff, 0xffaa00];
                    const car = new Vehicle({
                        carType: i,
                        color: new THREE.Color(carColors[i])
                    });
                    car.createMesh(scene);
                    
                    // Store references for animation
                    carOption.previewScene = scene;
                    carOption.previewCamera = camera;
                    carOption.previewRenderer = renderer;
                    carOption.previewCar = car.mesh;
                    
                    // Start animation
                    this.animateCarPreview(carOption);
                }
            }
            
            animateCarPreview(carOption) {
                const animate = () => {
                    if (!carOption.previewCar) return;
                    
                    // Rotate car
                    carOption.previewCar.rotation.y += 0.01;
                    
                    // Render
                    carOption.previewRenderer.render(carOption.previewScene, carOption.previewCamera);
                    
                    // Continue animation if element still exists
                    if (carOption.isConnected) {
                        requestAnimationFrame(animate);
                    }
                };
                
                animate();
            }
            
            selectTrack(trackId) {
                // Store selected track
                this.gameState.selectedTrack = trackId;
                
                // Update UI
                document.querySelectorAll('.track-option').forEach(option => {
                    option.classList.remove('selected');
                });
                document.querySelector(`.track-option[data-track="${trackId}"]`).classList.add('selected');
            }
            
            selectCar(carId) {
                // Store selected car
                this.gameState.selectedCar = carId;
                
                // Update UI
                document.querySelectorAll('.car-option').forEach(option => {
                    option.classList.remove('selected');
                });
                document.querySelector(`.car-option[data-car="${carId}"]`).classList.add('selected');
            }
            
            startRace() {

                // Create race scene with selected track and car
                this.setupRaceScene();
                
                // Start countdown
                this.gameState.changeState(this.gameState.states.COUNTDOWN);
                this.countdown = 3;
                this.countdownTimer = 0;
                
                // Play countdown sound
                this.soundManager.playSound('countdown');
                
                // Stop menu music and start race music
                this.soundManager.stopMusic();
                  // Play menu music
                this.soundManager.playMusic('menu');
                
                // Update UI
                this.updateHUD();
            }
            
            setupRaceScene() {
                // Clear scene
                while (this.scene.children.length > 0) {
                    this.scene.remove(this.scene.children[0]);
                }
                
                // Clean up menu controls
                if (this.menuControls) {
                    this.menuControls.dispose();
                    this.menuControls = null;
                }
                
                // Re-add lights
                this.setupLighting();
                
                // Create track
                const trackGenerator = new TrackGenerator();
                this.track = trackGenerator.generateTrack(this.gameState.selectedTrack, this.scene);
                
                // Setup fog and environment
                this.setupEnvironment(this.track);
                
                // Create player vehicle
                this.createPlayerVehicle();
                
                // Create AI vehicles
                this.createAIVehicles(5);
                
                // Reset race timer
                this.raceTimer = 0;
                this.raceStartTime = 0;
                
                // Update minimap
                this.updateMinimap();
            }
            
            setupEnvironment(track) {
                // Set fog based on track settings
                this.scene.fog = new THREE.FogExp2(track.fogColor, track.fogDensity);
                
                // Set sky color
                this.scene.background = track.skyColor;
                
                // Update lighting to match environment
                this.ambientLight.color.copy(track.ambientLightColor);
                this.directionalLight.color.copy(track.directionalLightColor);
                this.directionalLight.intensity = track.directionalLightIntensity;
                
                // Set light direction based on track type
                if (track.type === 0) { // City
                    // Morning sun position
                    this.directionalLight.position.set(50, 100, 50);
                } else if (track.type === 1) { // Mountain
                    // Afternoon sun position
                    this.directionalLight.position.set(-70, 80, -30);
                } else if (track.type === 2) { // Desert
                    // Midday sun position
                    this.directionalLight.position.set(0, 100, -20);
                }
            }
            
            createPlayerVehicle() {
                // Set car properties based on selected car
                const carProperties = {
                    0: { // Speeder
                        maxSpeed: 180,
                        acceleration: 10,
                        handling: 2.5,
                        grip: 0.9,
                        color: new THREE.Color(0xff0000)
                    },
                    1: { // Racer
                        maxSpeed: 220,
                        acceleration: 8,
                        handling: 2.2,
                        grip: 0.7,
                        color: new THREE.Color(0x0066ff)
                    },
                    2: { // Muscle
                        maxSpeed: 200,
                        acceleration: 9,
                        handling: 1.8,
                        grip: 0.8,
                        color: new THREE.Color(0xffaa00)
                    }
                };
                
                const props = carProperties[this.gameState.selectedCar];
                
                // Create player vehicle
                this.playerVehicle = new Vehicle({
                    carType: this.gameState.selectedCar,
                    maxSpeed: props.maxSpeed,
                    acceleration: props.acceleration,
                    handling: props.handling,
                    grip: props.grip,
                    color: props.color,
                    isPlayer: true
                });
                
                // Initialize player vehicle
                const startPosition = this.track.getStartPosition();
                const startRotation = this.track.getStartRotation();
                this.playerVehicle.init(this.scene, startPosition, startRotation);
            }
            
            createAIVehicles(count) {
                this.aiVehicles = [];
                
                // Car colors for AI
                const aiColors = [
                    new THREE.Color(0x00aa00),
                    new THREE.Color(0x9900ff),
                    new THREE.Color(0x00ccff),
                    new THREE.Color(0xffff00),
                    new THREE.Color(0xff00ff)
                ];
                
                // Create AI vehicles
                for (let i = 0; i < count; i++) {
                    // Randomize car type and properties with slight variations
                    const carType = Math.floor(Math.random() * 3);
                    const aiDifficulty = 0.5 + Math.random() * 0.3; // Between 0.5 and 0.8
                    
                    const aiVehicle = new Vehicle({
                        carType: carType,
                        maxSpeed: 170 + Math.random() * 30,
                        acceleration: 7 + Math.random() * 3,
                        handling: 1.8 + Math.random() * 0.7,
                        grip: 0.7 + Math.random() * 0.2,
                        color: aiColors[i % aiColors.length],
                        isAI: true,
                        aiDifficulty: aiDifficulty
                    });
                    
                    // Initialize AI vehicle with offset from start
                    const startPosition = this.track.getStartPosition().clone();
                    const startRotation = this.track.getStartRotation();
                    
                    // Position AI in a grid behind player
                    const row = Math.floor(i / 2);
                    const col = i % 2;
                    
                    // Calculate offset
                    const rowOffset = (row + 1) * 5; // 5 units between rows
                    const colOffset = (col === 0) ? -3 : 3; // 6 units between columns
                    
                    // Apply offset in the direction of the track
                    const direction = new THREE.Vector3(
                        Math.sin(startRotation),
                        0,
                        Math.cos(startRotation)
                    );
                    
                    // Perpendicular direction for column offset
                    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
                    
                    // Apply offsets
                    startPosition.sub(direction.clone().multiplyScalar(rowOffset));
                    startPosition.add(perpendicular.clone().multiplyScalar(colOffset));
                    
                    // Initialize AI
                    aiVehicle.init(this.scene, startPosition, startRotation);
                    
                    // Set initial waypoint target
                    aiVehicle.aiWaypointTarget = 1;
                    
                    // Add to AI vehicles array
                    this.aiVehicles.push(aiVehicle);
                }
            }
            
            updateHUD() {
                // Update speed display
                document.getElementById('speed-value').textContent = Math.floor(this.playerVehicle.speed);
                
                // Update timer
                const timer = document.getElementById('timer');
                if (timer && this.gameState.currentState === this.gameState.states.RACING) {
                    const time = this.raceTimer;
                    const minutes = Math.floor(time / 60);
                    const seconds = Math.floor(time % 60);
                    const milliseconds = Math.floor((time % 1) * 1000);
                    
                    timer.textContent = 
                        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
                }
                
                // Update lap counter
                document.getElementById('lap-count').textContent = `LAP ${this.playerVehicle.lap + 1}/${this.track.totalLaps}`;
                
                // Update race position
                document.getElementById('position').textContent = this.getPositionText(this.playerVehicle.racePosition);
                
                // Update boost bar
                const boostBar = document.getElementById('boost-bar');
                boostBar.style.width = `${this.playerVehicle.boostAmount * 100}%`;
                
                // Change color based on boost amount
                if (this.playerVehicle.boostAmount < 0.3) {
                    boostBar.style.background = 'linear-gradient(to right, #ff0000, #ff6600)';
                } else if (this.playerVehicle.boostAmount < 0.7) {
                    boostBar.style.background = 'linear-gradient(to right, #ffcc00, #ffff00)';
                } else {
                    boostBar.style.background = 'linear-gradient(to right, #3498db, #2ecc71)';
                }
            }
            
            getPositionText(position) {
                const suffixes = ['TH', 'ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH'];
                const suffix = position > 3 ? suffixes[0] : suffixes[position];
                return `${position}${suffix}`;
            }
            
            initMinimap() {
                // Setup minimap canvas
                this.minimap = document.getElementById('minimap');
                this.minimapContext = this.minimap.getContext('2d');
                
                // Set canvas size
                this.minimap.width = 200;
                this.minimap.height = 200;
            }
            
            updateMinimap() {
                if (!this.track || !this.playerVehicle) return;
                
                const ctx = this.minimapContext;
                const width = this.minimap.width;
                const height = this.minimap.height;
                
                // Clear minimap
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, width, height);
                
                // Get track points and bounds
                const trackPoints = this.track.getTrackPoints();
                if (!trackPoints || trackPoints.length === 0) return;
                
                // Calculate track bounds
                let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
                trackPoints.forEach(point => {
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minZ = Math.min(minZ, point.z);
                    maxZ = Math.max(maxZ, point.z);
                });
                
                // Add some padding
                const paddingFactor = 1.2;
                const rangeX = (maxX - minX) * paddingFactor;
                const rangeZ = (maxZ - minZ) * paddingFactor;
                const centerX = (minX + maxX) / 2;
                const centerZ = (minZ + maxZ) / 2;
                
                // Determine scale factor to fit in minimap
                const scale = Math.min(width / rangeX, height / rangeZ);
                
                // Function to convert world coordinates to minimap coordinates
                const worldToMinimap = (x, z) => {
                    const mapX = ((x - centerX) * scale + width / 2);
                    const mapY = ((z - centerZ) * scale + height / 2);
                    return { x: mapX, y: mapY };
                };
                
                // Draw track outline
                ctx.beginPath();
                const firstPoint = worldToMinimap(trackPoints[0].x, trackPoints[0].z);
                ctx.moveTo(firstPoint.x, firstPoint.y);
                
                for (let i = 1; i < trackPoints.length; i++) {
                    const point = worldToMinimap(trackPoints[i].x, trackPoints[i].z);
                    ctx.lineTo(point.x, point.y);
                }
                
                // Close the loop
                ctx.lineTo(firstPoint.x, firstPoint.y);
                
                // Draw track
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw checkpoints
                const checkpoints = this.track.checkpointPositions;
                if (checkpoints && checkpoints.length > 0) {
                    for (let i = 0; i < checkpoints.length; i++) {
                        const checkpoint = worldToMinimap(checkpoints[i].x, checkpoints[i].z);
                        
                        // Draw checkpoint
                        ctx.beginPath();
                        ctx.arc(checkpoint.x, checkpoint.y, 2, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
                        ctx.fill();
                        
                        // Highlight current checkpoint
                        if (i === this.playerVehicle.checkpoint) {
                            ctx.beginPath();
                            ctx.arc(checkpoint.x, checkpoint.y, 4, 0, Math.PI * 2);
                            ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                }
                
                // Draw player
                const playerPos = worldToMinimap(this.playerVehicle.position.x, this.playerVehicle.position.z);
                
                // Draw player direction
                const directionLength = 6;
                const dirX = Math.sin(this.playerVehicle.rotation.y) * directionLength;
                const dirZ = Math.cos(this.playerVehicle.rotation.y) * directionLength;
                
                ctx.beginPath();
                ctx.moveTo(playerPos.x, playerPos.y);
                ctx.lineTo(playerPos.x + dirX, playerPos.y + dirZ);
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw player position
                ctx.beginPath();
                ctx.arc(playerPos.x, playerPos.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
                ctx.fill();
                
                // Draw AI vehicles
                this.aiVehicles.forEach(ai => {
                    const aiPos = worldToMinimap(ai.position.x, ai.position.z);
                    
                    ctx.beginPath();
                    ctx.arc(aiPos.x, aiPos.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
                    ctx.fill();
                });
            }
            
            startCountdown() {
                this.countdownTimer += this.deltaTime;
                
                // Update countdown display
                if (this.countdown > 0) {
                    // Show countdown number
                    this.countdownElement.textContent = this.countdown;
                    this.countdownElement.style.opacity = 1;
                    this.countdownElement.style.transform = 'translate(-50%, -50%) scale(1)';
                    
                    // Check if it's time to decrement countdown
                    if (this.countdownTimer >= 1) {
                        this.countdown--;
                        this.countdownTimer = 0;
                        
                        // Play sound
                        if (this.countdown > 0) {
                            this.soundManager.playSound('countdown');
                        } else {
                            // Final GO sound
                            this.soundManager.playSound('countdownGo');
                        }
                    }
                } else {
                    // Show GO!
                    this.countdownElement.textContent = 'GO!';
                    this.countdownElement.style.opacity = 1;
                    this.countdownElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    
                    // Start race after a brief delay
                    if (this.countdownTimer >= 1) {
                        // Hide countdown
                        this.countdownElement.style.opacity = 0;
                        
                        // Start race
                        this.gameState.changeState(this.gameState.states.RACING);
                        this.raceStartTime = performance.now() / 1000;
                        
                        // Start engine sound
                        this.soundManager.startEngineSound();
                        
                        // Start race music
                        this.soundManager.playMusic('race');
                    }
                }
            }
            
            updateRace() {
                // Update race timer
                this.raceTimer = performance.now() / 1000 - this.raceStartTime;
                
                // Update player vehicle
                this.playerVehicle.update(this.deltaTime, this.inputManager, this.track);
                
                // Update AI vehicles
                this.aiVehicles.forEach(ai => ai.update(this.deltaTime, null, this.track));
                
                // Check for vehicle collisions
                this.checkVehicleCollisions();
                
                // Update race positions
                this.updateRacePositions();
                
                // Check for race completion
                this.checkRaceCompletion();
                
                // Update camera
                this.updateCamera();
                
                // Update HUD
                this.updateHUD();
                
                // Update minimap
                this.updateMinimap();
                
                // Update engine sound based on speed
                this.soundManager.updateEngineSound(this.playerVehicle.speed, this.playerVehicle.maxSpeed);
                
                // Handle skid sound
                if (this.playerVehicle.drifting) {
                    this.soundManager.startSkidSound();
                } else {
                    this.soundManager.stopSkidSound();
                }
                
                // Check for pause input
                if (this.inputManager.isPausePressed()) {
                    this.togglePause();
                }
            }
            
            checkVehicleCollisions() {
                // Check player collision with AI vehicles
                for (let i = 0; i < this.aiVehicles.length; i++) {
                    if (this.playerVehicle.checkCollision(this.aiVehicles[i])) {
                        const collided = this.playerVehicle.handleCollision(this.aiVehicles[i]);
                        if (collided) {
                            this.aiVehicles[i].handleCollision(this.playerVehicle);
                            this.soundManager.playSound('crash');
                        }
                    }
                }
                
                // Check AI-to-AI collisions
                for (let i = 0; i < this.aiVehicles.length; i++) {
                    for (let j = i + 1; j < this.aiVehicles.length; j++) {
                        if (this.aiVehicles[i].checkCollision(this.aiVehicles[j])) {
                            const collided = this.aiVehicles[i].handleCollision(this.aiVehicles[j]);
                            if (collided) {
                                this.aiVehicles[j].handleCollision(this.aiVehicles[i]);
                            }
                        }
                    }
                }
            }
            
            updateRacePositions() {
                // Gather all vehicles
                const vehicles = [this.playerVehicle, ...this.aiVehicles];
                
                // Calculate progress for each vehicle
                vehicles.forEach(vehicle => {
                    // Calculate overall progress
                    vehicle.overallProgress = 
                        vehicle.lap * this.track.totalCheckpoints + 
                        vehicle.checkpoint + 
                        (1 - this.track.checkVehicleCheckpoint(vehicle).progress);
                });
                
                // Sort vehicles by progress
                vehicles.sort((a, b) => b.overallProgress - a.overallProgress);
                
                // Assign positions
                for (let i = 0; i < vehicles.length; i++) {
                    vehicles[i].racePosition = i + 1;
                }
            }
            
            checkRaceCompletion() {
                // Check if player completed all laps
                if (this.playerVehicle.lap >= this.track.totalLaps) {
                    // Mark as finished
                    this.playerVehicle.finished = true;
                    
                    // Show race results
                    this.showRaceResults();
                }
                
                // Check if any AI completed race
                for (let i = 0; i < this.aiVehicles.length; i++) {
                    if (this.aiVehicles[i].lap >= this.track.totalLaps) {
                        this.aiVehicles[i].finished = true;
                    }
                }
            }
            
            showRaceResults() {
                // Change game state
                this.gameState.changeState(this.gameState.states.RACE_COMPLETE);
                
                // Stop engine sound
                this.soundManager.stopEngineSound();
                this.soundManager.stopSkidSound();
                
                // Play finish music
                this.soundManager.playMusic('finish');
                
                // Update results UI
                document.getElementById('result-position').textContent = this.getPositionText(this.playerVehicle.position);
                
                // Format best lap time
                let bestLapText = "N/A";
                if (this.playerVehicle.bestLapTime !== null) {
                    const minutes = Math.floor(this.playerVehicle.bestLapTime / 60);
                    const seconds = Math.floor(this.playerVehicle.bestLapTime % 60);
                    const milliseconds = Math.floor((this.playerVehicle.bestLapTime % 1) * 1000);
                    
                    bestLapText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
                }
                document.getElementById('result-best-lap').textContent = bestLapText;
                
                // Format total race time
                const totalMinutes = Math.floor(this.raceTimer / 60);
                const totalSeconds = Math.floor(this.raceTimer % 60);
                const totalMilliseconds = Math.floor((this.raceTimer % 1) * 1000);
                
                document.getElementById('result-total-time').textContent = 
                    `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}.${totalMilliseconds.toString().padStart(3, '0')}`;
                
                // Show top speed
                document.getElementById('result-top-speed').textContent = `${Math.floor(this.playerVehicle.topSpeed || this.playerVehicle.speed)} KM/H`;
            }
            
            updateCamera() {
                if (!this.playerVehicle) return;
                
                // Get player position and rotation
                const playerPos = this.playerVehicle.position;
                const playerDir = this.playerVehicle.direction;
                
                // Calculate ideal camera position (behind player)
                const idealPos = new THREE.Vector3();
                
                // Apply rotation to offset
                const rotationMatrix = new THREE.Matrix4();
                rotationMatrix.makeRotationY(this.playerVehicle.rotation.y);
                
                // Apply rotation to offset
                const offsetVector = this.cameraOffset.clone();
                offsetVector.applyMatrix4(rotationMatrix);
                
                // Calculate ideal position
                idealPos.copy(playerPos).add(offsetVector);
                
                // Smoothly move camera
                this.camera.position.lerp(idealPos, this.smoothCameraFactor);
                
                // Calculate look point (ahead of player)
                const lookPoint = new THREE.Vector3();
                lookPoint.copy(playerPos).add(playerDir.clone().multiplyScalar(10).setY(2));
                
                // Smoothly look at player
                this.cameraLookAt.lerp(lookPoint, this.smoothCameraFactor);
                this.camera.lookAt(this.cameraLookAt);
            }
            
            togglePause() {
                if (this.gameState.currentState === this.gameState.states.RACING) {
                    this.gameState.changeState(this.gameState.states.PAUSED);
                    this.soundManager.stopEngineSound();
                } else if (this.gameState.currentState === this.gameState.states.PAUSED) {
                    this.resumeRace();
                }
            }
            
            resumeRace() {
                this.gameState.changeState(this.gameState.states.RACING);
                this.soundManager.startEngineSound();
            }
            
            restartRace() {
                // Reset game state
                this.gameState.changeState(this.gameState.states.COUNTDOWN);
                
                // Reset countdown
                this.countdown = 3;
                this.countdownTimer = 0;
                
                // Play countdown sound
                this.soundManager.playSound('countdown');
                
                // Reset vehicles
                const startPosition = this.track.getStartPosition();
                const startRotation = this.track.getStartRotation();
                this.playerVehicle.reset(startPosition, startRotation);
                
                // Reset AI vehicles with offset
                for (let i = 0; i < this.aiVehicles.length; i++) {
                    const aiStartPosition = startPosition.clone();
                    const row = Math.floor(i / 2);
                    const col = i % 2;
                    
                    // Calculate offset
                    const rowOffset = (row + 1) * 5;
                    const colOffset = (col === 0) ? -3 : 3;
                    
                    // Apply offset in the direction of the track
                    const direction = new THREE.Vector3(
                        Math.sin(startRotation),
                        0,
                        Math.cos(startRotation)
                    );
                    
                    // Perpendicular direction for column offset
                    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
                    
                    // Apply offsets
                    aiStartPosition.sub(direction.clone().multiplyScalar(rowOffset));
                    aiStartPosition.add(perpendicular.clone().multiplyScalar(colOffset));
                    
                    // Reset AI
                    this.aiVehicles[i].reset(aiStartPosition, startRotation);
                    this.aiVehicles[i].aiWaypointTarget = 1;
                }
                
                // Reset race timer
                this.raceTimer = 0;
                this.raceStartTime = 0;
                
                // Stop sounds
                this.soundManager.stopEngineSound();
                this.soundManager.stopMusic();
                
                // Update HUD
                this.updateHUD();
            }
            
            returnToMenu() {
                // Reset game state
                this.gameState.changeState(this.gameState.states.MENU);
                
                // Stop race sounds
                this.soundManager.stopEngineSound();
                this.soundManager.stopSkidSound();
                
                // Setup menu scene
                this.setupMainMenuScene();
            }
            
            onWindowResize() {
                // Update camera aspect ratio
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                
                // Update renderer size
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                // Calculate delta time
                const currentTime = this.clock.getElapsedTime();
                this.deltaTime = Math.min(currentTime - this.lastTime, 0.1); // Cap delta time to prevent large jumps
                this.lastTime = currentTime;
                
                // Update input manager
                this.inputManager.update();
                
                // Update based on game state
                switch (this.gameState.currentState) {
                    case this.gameState.states.LOADING:
                        // Nothing to update during loading
                        break;
                        
                    case this.gameState.states.MENU:
                        // Update menu animation
                        if (this.menuControls) {
                            this.menuControls.update();
                        }
                        break;
                        
                    case this.gameState.states.COUNTDOWN:
                        // Update countdown
                        this.startCountdown();
                        
                        // Update camera during countdown
                        this.updateCamera();
                        break;
                        
                    case this.gameState.states.RACING:
                        // Update race
                        this.updateRace();
                        break;
                        
                    case this.gameState.states.PAUSED:
                        // Nothing to update while paused
                        break;
                        
                    case this.gameState.states.RACE_COMPLETE:
                        // Nothing to update on race complete screen
                        break;
                }
                
                // Render scene
                this.renderer.render(this.scene, this.camera);
            }
        }
        
        // Initialize game when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new Game(); // <--- Supprimez 'const game = '
        });
    