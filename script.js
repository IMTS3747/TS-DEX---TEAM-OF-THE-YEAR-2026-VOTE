// TS DEX Complete TOTY Nominees List
const nominees = [
    // ATTACKERS
    { id: 1, name: "Kylian Mbappé", pos: "ATT", render: "assets/renders/mbappe.png" },
    { id: 2, name: "Lamine Yamal", pos: "ATT", render: "assets/renders/yamal.png" },
    { id: 3, name: "Harry Kane", pos: "ATT", render: "assets/renders/kane.png" },
    { id: 4, name: "Michael Olise", pos: "ATT", render: "assets/renders/olise.png" },
    { id: 5, name: "Kvicha Kvaratskhelia", pos: "ATT", render: "assets/renders/kvaratskhelia.png" },
    { id: 6, name: "Luis Díaz", pos: "ATT", render: "assets/renders/diaz.png" },
    { id: 7, name: "Ferran Torres", pos: "ATT", render: "assets/renders/torres.png" },
    { id: 8, name: "Erling Haaland", pos: "ATT", render: "assets/renders/haaland.png" },
    { id: 9, name: "Lionel Messi", pos: "ATT", render: "assets/renders/messi.png" },
    { id: 10, name: "Bukayo Saka", pos: "ATT", render: "assets/renders/saka.png" },

    // MIDFIELDERS
    { id: 11, name: "Rodrigo Hernández", pos: "MID", render: "assets/renders/rodri.png" },
    { id: 12, name: "Fabián Ruiz", pos: "MID", render: "assets/renders/ruiz.png" },
    { id: 13, name: "Vitinha", pos: "MID", render: "assets/renders/vitinha.png" },
    { id: 14, name: "Declan Rice", pos: "MID", render: "assets/renders/rice.png" },
    { id: 15, name: "Bruno Fernandes", pos: "MID", render: "assets/renders/fernandes.png" },
    { id: 16, name: "Pedri", pos: "MID", render: "assets/renders/pedri.png" },
    { id: 17, name: "Jude Bellingham", pos: "MID", render: "assets/renders/bellingham.png" },
    { id: 18, name: "João Neves", pos: "MID", render: "assets/renders/neves.png" },
    { id: 19, name: "Nico Paz", pos: "MID", render: "assets/renders/paz.png" },
    { id: 20, name: "Fermín López", pos: "MID", render: "assets/renders/lopez.png" },

    // DEFENDERS
    { id: 21, name: "Pau Cubarsí", pos: "DEF", render: "assets/renders/cubarsi.png" },
    { id: 22, name: "William Saliba", pos: "DEF", render: "assets/renders/saliba.png" },
    { id: 23, name: "Willian Pacho", pos: "DEF", render: "assets/renders/pacho.png" },
    { id: 24, name: "Gabriel Magalhães", pos: "DEF", render: "assets/renders/gabriel.png" },
    { id: 25, name: "Achraf Hakimi", pos: "DEF", render: "assets/renders/hakimi.png" },
    { id: 26, name: "Nico O'Reilly", pos: "DEF", render: "assets/renders/oreilly.png" },
    { id: 27, name: "Dayot Upamecano", pos: "DEF", render: "assets/renders/upamecano.png" },
    { id: 28, name: "Marc Cucurella", pos: "DEF", render: "assets/renders/cucurella.png" },
    { id: 29, name: "Pedro Porro", pos: "DEF", render: "assets/renders/porro.png" },
    { id: 30, name: "Nuno Mendes", pos: "DEF", render: "assets/renders/mendes.png" },
    { id: 31, name: "Marquinhos", pos: "DEF", render: "assets/renders/marquinhos.png" },
    { id: 32, name: "Joško Gvardiol", pos: "DEF", render: "assets/renders/gvardiol.png" },
    { id: 33, name: "Cristian Romero", pos: "DEF", render: "assets/renders/romero.png" },
    { id: 34, name: "Dean Huijsen", pos: "DEF", render: "assets/renders/huijsen.png" },
    { id: 35, name: "Lucas Hernández", pos: "DEF", render: "assets/renders/lucas_hernandez.png" },

    // GOALKEEPERS
    { id: 36, name: "Vozinha", pos: "GK", render: "assets/renders/vozinha.png" },
    { id: 37, name: "Unai Simón", pos: "GK", render: "assets/renders/simon.png" },
    { id: 38, name: "David Raya", pos: "GK", render: "assets/renders/raya.png" },
    { id: 39, name: "Joan García", pos: "GK", render: "assets/renders/garcia.png" },
    { id: 40, name: "Matvey Safonov", pos: "GK", render: "assets/renders/safonov.png" },
    { id: 41, name: "Gianluigi Donnarumma", pos: "GK", render: "assets/renders/donnarumma.png" },
    { id: 42, name: "Emiliano Martínez", pos: "GK", render: "assets/renders/martinez.png" }
];

let squad = {};
let captainId = null;
let currentFilter = 'ATT';
let currentUser = null;
let hasUserVoted = false;
let userExistingVote = null;
let isSelectingCaptain = false;

// Check Login Session On Page Load
async function checkAuthSession() {
    try {
        const res = await fetch('/api/user');
        const data = await res.json();
        const authBar = document.getElementById('authBar');
        const loginGate = document.getElementById('loginGate');

        if (data.loggedIn) {
            currentUser = data.user;
            hasUserVoted = data.hasVoted;
            userExistingVote = data.existingVote;

            loginGate.style.display = 'none';

            const avatarUrl = currentUser.avatar
                ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';

            authBar.innerHTML = `
        <div class="profile-dropdown-container">
          <button class="profile-avatar-btn" onclick="toggleDropdown()">
            <img src="${avatarUrl}" alt="Profile" />
          </button>
          <div class="dropdown-menu" id="profileDropdown">
            <div class="dropdown-header">@${currentUser.username}</div>
            <button class="dropdown-item" onclick="viewMyVote()">View My Vote</button>
            <button class="dropdown-item logout" onclick="logoutDiscord()">Log Out</button>
          </div>
        </div>
      `;

            if (hasUserVoted) {
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.innerText = 'VOTE ALREADY SUBMITTED';
                submitBtn.className = 'btn btn-submit disabled';
                submitBtn.disabled = true;

                // Load submitted vote into squad display if available
                if (userExistingVote && userExistingVote.squad) {
                    squad = userExistingVote.squad;
                    captainId = userExistingVote.captainId;
                    updatePitch();
                }
            }
        } else {
            loginGate.style.display = 'flex';
            authBar.innerHTML = '';
        }
    } catch (e) {
        console.error('Session check failed', e);
    }
}

function loginWithDiscord() {
    window.location.href = '/api/auth/login';
}

async function logoutDiscord() {
    await fetch('/api/logout');
    window.location.reload();
}

function toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

window.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-dropdown-container')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

function viewMyVote() {
    toggleDropdown();
    if (!userExistingVote || !userExistingVote.squad) {
        alert("You haven't submitted a vote yet!");
        return;
    }

    squad = userExistingVote.squad;
    captainId = userExistingVote.captainId;
    updatePitch();

    document.getElementById('modalTitle').innerText = 'YOUR SUBMITTED BALLOT';
    document.getElementById('modalDesc').innerText = 'Here is the official TOTY team you voted for:';

    openVisualModal();
}

// Render Nominees based on active filter state
function renderNominees(filter = currentFilter) {
    currentFilter = filter;
    const container = document.getElementById('nomineesList');
    container.innerHTML = '';

    const list = nominees.filter(n => n.pos === currentFilter);

    document.querySelectorAll('.tab').forEach(t => {
        if (t.getAttribute('data-pos') === currentFilter) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    list.forEach(player => {
        const isSelected = Object.values(squad).some(p => p && p.id === player.id);
        const card = document.createElement('div');
        card.className = `nominee-card ${isSelected ? 'selected' : ''}`;
        card.draggable = !hasUserVoted && !isSelected;

        card.innerHTML = `
      <div class="nominee-info">
        <span class="name">${player.name}</span>
        <span class="pos-badge">${player.pos}</span>
      </div>
      <img src="${player.render}" class="nominee-render" alt="${player.name}" onerror="this.style.display='none'" />
    `;

        if (!isSelected && !hasUserVoted) {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', player.id);
            });
            card.addEventListener('click', () => autoPlaceNominee(player));
        }

        container.appendChild(card);
    });
}

function filterNominees(pos, event) {
    if (event) event.preventDefault();
    renderNominees(pos);
}

// Pitch Slot Logic
document.querySelectorAll('.slot').forEach(slot => {
    const slotPos = slot.getAttribute('data-pos');

    slot.addEventListener('dragover', (e) => {
        if (hasUserVoted || isSelectingCaptain) return;
        e.preventDefault();
        slot.classList.add('drag-hover');
    });

    slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-hover', 'drag-invalid');
    });

    slot.addEventListener('drop', (e) => {
        if (hasUserVoted || isSelectingCaptain) return;
        e.preventDefault();
        slot.classList.remove('drag-hover', 'drag-invalid');

        const playerId = parseInt(e.dataTransfer.getData('text/plain'));
        const player = nominees.find(n => n.id === playerId);
        const slotKey = slot.getAttribute('data-slot');

        if (player) {
            if (player.pos !== slotPos) {
                slot.classList.add('drag-invalid');
                setTimeout(() => slot.classList.remove('drag-invalid'), 600);
                return;
            }
            placePlayer(player, slotKey);
        }
    });

    slot.addEventListener('click', () => {
        if (hasUserVoted) return;
        const slotKey = slot.getAttribute('data-slot');
        const playerInSlot = squad[slotKey];

        if (!playerInSlot) return;

        if (isSelectingCaptain) {
            captainId = playerInSlot.id;
            isSelectingCaptain = false;
            updatePitch();
            updateActionButtonState();
        } else {
            if (captainId === playerInSlot.id) {
                captainId = null;
            }
            delete squad[slotKey];
            updatePitch();
            renderNominees(currentFilter);
            updateActionButtonState();
        }
    });
});

function autoPlaceNominee(player) {
    if (hasUserVoted || isSelectingCaptain) return;
    const slots = Array.from(document.querySelectorAll('.slot'));
    const openSlot = slots.find(s => s.getAttribute('data-pos') === player.pos && !squad[s.getAttribute('data-slot')]);

    if (openSlot) {
        placePlayer(player, openSlot.getAttribute('data-slot'));
    }
}

function placePlayer(player, slotKey) {
    for (let key in squad) {
        if (squad[key] && squad[key].id === player.id) {
            delete squad[key];
        }
    }

    squad[slotKey] = player;
    updatePitch();
    renderNominees(currentFilter);
    updateActionButtonState();
}

function updatePitch() {
    document.querySelectorAll('.pitch-frame .slot').forEach(slot => {
        const slotKey = slot.getAttribute('data-slot');
        const player = squad[slotKey];

        if (player) {
            const isCapt = captainId === player.id;
            const initials = player.name.split(' ').map(n => n[0]).join('');

            slot.innerHTML = `
        <div class="pitch-card ${isSelectingCaptain ? 'captain-select-pulse' : ''}">
          ${isCapt ? '<div class="captain-badge">C</div>' : ''}
          <span class="render-fallback">${initials}</span>
          <div class="render-container">
            <img src="${player.render}" class="render-img" onerror="this.style.display='none'" />
            <div class="render-fade-overlay"></div>
          </div>
          <div class="card-text-content">
            <div class="player-name">${player.name}</div>
            <div class="player-pos">${player.pos}</div>
          </div>
        </div>
      `;
        } else {
            slot.innerHTML = `<span class="slot-label">${slotKey}</span>`;
        }
    });
}

// Dynamic Action Button State Handler
function updateActionButtonState() {
    if (hasUserVoted) return;
    const submitBtn = document.getElementById('submitBtn');
    const filledCount = Object.keys(squad).length;

    if (filledCount < 11) {
        submitBtn.innerText = `SUBMIT BALLOT (${filledCount}/11)`;
        submitBtn.className = 'btn btn-submit disabled';
        submitBtn.disabled = true;
        isSelectingCaptain = false;
    } else if (!captainId) {
        if (isSelectingCaptain) {
            submitBtn.innerText = 'CHOOSE CAPTAIN FROM XI...';
            submitBtn.className = 'btn btn-submit selecting';
            submitBtn.disabled = false;
        } else {
            submitBtn.innerText = 'SELECT CAPTAIN';
            submitBtn.className = 'btn btn-submit active-pulse';
            submitBtn.disabled = false;
        }
    } else {
        submitBtn.innerText = 'SUBMIT BALLOT';
        submitBtn.className = 'btn btn-submit active';
        submitBtn.disabled = false;
    }
}

// Main Action Button Click Handler
function handleActionButtonClick() {
    if (hasUserVoted) return;
    const filledCount = Object.keys(squad).length;

    if (filledCount < 11) return;

    if (!captainId) {
        if (!isSelectingCaptain) {
            isSelectingCaptain = true;
            updatePitch();
            updateActionButtonState();
        } else {
            isSelectingCaptain = false;
            updatePitch();
            updateActionButtonState();
        }
        return;
    }

    submitVote();
}

function resetSquad() {
    if (hasUserVoted) return;
    squad = {};
    captainId = null;
    isSelectingCaptain = false;
    updatePitch();
    renderNominees(currentFilter);
    updateActionButtonState();
}

// GENERATE EA-STYLE IMAGE SNAPSHOT & OPEN MODAL
function openVisualModal() {
    const modal = document.getElementById('modal');
    const spinner = document.getElementById('modalSpinner');
    const previewImg = document.getElementById('totyCanvasImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const exportPitch = document.getElementById('exportPitch');

    spinner.style.display = 'block';
    previewImg.style.display = 'none';
    downloadBtn.style.pointerEvents = 'none';
    downloadBtn.style.opacity = '0.5';

    modal.style.display = 'flex';

    // Populate the clean cutout export frame rows
    const rows = {
        ATT: ['LW', 'ST', 'RW'],
        MID: ['LCM', 'CM/CDM/CAM', 'RCM'],
        DEF: ['LB', 'LCB', 'RCB', 'RB'],
        GK: ['GK']
    };

    document.getElementById('expRowAtt').innerHTML = rows.ATT.map(slot => createExportCardHTML(slot)).join('');
    document.getElementById('expRowMid').innerHTML = rows.MID.map(slot => createExportCardHTML(slot)).join('');
    document.getElementById('expRowDef').innerHTML = rows.DEF.map(slot => createExportCardHTML(slot)).join('');
    document.getElementById('expRowGk').innerHTML = rows.GK.map(slot => createExportCardHTML(slot)).join('');

    // Capture the clean export frame via html2canvas
    setTimeout(() => {
        html2canvas(exportPitch, {
            useCORS: true,
            scale: 2,
            backgroundColor: null
        }).then(canvas => {
            const dataUrl = canvas.toDataURL('image/png');
            previewImg.src = dataUrl;
            previewImg.style.display = 'block';
            spinner.style.display = 'none';

            downloadBtn.href = dataUrl;
            downloadBtn.style.pointerEvents = 'auto';
            downloadBtn.style.opacity = '1';
        }).catch(err => {
            console.error("Canvas capture failed:", err);
            spinner.innerText = "Failed to render card graphic preview.";
        });
    }, 200);
}

function createExportCardHTML(slotKey) {
    const player = squad[slotKey];
    if (!player) return `<div class="slot" style="opacity:0.2;"><span class="slot-label">${slotKey}</span></div>`;

    const isCapt = captainId === player.id;
    const initials = player.name.split(' ').map(n => n[0]).join('');

    return `
        <div class="slot" style="border:none; background:none;">
            <div class="pitch-card">
                ${isCapt ? '<div class="captain-badge">C</div>' : ''}
                <span class="render-fallback">${initials}</span>
                <div class="render-container" style="overflow:hidden;">
                    <img src="${player.render}" class="render-img" />
                </div>
                <div class="card-text-content">
                    <div class="player-name">${player.name}</div>
                    <div class="player-pos">${player.pos}</div>
                </div>
            </div>
        </div>
    `;
}

// SUBMIT VOTE TO SERVER
async function submitVote() {
    if (!currentUser) {
        alert("Please login with your Discord account first to cast your vote!");
        loginWithDiscord();
        return;
    }

    if (hasUserVoted) return;

    const count = Object.keys(squad).length;
    if (count < 11 || !captainId) {
        alert("Please complete your team and select a captain!");
        return;
    }

    try {
        const res = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ squad, captainId })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to submit vote.");
            return;
        }

        userExistingVote = { squad, captainId };

        document.getElementById('modalTitle').innerText = 'VOTE REGISTERED';
        document.getElementById('modalDesc').innerText = 'Your official TS DEX TOTY XI selection has been submitted and posted to Discord!';

        hasUserVoted = true;
        checkAuthSession();
        openVisualModal();
    } catch (err) {
        console.error(err);
        alert("An error occurred while submitting your vote.");
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Initial Loads
checkAuthSession();
renderNominees('ATT');
updateActionButtonState();