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

class GameState {
    static WAITING_FOR_TEAMS = "WAITING_FOR_TEAMS";
    static MATCH_IN_PROGRESS = "MATCH_IN_PROGRESS";
    static WINNER_NEEDS_CHALLENGER = "WINNER_NEEDS_CHALLENGER";
}

class MatchSlot {
    constructor(position) {
        this.position = position; // 'A' or 'B'
        this.team = null;
    }

    setTeam(team) {
        this.team = team;
    }

    clear() {
        this.team = null;
    }

    isEmpty() {
        return this.team === null;
    }
}

class GameManager {
    constructor() {
        this.slotA = new MatchSlot("A");
        this.slotB = new MatchSlot("B");
        this.queue = new Queue();
        this.errorTimeout = null;
        this.currentState = GameState.WAITING_FOR_TEAMS;

        this.initializeEventListeners();
        this.updateDisplay();
    }

    showError(message) {
        const errorDiv = document.getElementById("error-message");
        errorDiv.textContent = message;

        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }

        this.errorTimeout = setTimeout(() => {
            errorDiv.textContent = "";
        }, 3000);
    }

    addTeam() {
        const input = document.getElementById("new-team-name");
        const teamName = input.value.trim();

        if (!teamName) {
            this.showError("Please enter a team name");
            return;
        }

        if (
            this.queue.items.some((team) => team.name === teamName) ||
            this.currentTeam1?.name === teamName ||
            this.currentTeam2?.name === teamName
        ) {
            this.showError("Team name already exists");
            return;
        }

        const newTeam = new Team(teamName);
        this.queue.enqueue(newTeam);
        input.value = "";

        if (!this.currentTeam1 || !this.currentTeam2) {
            this.setupNextMatch();
        }

        this.updateDisplay();
    }

    removeTeam(teamName) {
        // If the team is in the current match, we need to handle that
        if (
            this.currentTeam1?.name === teamName ||
            this.currentTeam2?.name === teamName
        ) {
            this.currentTeam1 = null;
            this.currentTeam2 = null;
            this.setupNextMatch();
        }

        this.queue.remove(teamName);
        this.updateDisplay();
    }

    handleResult(result) {
        if (this.slotA.isEmpty() || this.slotB.isEmpty()) {
            return;
        }

        if (result === "team1") {
            this.slotA.team.wins++;
            this.slotA.team.currentStreak++;

            this.slotB.team.currentStreak = 0;
            this.queue.enqueue(this.slotB.team);
            this.slotB.clear();

            this.currentState = GameState.WINNER_NEEDS_CHALLENGER;
        } else if (result === "team2") {
            this.slotB.team.wins++;
            this.slotB.team.currentStreak++;

            this.slotA.team.currentStreak = 0;
            this.queue.enqueue(this.slotA.team);
            this.slotA.clear();

            this.slotB.team.position = "A"; // Move to slot A
            this.slotA.setTeam(this.slotB.team);
            this.slotB.clear();

            this.currentState = GameState.WINNER_NEEDS_CHALLENGER;
        } else if (result === "draw") {
            this.slotA.team.currentStreak = 0;
            this.slotB.team.currentStreak = 0;

            if (this.slotA.team.wins <= this.slotB.team.wins) {
                this.queue.enqueue(this.slotA.team);
                this.queue.enqueue(this.slotB.team);
            } else {
                this.queue.enqueue(this.slotB.team);
                this.queue.enqueue(this.slotA.team);
            }

            this.slotA.clear();
            this.slotB.clear();
            this.currentState = GameState.WAITING_FOR_TEAMS;
        }

        this.setupNextMatch();
    }

    updateDrawButton() {
        const drawButton = document.getElementById("draw-button");
        if (!drawButton) {
            return;
        }

        // Disable draw button if there's only one or no teams waiting
        drawButton.disabled = this.queue.size() <= 1;
    }

    updateDisplay() {
        const matchDisplay = document.getElementById("match-display");

        if (!this.slotA.isEmpty() && !this.slotB.isEmpty()) {
            document.getElementById("current-match").style.display = "flex";
            document.querySelector(".buttons").style.display = "flex";

            document.getElementById("team1").querySelector("h2").textContent =
                this.slotA.team.name;
            document.getElementById("team1-wins").textContent =
                this.slotA.team.wins;
            document.getElementById("team1-streak").textContent =
                this.slotA.team.currentStreak;

            document.getElementById("team2").querySelector("h2").textContent =
                this.slotB.team.name;
            document.getElementById("team2-wins").textContent =
                this.slotB.team.wins;
            document.getElementById("team2-streak").textContent =
                this.slotB.team.currentStreak;

            // Update no-match message based on queue size
            const existingNoMatch = matchDisplay.querySelector(".no-match");
            if (existingNoMatch) {
                existingNoMatch.remove();
            }

            if (this.queue.size() < 1) {
                const noMatch = document.createElement("div");
                noMatch.className = "no-match";
                noMatch.textContent = "Add more teams to swap out losers";
                matchDisplay.appendChild(noMatch);
            }
        } else {
            document.getElementById("current-match").style.display = "none";
            document.querySelector(".buttons").style.display = "none";

            const existingNoMatch = matchDisplay.querySelector(".no-match");
            if (existingNoMatch) {
                existingNoMatch.remove();
            }

            const noMatch = document.createElement("div");
            noMatch.className = "no-match";
            noMatch.textContent = "Add more teams to start matches";
            matchDisplay.appendChild(noMatch);
        }

        // Update queue display
        const queueList = document.getElementById("queue-list");
        queueList.innerHTML = "";
        this.queue.items.forEach((team) => {
            const li = document.createElement("li");
            li.className = "queue-item";
            li.innerHTML = `
                    <span>${team.name} (Total Wins: ${team.wins})</span>
                    <button class="remove-team" onclick="game.removeTeam('${team.name}')">Remove</button>
                `;
            queueList.appendChild(li);
        });

        // Update waiting count
        const waitingCount = document.getElementById("waiting-count");
        waitingCount.textContent = `(${this.queue.size()} waiting)`;

        // Update draw button state
        this.updateDrawButton();
    }

    setupNextMatch() {
        switch (this.currentState) {
            case GameState.WAITING_FOR_TEAMS:
                if (this.queue.size() >= 2) {
                    this.slotA.setTeam(this.queue.dequeue());
                    this.slotB.setTeam(this.queue.dequeue());
                    this.currentState = GameState.MATCH_IN_PROGRESS;
                }
                break;

            case GameState.WINNER_NEEDS_CHALLENGER:
                if (this.queue.size() >= 1) {
                    this.slotB.setTeam(this.queue.dequeue());
                    this.currentState = GameState.MATCH_IN_PROGRESS;
                }
                break;
        }

        this.updateDisplay();
    }

    initializeEventListeners() {
        document
            .getElementById("new-team-name")
            .addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    this.addTeam();
                }
            });
    }
}

// todo:
// i am working on a version that doesn't move the B team to team A when they win a game. I don't like it. It's hard to know who's who when they suddenly switch places.
// I am considering using states to track who won, and which team slot needs filling.

const game = new GameManager();
