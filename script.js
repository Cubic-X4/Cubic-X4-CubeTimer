
let timerState = 'stopped'; // stopped, ready, timing
let startTime = 0;
let timerInterval = null;
let currentScramble = '';
let spacePressed = false;
let solves = [];

// Load solves from localStorage on page load
function loadSolves() {
    const savedSolves = localStorage.getItem('speedCubeSolves');
    if (savedSolves) {
        solves = JSON.parse(savedSolves);
    }
}

// Save solves to localStorage
function saveSolvesToStorage() {
    localStorage.setItem('speedCubeSolves', JSON.stringify(solves));
}

// Timer functions
function startTimer() {
    if (timerState === 'timing') return;

    startTime = Date.now();
    timerState = 'timing';
    document.getElementById('status').textContent = 'Solving...';
    document.getElementById('status').className = 'timer-status timing';

    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        document.getElementById('timer').textContent = elapsed.toFixed(2);
    }, 10);
}

function stopTimer() {
    if (timerState !== 'timing') return;

    clearInterval(timerInterval);
    const finalTime = (Date.now() - startTime) / 1000;
    timerState = 'stopped';

    document.getElementById('timer').textContent = finalTime.toFixed(2);
    document.getElementById('status').textContent = 'Press and hold SPACEBAR to start';
    document.getElementById('status').className = 'timer-status stopped';

    // Save solve
    saveSolve(finalTime);
    generateScramble();
}

function saveSolve(time) {
    const solve = {
        time: Math.round(time * 100) / 100,
        scramble: currentScramble,
        timestamp: new Date().toISOString()
    };

    solves.push(solve);
    saveSolvesToStorage();
    updateStats();
    updateHistory();
}

function updateStats() {
    if (!solves.length) {
        document.getElementById('lastSolve').textContent = '-';
        document.getElementById('bestSolve').textContent = '-';
        document.getElementById('ao5').textContent = '-';
        document.getElementById('ao12').textContent = '-';
        document.getElementById('totalSolves').textContent = '0';
        document.getElementById('sessionAvg').textContent = '-';
        return;
    }

    const times = solves.map(solve => solve.time);

    // Calculate statistics
    const lastSolve = times[times.length - 1].toFixed(2);
    const bestSolve = Math.min(...times).toFixed(2);
    const totalSolves = times.length;
    const sessionAvg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);

    // Calculate Ao5 (Average of 5)
    let ao5 = '-';
    if (times.length >= 5) {
        const last5 = times.slice(-5).sort((a, b) => a - b);
        const middle3 = last5.slice(1, -1);
        ao5 = (middle3.reduce((a, b) => a + b, 0) / 3).toFixed(2);
    }

    // Calculate Ao12 (Average of 12)
    let ao12 = '-';
    if (times.length >= 12) {
        const last12 = times.slice(-12).sort((a, b) => a - b);
        const middle10 = last12.slice(1, -1);
        ao12 = (middle10.reduce((a, b) => a + b, 0) / 10).toFixed(2);
    }

    document.getElementById('lastSolve').textContent = lastSolve;
    document.getElementById('bestSolve').textContent = bestSolve;
    document.getElementById('ao5').textContent = ao5;
    document.getElementById('ao12').textContent = ao12;
    document.getElementById('totalSolves').textContent = totalSolves;
    document.getElementById('sessionAvg').textContent = sessionAvg;
}

function updateHistory() {
    const historyDiv = document.getElementById('solveHistory');
    historyDiv.innerHTML = '';

    // Show solves in reverse order (newest first)
    const reversedSolves = [...solves].reverse();

    reversedSolves.forEach((solve, index) => {
        const solveDiv = document.createElement('div');
        solveDiv.className = 'solve-item';
        solveDiv.innerHTML = `
            <div>
                <span class="solve-time">${solve.time.toFixed(2)}s</span>
                <div class="solve-details">${new Date(solve.timestamp).toLocaleString()}</div>
            </div>
            <div>
                <span class="solve-details">${solve.scramble.substring(0, 30)}...</span>
                <button class="delete-btn" onclick="deleteSolve(${index})">Delete</button>
            </div>
        `;
        historyDiv.appendChild(solveDiv);
    });
}

function deleteSolve(index) {
    // Convert from display order (newest first) to actual order
    const actualIndex = solves.length - 1 - index;
    if (actualIndex >= 0 && actualIndex < solves.length) {
        solves.splice(actualIndex, 1);
        saveSolvesToStorage();
        updateStats();
        updateHistory();
    }
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all solve history?')) {
        solves = [];
        saveSolvesToStorage();
        updateStats();
        updateHistory();
    }
}

function exportSolves() {
    if (solves.length === 0) {
        alert('No solves to export!');
        return;
    }

    let csvContent = 'Time (seconds),Scramble,Date,Timestamp\n';
    
    solves.forEach(solve => {
        const date = new Date(solve.timestamp);
        const row = [
            solve.time,
            `"${solve.scramble}"`,
            date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
            solve.timestamp
        ].join(',');
        csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speed_cube_solves_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function generateScramble() {
    const moves = ['R', 'L', 'U', 'D', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const scrambleLength = 20;

    let scramble = [];
    let lastMove = '';

    for (let i = 0; i < scrambleLength; i++) {
        let move;
        do {
            move = moves[Math.floor(Math.random() * moves.length)];
        } while (move === lastMove);

        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        scramble.push(move + modifier);
        lastMove = move;
    }

    currentScramble = scramble.join(' ');
    document.getElementById('scramble').textContent = currentScramble;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();

        if (!spacePressed) {
            spacePressed = true;

            if (timerState === 'stopped') {
                timerState = 'ready';
                document.getElementById('status').textContent = 'Release to start!';
                document.getElementById('status').className = 'timer-status ready';
            } else if (timerState === 'timing') {
                stopTimer();
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        spacePressed = false;

        if (timerState === 'ready') {
            startTimer();
        }
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSolves();
    generateScramble();
    updateStats();
    updateHistory();
});
