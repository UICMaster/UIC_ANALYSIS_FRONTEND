let dnaChartInstance = null;
let mergedPlayerData = [];

const ROLE_MAP = { "TOP": "Toplane", "JGL": "Jungle", "MID": "Midlane", "BOT": "Botlane", "SUP": "Support" };

async function loadData() {
    try {
        const teamsRes = await fetch('data/teams.json');
        const stateRes = await fetch('data/player_state.json');
        
        const teams = await teamsRes.json();
        const playerState = await stateRes.json();

        for (const [teamKey, teamInfo] of Object.entries(teams)) {
            const teamNameShort = teamInfo.teamDisplay.replace("UIC ", "");
            
            for (const player of teamInfo.roster) {
                if (player.role === "MNG" || player.role === "COH" || !player.puuid) continue;
                
                const stats = playerState[player.puuid];
                if (stats && stats.ups !== undefined) {
                    mergedPlayerData.push({
                        puuid: player.puuid,
                        gameName: player.gameName,
                        tagLine: player.tagLine,
                        role: player.role,
                        team: teamNameShort,
                        metrics: stats
                    });
                }
            }
        }

        mergedPlayerData.sort((a, b) => b.metrics.ups - a.metrics.ups);
        renderLeaderboard();

    } catch (error) {
        console.error("❌ Failed to load Analytics Data:", error);
        document.getElementById('leaderboard-body').innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Verbindung zur Datenbank fehlgeschlagen.</td></tr>`;
    }
}

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = "";

    mergedPlayerData.forEach((player, index) => {
        const tr = document.createElement('tr');
        tr.onclick = () => showPlayerDNA(player); 
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${player.gameName}</strong><span class="player-tagline">#${player.tagLine}</span></td>
            <td>${ROLE_MAP[player.role] || player.role}</td>
            <td>${player.team}</td>
            <td class="score-highlight">${player.metrics.ups}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showPlayerDNA(player) {
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('player-profile').classList.remove('hidden');

    document.getElementById('dna-name').innerText = player.gameName;
    document.getElementById('dna-subtitle').innerText = `${ROLE_MAP[player.role] || player.role} | UIC ${player.team}`;
    
    document.getElementById('val-ci').innerText = player.metrics.ci;
    document.getElementById('val-ti').innerText = player.metrics.ti;
    
    const isADC = player.role === "BOT";
    const viTag = document.getElementById('vi-tag');
    
    if (isADC) {
        viTag.classList.add('hidden');
    } else {
        viTag.classList.remove('hidden');
        document.getElementById('val-vi').innerText = player.metrics.vi;
    }

    drawRadarChart(player.metrics.ci, player.metrics.ti, player.metrics.vi, isADC);
}

function drawRadarChart(ci, ti, vi, isADC) {
    const ctx = document.getElementById('dnaChart').getContext('2d');
    if (dnaChartInstance) dnaChartInstance.destroy();

    const labels = isADC ? ['Carry Index', 'Tactician Index'] : ['Carry Index', 'Tactician Index', 'Vanguard Index'];
    const dataPoints = isADC ? [ci, ti] : [ci, ti, vi];

    // Read colors from CSS variables
    const primaryColor = '#00F0FF'; 
    const secondaryColor = '#B026FF';

    dnaChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Player DNA',
                data: dataPoints,
                backgroundColor: 'rgba(0, 240, 255, 0.15)', // Glassy Cyan
                borderColor: primaryColor,
                pointBackgroundColor: secondaryColor, // Purple dots
                pointBorderColor: primaryColor,
                pointHoverBackgroundColor: primaryColor,
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { 
                        color: '#ffffff', 
                        font: { size: 13, family: "Rajdhani, sans-serif", weight: 'bold' } 
                    },
                    ticks: {
                        display: false,
                        min: 0, max: 100, stepSize: 20
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0a0a0a',
                    titleColor: primaryColor,
                    bodyColor: '#ffffff',
                    borderColor: primaryColor,
                    borderWidth: 1,
                    titleFont: { family: 'Orbitron', size: 14 },
                    bodyFont: { family: 'Rajdhani', size: 14 }
                }
            }
        }
    });
}

loadData();
