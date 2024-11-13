//#region UTIL

function showError(message) {
    const errorDiv = document.getElementById("error-message");
    errorDiv.textContent = message;
    setTimeout(() => {
        errorDiv.textContent = "";
    }, 3000);
}

function updateDrawButton() {
    const drawButton = document.getElementById("draw-button");
    if (!drawButton) {
        return;
    }

    // Disable draw button if there's only one or no teams waiting
    drawButton.disabled = gameQueue.size() <= 1;
}

function updateDisplay() {
    const matchDisplay = document.getElementById("match-display");

    if (currentTeam1 && currentTeam2) {
        document.getElementById("current-match").style.display = "flex";
        document.querySelector(".buttons").style.display = "flex";
        document.getElementById("team1").querySelector("h2").textContent =
            currentTeam1.name;
        document.getElementById("team2").querySelector("h2").textContent =
            currentTeam2.name;
        document.getElementById("team1-wins").textContent = currentTeam1.wins;
        document.getElementById("team2-wins").textContent = currentTeam2.wins;
        document.getElementById("team1-streak").textContent =
            currentTeam1.currentStreak;
        document.getElementById("team2-streak").textContent =
            currentTeam2.currentStreak;
    } else {
        document.getElementById("current-match").style.display = "none";
        document.querySelector(".buttons").style.display = "none";

        const noMatch = document.createElement("div");
        noMatch.className = "no-match";
        noMatch.textContent = "Add more teams to start matches";
        matchDisplay.appendChild(noMatch);
    }

    // Update queue display
    const queueList = document.getElementById("queue-list");
    queueList.innerHTML = "";
    gameQueue.items.forEach((team) => {
        const li = document.createElement("li");
        li.className = "queue-item";
        li.innerHTML = `
                    <span>${team.name} (Total Wins: ${team.wins})</span>
                    <button class="remove-team" onclick="removeTeam('${team.name}')">Remove</button>
                `;
        queueList.appendChild(li);
    });

    // Update waiting count
    const waitingCount = document.getElementById("waiting-count");
    waitingCount.textContent = `(${gameQueue.size()} waiting)`;

    // Update draw button state
    updateDrawButton();
}

//#endregion

//#region GAME

function addTeam() {
    const input = document.getElementById("new-team-name");
    const teamName = input.value.trim();

    if (!teamName) {
        showError("Please enter a team name");
        return;
    }

    // Check if team name already exists
    if (
        gameQueue.items.some((team) => team.name === teamName) ||
        currentTeam1?.name === teamName ||
        currentTeam2?.name === teamName
    ) {
        showError("Team name already exists");
        return;
    }

    const newTeam = new Team(teamName);
    gameQueue.enqueue(newTeam);
    input.value = "";

    // If we don't have a current match, try to set one up
    if (!currentTeam1 || !currentTeam2) {
        setupNextMatch();
    }

    updateDisplay();
}

function removeTeam(teamName) {
    // If the team is in the current match, we need to handle that
    if (currentTeam1?.name === teamName || currentTeam2?.name === teamName) {
        currentTeam1 = null;
        currentTeam2 = null;
        setupNextMatch();
    }

    gameQueue.remove(teamName);
    updateDisplay();
}

function setupNextMatch() {
    if (!currentTeam1 && gameQueue.size() >= 2) {
        // If no current winner, get two new teams
        currentTeam1 = gameQueue.dequeue();
        currentTeam2 = gameQueue.dequeue();
    } else if (currentTeam1 && gameQueue.size() >= 1) {
        // If there's a winner, just get one new challenger
        currentTeam2 = gameQueue.dequeue();
    } else if (!currentTeam1 && gameQueue.size() === 1) {
        // If only one team is left and no current match
        currentTeam1 = gameQueue.dequeue();
        currentTeam2 = null;
    } else if (!currentTeam1 && gameQueue.size() === 0) {
        // No teams available
        currentTeam1 = null;
        currentTeam2 = null;
    }
    updateDisplay();
}

function handleResult(result) {
    if (!currentTeam1 || !currentTeam2) {
        return;
    }

    if (result === "team1") {
        // Team 1 wins and stays
        currentTeam1.wins++;
        currentTeam1.currentStreak++;
        currentTeam2.currentStreak = 0;
        gameQueue.enqueue(currentTeam2); // Losing team goes to back of queue
        currentTeam2 = null; // Clear team 2 spot for next challenger
    } else if (result === "team2") {
        // Team 2 wins and becomes the new team 1
        currentTeam2.wins++;
        currentTeam2.currentStreak++;
        currentTeam1.currentStreak = 0;
        gameQueue.enqueue(currentTeam1); // Losing team goes to back of queue
        currentTeam1 = currentTeam2; // Winner becomes new team 1
        currentTeam2 = null; // Clear team 2 spot for next challenger
    } else if (result === "draw") {
        // In case of draw, both teams go back to queue based on wins
        currentTeam1.currentStreak = 0;
        currentTeam2.currentStreak = 0;
        if (currentTeam1.wins <= currentTeam2.wins) {
            gameQueue.enqueue(currentTeam1);
            gameQueue.enqueue(currentTeam2);
        } else {
            gameQueue.enqueue(currentTeam2);
            gameQueue.enqueue(currentTeam1);
        }
        currentTeam1 = null;
        currentTeam2 = null;
    }

    setupNextMatch();
}

//#endregion

//#region CLASSES

class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    peek() {
        return this.items[0];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    remove(teamName) {
        this.items = this.items.filter((team) => team.name !== teamName);
    }
}

class Team {
    constructor(name) {
        this.name = name;
        this.wins = 0;
        this.currentStreak = 0;
    }
}

//#endregion

const gameQueue = new Queue();
let currentTeam1 = null;
let currentTeam2 = null;

// Initialize the display
updateDisplay();

// Add enter key support for adding teams
document
    .getElementById("new-team-name")
    .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            addTeam();
        }
    });
