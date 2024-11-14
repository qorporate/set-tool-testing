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

class GameManager {
    constructor() {
        this.currentTeam1 = null;
        this.currentTeam2 = null;
        this.queue = new Queue();
        this.errorTimeout = null;

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
        if (!this.currentTeam1 || !this.currentTeam2) {
            return;
        }

        if (result === "team1") {
            this.currentTeam1.wins++;
            this.currentTeam1.currentStreak++;
            this.currentTeam2.currentStreak = 0;
            this.queue.enqueue(this.currentTeam2);
            this.currentTeam2 = null;
        } else if (result === "team2") {
            this.currentTeam2.wins++;
            this.currentTeam2.currentStreak++;
            this.currentTeam1.currentStreak = 0;
            this.queue.enqueue(this.currentTeam1);
            this.currentTeam1 = this.currentTeam2;
            this.currentTeam2 = null;
        } else if (result === "draw") {
            this.currentTeam1.currentStreak = 0;
            this.currentTeam2.currentStreak = 0;
            if (this.currentTeam1.wins <= this.currentTeam2.wins) {
                this.queue.enqueue(this.currentTeam1);
                this.queue.enqueue(this.currentTeam2);
            } else {
                this.queue.enqueue(this.currentTeam2);
                this.queue.enqueue(this.currentTeam1);
            }
            this.currentTeam1 = null;
            this.currentTeam2 = null;
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

        if (this.currentTeam1 && this.currentTeam2) {
            document.getElementById("current-match").style.display = "flex";
            document.querySelector(".buttons").style.display = "flex";

            document.getElementById("team1").querySelector("h2").textContent =
                this.currentTeam1.name;
            document.getElementById("team1-wins").textContent =
                this.currentTeam1.wins;
            document.getElementById("team1-streak").textContent =
                this.currentTeam1.currentStreak;

            document.getElementById("team2").querySelector("h2").textContent =
                this.currentTeam2.name;
            document.getElementById("team2-wins").textContent =
                this.currentTeam2.wins;
            document.getElementById("team2-streak").textContent =
                this.currentTeam2.currentStreak;

            // if there are no other teams waiting outside, prompt to add more teams
            // if teams are waiting outside, remove the prompt.
            if (this.queue.size() >= 0) {
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
            }
        } else {
            // we don't need to show the match display if there's no match happening.
            document.getElementById("current-match").style.display = "none";
            document.querySelector(".buttons").style.display = "none";

            // and if there's no match happening, we should show the "add more teams" message.
            // but to avoid duplicating the message, we should remove any existing one first.
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
        if (!this.currentTeam1 && this.queue.size() >= 2) {
            // If no current winner, get two new teams
            this.currentTeam1 = this.queue.dequeue();
            this.currentTeam2 = this.queue.dequeue();
        } else if (this.currentTeam1 && this.queue.size() >= 1) {
            // If there's a winner, just get one new challenger
            this.currentTeam2 = this.queue.dequeue();
        } else if (!this.currentTeam1 && this.queue.size() === 1) {
            // only one person is in the queue. we should not dequeue them, or they won't show on the waiting list.
            console.log("Only one person in queue");
        } else if (!this.currentTeam1 && this.queue.size() === 0) {
            // No teams available
            this.currentTeam1 = null;
            this.currentTeam2 = null;
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
