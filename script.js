document.addEventListener('DOMContentLoaded', () => {
    const keys = 'AWSEDFTGYHUJK'.split('');
    const keyboard = document.querySelector('.keyboard');
    let currentInstrument = 'piano';

    // Initialize Tone.js instruments
    const piano = new Tone.Synth().toDestination();
    const guitar = new Tone.PluckSynth().toDestination();
    const drums = {
        kick: new Tone.MembraneSynth().toDestination(),
        snare: new Tone.NoiseSynth().toDestination(),
        hihat: new Tone.MetalSynth().toDestination()
    };

    // Create keyboard layout
    keys.forEach((key, index) => {
        const isBlack = [1, 3, 6, 8, 10].includes(index % 12);
        const keyElement = document.createElement('div');
        keyElement.className = `key${isBlack ? ' black' : ''}`;
        keyElement.textContent = key;
        keyboard.appendChild(keyElement);
    });

    // Instrument selection
    document.querySelectorAll('[data-instrument]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.active').classList.remove('active');
            button.classList.add('active');
            currentInstrument = button.dataset.instrument;
        });
    });

    // Sound mapping
    const noteMap = {
        piano: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'],
        guitar: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3'],
        drums: ['kick', 'snare', 'hihat', 'kick', 'snare', 'hihat', 'kick', 'snare', 'hihat', 'kick', 'snare', 'hihat']
    };

    // Keyboard interaction
    document.addEventListener('keydown', (e) => {
        const keyIndex = keys.indexOf(e.key.toUpperCase());
        if (keyIndex === -1) return;

        const keyElement = keyboard.children[keyIndex];
        keyElement.classList.add('active');
        
        const note = noteMap[currentInstrument][keyIndex];
        playSound(note);
    });

    document.addEventListener('keyup', (e) => {
        const keyIndex = keys.indexOf(e.key.toUpperCase());
        if (keyIndex === -1) return;
        
        keyboard.children[keyIndex].classList.remove('active');
    });

    function playSound(note) {
        switch(currentInstrument) {
            case 'piano':
                piano.triggerAttackRelease(note, '8n');
                break;
            case 'guitar':
                guitar.triggerAttackRelease(note, '8n');
                break;
            case 'drums':
                if (note === 'kick') drums.kick.triggerAttackRelease('C2', '8n');
                if (note === 'snare') drums.snare.triggerAttackRelease('8n');
                if (note === 'hihat') drums.hihat.triggerAttackRelease('32n');
                break;
        }
    }
});