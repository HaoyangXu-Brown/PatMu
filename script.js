document.addEventListener('DOMContentLoaded', () => {
    const audioFiles = {
        drum: 'https://tonejs.github.io/audio/drum-samples/808/kick.mp3',
        piano: 'https://tonejs.github.io/audio/casio/C4.mp3',
        guitar: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Guitar_Strum_Cmaj.ogg'
    };

    let hands;
    let isAudioReady = false;
    let lastTriggerTime = 0;
    const cooldown = 500;

    // Audio Manager
    class AudioSystem {
        constructor() {
            this.audioElements = {};
            this.fallbackSynths = null;
            this.init();
        }

        async init() {
            try {
                await this.loadAudioFiles();
                isAudioReady = true;
                this.updateAudioStatus('🔊 Audio Ready');
            } catch (error) {
                this.handleAudioError(error);
                this.initFallbackSynths();
            }
        }

        async loadAudioFiles() {
            const promises = Object.entries(audioFiles).map(([name, url]) => 
                this.loadAudio(name, url)
            );
            await Promise.all(promises);
        }

        async loadAudio(name, url, retries = 3) {
            return new Promise(async (resolve, reject) => {
                try {
                    const audio = new Audio(url);
                    audio.addEventListener('canplaythrough', () => {
                        this.audioElements[name] = audio;
                        resolve();
                    });
                    audio.load();
                } catch (error) {
                    if (retries > 0) {
                        await new Promise(r => setTimeout(r, 1000));
                        return this.loadAudio(name, url, retries - 1);
                    }
                    reject(error);
                }
            });
        }

        initFallbackSynths() {
            this.fallbackSynths = {
                drum: new Tone.MembraneSynth().toDestination(),
                piano: new Tone.Synth().toDestination(),
                guitar: new Tone.PluckSynth().toDestination()
            };
            this.updateAudioStatus('⚠️ Using Fallback Sounds');
        }

        play(instrument) {
            const volume = document.getElementById('volume').value;
            
            if (this.audioElements[instrument]) {
                const audio = this.audioElements[instrument].cloneNode();
                audio.volume = volume;
                audio.play().catch(() => this.playFallback(instrument));
            } else {
                this.playFallback(instrument);
            }
        }

        playFallback(instrument) {
            if (!this.fallbackSynths) this.initFallbackSynths();
            const note = instrument === 'drum' ? 'C2' : 'C4';
            this.fallbackSynths[instrument].triggerAttackRelease(note, '8n');
        }

        updateAudioStatus(text) {
            document.getElementById('audio-status').textContent = text;
        }

        handleAudioError(error) {
            console.error('Audio Error:', error);
            this.updateAudioStatus('🔇 Audio Error - Using Fallback');
        }
    }

    // Camera System
    class CameraSystem {
        constructor() {
            this.video = document.querySelector('.input_video');
            this.canvas = document.querySelector('.output_canvas');
            this.initHandTracking();
        }

        initHandTracking() {
            hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });

            hands.onResults(this.processHandResults.bind(this));
        }

        async start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user', width: 1280, height: 720 } 
                });
                this.video.srcObject = stream;
                this.initCameraLoop();
            } catch (error) {
                this.handleCameraError(error);
            }
        }

        initCameraLoop() {
            const camera = new Camera(this.video, {
                onFrame: async () => {
                    await hands.send({ image: this.video });
                },
                width: this.video.videoWidth,
                height: this.video.videoHeight
            });
            camera.start();
        }

        processHandResults(results) {
            const ctx = this.canvas.getContext('2d');
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (results.multiHandLandmarks) {
                results.multiHandLandmarks.forEach(landmarks => {
                    const indexTip = landmarks[8];
                    this.checkGestureInteraction(
                        indexTip.x * this.canvas.width,
                        indexTip.y * this.canvas.height
                    );
                });
            }
        }

        checkGestureInteraction(x, y) {
            const currentTime = Date.now();
            if (currentTime - lastTriggerTime < cooldown) return;

            document.querySelectorAll('.gesture-btn').forEach(btn => {
                const rect = btn.getBoundingClientRect();
                const btnX = rect.left + rect.width/2;
                const btnY = rect.top + rect.height/2;
                const distance = Math.hypot(x - btnX, y - btnY);

                if (distance < 50) {
                    btn.classList.add('active');
                    audioSystem.play(btn.dataset.instrument);
                    this.createVisualFeedback(btnX, btnY);
                    lastTriggerTime = currentTime;
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        createVisualFeedback(x, y) {
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }
        }

        handleCameraError(error) {
            console.error('Camera Error:', error);
            document.getElementById('permission-error').textContent = 
                'Camera access required - Please refresh and allow access';
        }
    }

    // Initialization Flow
    const audioSystem = new AudioSystem();
    let cameraSystem;

    document.getElementById('request-camera-btn').addEventListener('click', async () => {
        try {
            cameraSystem = new CameraSystem();
            await cameraSystem.start();
            document.getElementById('permission-overlay').style.display = 'none';
        } catch (error) {
            console.error('Initialization Error:', error);
        }
    });

    // Volume Control
    document.getElementById('volume').addEventListener('input', (e) => {
        const volume = Math.round(e.target.value * 100);
        document.getElementById('audio-status').textContent = `🔊 Volume: ${volume}%`;
    });
});