// --- Tab Navigation System ---
function switchTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.nav-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const activeContent = document.getElementById(`tab-${tabId}`);
    if (activeContent) activeContent.classList.add('active');

    // Sync active class on tab buttons
    const activeBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase().includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');
}

// --- Tab 1: Playroom ROM & ISO Drag-and-Drop Loader ---
const dropZone = document.getElementById('emulator-screen');
const fileInput = document.getElementById('rom-file-input');

if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'var(--accent-green)';
            dropZone.style.background = 'rgba(0, 255, 102, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'var(--border-color)';
            dropZone.style.background = 'transparent';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) handleRomFile(files[0]);
    });
}

if (fileInput) {
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) handleRomFile(fileInput.files[0]);
    });
}

let pendingFile = null;

function handleRomFile(file) {
    const name = file.name.toLowerCase();
    
    // Check if it's a disc image (.iso, .img, .bin, .cso) where user can choose between PSP and PS1
    if (name.endsWith('.iso') || name.endsWith('.img') || name.endsWith('.bin') || name.endsWith('.cso')) {
        pendingFile = file;
        const screenEmpty = document.getElementById('emulator-screen');
        const modal = document.getElementById('system-selector-modal');
        const fileNameDisplay = document.getElementById('modal-filename-display');
        
        screenEmpty.style.display = 'none';
        modal.style.display = 'flex';
        if (fileNameDisplay) fileNameDisplay.innerText = file.name;
        return;
    }

    let system = '';
    if (name.endsWith('.gb') || name.endsWith('.gbc')) system = 'gb';
    else if (name.endsWith('.nes')) system = 'nes';
    else {
        setTimeout(() => {
            alert('Format file tidak didukung! Masukkan file .gb, .nes, .iso, .img, atau .bin.');
        }, 300);
        return;
    }

    launchEmulatorWithFile(file, system);
}

function confirmSystemSelection(system) {
    const modal = document.getElementById('system-selector-modal');
    if (modal) modal.style.display = 'none';
    if (pendingFile) {
        launchEmulatorWithFile(pendingFile, system);
        pendingFile = null;
    }
}

function launchEmulatorWithFile(file, system) {
    const screenEmpty = document.getElementById('emulator-screen');
    const activeContainer = document.getElementById('emulator-active-container');
    const iframe = document.getElementById('emulator-iframe');

    // Render loading state
    screenEmpty.style.display = 'flex';
    screenEmpty.innerHTML = `
        <div class="drop-zone-icon">⚡</div>
        <h3 style="color:var(--accent-green); font-family:'Share Tech Mono';">MEMPROSES FILE:</h3>
        <p style="color:#fff; font-weight:bold; margin-top:5px;">${file.name.toUpperCase()}</p>
        <p id="rom-status-detail" style="color:var(--text-muted); font-size:0.8rem; margin-top:10px;">Menghubungkan ke core emulator (${system.toUpperCase()})...</p>
    `;

    setTimeout(() => {
        screenEmpty.style.display = 'none';
        activeContainer.style.display = 'block';

        // Store selected file and system target on parent window for player.html to access
        window.currentRomFile = file;
        window.currentSystem = system;

        // Redirect the iframe to our local player
        iframe.src = "player.html";
    }, 1200);
}

// --- Tab 2: Arcade Classics (Shareware Loader) ---
function loadShareware(gameId, embedUrl) {
    const modal = document.getElementById('arcade-player-container');
    const iframe = document.getElementById('arcade-iframe');
    const title = document.getElementById('arcade-game-title');

    let gameTitle = 'Retro Game';
    if (gameId === 'doom') gameTitle = 'DOOM (Shareware 1993)';
    else if (gameId === 'simcity') gameTitle = 'SimCity 2000 (Demo 1993)';
    else if (gameId === 'pop') gameTitle = 'Prince of Persia (MS-DOS 1990)';
    else if (gameId === 'cnc') gameTitle = 'Command & Conquer (1995)';

    title.innerText = gameTitle;
    iframe.src = embedUrl;
    modal.style.display = 'block';

    modal.scrollIntoView({ behavior: 'smooth' });
}

function closeShareware() {
    const modal = document.getElementById('arcade-player-container');
    const iframe = document.getElementById('arcade-iframe');
    iframe.src = ''; 
    modal.style.display = 'none';
}

function toggleNativeFullscreen() {
    const player = document.getElementById('arcade-player-container');
    if (!document.fullscreenElement) {
        if (player.requestFullscreen) player.requestFullscreen();
        else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
        else if (player.msRequestFullscreen) player.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

// --- Tab 4: Fan Tributes Remake Loader ---
function loadTributeGame() {
    const placeholder = document.getElementById('tribute-placeholder');
    const activeContainer = document.getElementById('tribute-active-container');
    const iframe = document.getElementById('tribute-iframe');

    placeholder.style.display = 'none';
    activeContainer.style.display = 'block';
    
    // Load previously built Ghost Recon relative path
    iframe.src = "../ngage_ghost_recon/index.html";
}

// --- Interactive Control Key Rebinding ---
let keyBinds = {
    up: 'w', down: 's', left: 'a', right: 'd',
    a: 'j', b: 'k', select: 'shift', start: 'enter'
};
let rebindingAction = null;

function rebindKey(action) {
    // Reset other buttons
    document.querySelectorAll('.clickable-key').forEach(btn => btn.classList.remove('waiting'));

    rebindingAction = action;
    // Find correct button and add waiting anim class
    const buttons = document.querySelectorAll('#key-mapping-list li button');
    const btn = Array.from(buttons).find(b => b.getAttribute('onclick').includes(`'${action}'`));
    if (btn) {
        btn.classList.add('waiting');
        btn.innerText = 'TEKAN TOMBOL...';
    }
}

// Listen for keyboard input to bind new key
window.addEventListener('keydown', (e) => {
    if (!rebindingAction) return;

    e.preventDefault();
    const key = e.key.toLowerCase();
    keyBinds[rebindingAction] = key;

    // Update list UI
    const buttons = document.querySelectorAll('#key-mapping-list li button');
    const btn = Array.from(buttons).find(b => b.getAttribute('onclick').includes(`'${rebindingAction}'`));
    if (btn) {
        btn.classList.remove('waiting');
        btn.innerText = key === ' ' ? 'space' : key;
    }

    rebindingAction = null;
});

// --- Retro Procedural BGM Synthesizer ---
let bgmCtx = null;
let bgmInterval = null;
let isBgmPlaying = false;
let notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale
let sequence = [0, 2, 4, 3, 2, 4, 5, 4, 7, 5, 4, 2, 3, 1, 0, 2];
let step = 0;

function toggleBGM() {
    const btn = document.getElementById('btn-bgm-toggle');
    isBgmPlaying = !isBgmPlaying;

    if (isBgmPlaying) {
        btn.innerText = "MUTE";
        btn.classList.add('active');
        
        if (!bgmCtx) {
            bgmCtx = new (window.AudioContext || window.webkitAudioContext)();
            startBGMSequence();
        } else if (bgmCtx.state === 'suspended') {
            bgmCtx.resume();
        }
    } else {
        btn.innerText = "PLAY";
        btn.classList.remove('active');
        if (bgmCtx) bgmCtx.suspend();
    }
}

function startBGMSequence() {
    const tempo = 110; // BPM
    const stepDuration = 60 / tempo / 2; // eighth notes

    bgmInterval = setInterval(() => {
        if (!isBgmPlaying || !bgmCtx || bgmCtx.state === 'suspended') return;

        // Bass Synth note
        const osc = bgmCtx.createOscillator();
        const gain = bgmCtx.createGain();
        
        osc.type = 'triangle';
        const noteIndex = sequence[step % sequence.length];
        osc.frequency.setValueAtTime(notes[noteIndex] / 2, bgmCtx.currentTime); // low bass
        
        gain.gain.setValueAtTime(0.06, bgmCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, bgmCtx.currentTime + stepDuration - 0.04);
        
        osc.connect(gain);
        gain.connect(bgmCtx.destination);
        
        osc.start();
        osc.stop(bgmCtx.currentTime + stepDuration);

        // Hi-Hat beat
        if (step % 2 === 1) {
            const bufferSize = bgmCtx.sampleRate * 0.03;
            const buffer = bgmCtx.createBuffer(1, bufferSize, bgmCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = bgmCtx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = bgmCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 8000;
            
            const hhGain = bgmCtx.createGain();
            hhGain.gain.setValueAtTime(0.01, bgmCtx.currentTime);
            hhGain.gain.exponentialRampToValueAtTime(0.001, bgmCtx.currentTime + 0.03);
            
            noise.connect(filter);
            filter.connect(hhGain);
            hhGain.connect(bgmCtx.destination);
            
            noise.start();
        }

        step++;
    }, stepDuration * 1000);
}

// --- PWA Installation Support ---
let deferredPrompt;
const installBtn = document.getElementById('btn-pwa-install');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'block'; // Show button when installable
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    });
}

window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    console.log('RetroHaven Hub installed successfully as PWA!');
});

// --- Register Service Worker for PWA Offline Caching ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('ServiceWorker registered successfully:', reg.scope))
            .catch(err => console.log('ServiceWorker registration failed:', err));
    });
}
