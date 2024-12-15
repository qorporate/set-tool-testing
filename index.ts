class Queue {
    items: Team[];

    constructor() {
        this.items = [];
    }

    enqueue(item: Team) {
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

    remove(teamName: string) {
        this.items = this.items.filter((team) => team.name !== teamName);
    }

    moveUp(teamName: string) {
        const index = this.items.findIndex((team) => team.name === teamName);
        if (index > 0) {
            const temp = this.items[index];
            this.items[index] = this.items[index - 1];
            this.items[index - 1] = temp;
        }
    }

    moveDown(teamName: string) {
        const index = this.items.findIndex((team) => team.name === teamName);
        if (index < this.items.length - 1) {
            const temp = this.items[index];
            this.items[index] = this.items[index + 1];
            this.items[index + 1] = temp;
        }
    }
}

class Team {
    name: string;
    wins: number;
    draws: number;
    losses: number;
    currentStreak: number;

    constructor(name: string) {
        this.name = name;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.currentStreak = 0;
    }
}

class GameState {
    static WAITING_FOR_TEAMS = "WAITING_FOR_TEAMS";
    static MATCH_IN_PROGRESS = "MATCH_IN_PROGRESS";
    static WINNER_NEEDS_CHALLENGER = "WINNER_NEEDS_CHALLENGER";
}

type Slot = "A" | "B";

interface State {
    queueItems: Team[];
    teamInMatchA: Team | null;
    teamInMatchB: Team | null;
    currentState: GameState;
}

enum MatchResult {
    Team1 = "team1",
    Team2 = "team2",
    Draw = "draw",
}

class MatchSlot {
    position: Slot;
    team: Team | null;

    constructor(position: Slot) {
        this.position = position; // 'A' or 'B'
        this.team = null;
    }

    setTeam(team: Team) {
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
    slotA: MatchSlot;
    slotB: MatchSlot;
    queue: Queue;
    currentState: GameState;
    errorTimeout: number | null;

    constructor() {
        this.slotA = new MatchSlot("A");
        this.slotB = new MatchSlot("B");
        this.queue = new Queue();
        this.errorTimeout = null;
        this.currentState = GameState.WAITING_FOR_TEAMS;

        this.initializeEventListeners();
        this.loadGameState();
        this.updateDisplay();
    }

    showError(message: string) {
        const errorDiv = document.getElementById("error-message");
        if (!errorDiv) {
            throw Error("Uh Oh! Can't show an error!");
        }

        errorDiv.textContent = message;
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }

        this.errorTimeout = setTimeout(() => {
            errorDiv.textContent = "";
        }, 3000);
    }

    addTeam() {
        const input = document.getElementById(
            "new-team-name"
        ) as HTMLInputElement;
        if (!input) {
            throw new Error("Uh oh! Can't get the new team name!");
        }

        const teamName = input.value.trim().toUpperCase();
        if (!teamName) {
            this.showError("Please enter a team name");
            return;
        }

        if (
            this.queue.items.some((team) => team.name === teamName) ||
            this.slotA.team?.name === teamName ||
            this.slotB.team?.name === teamName
        ) {
            this.showError("Team name already exists");
            return;
        }

        const newTeam = new Team(teamName);
        this.queue.enqueue(newTeam);
        input.value = "";

        if (!this.slotA.team || !this.slotB.team) {
            this.setupNextMatch();
        }

        this.saveGameState();
        this.updateDisplay();
    }

    removeTeam(teamName: string) {
        // If the team is in the current match, we need to handle that
        if (
            this.slotA.team?.name === teamName ||
            this.slotB.team?.name === teamName
        ) {
            this.slotA.team = null;
            this.slotB.team = null;
            this.setupNextMatch();
        }

        this.queue.remove(teamName);
        this.saveGameState();
        this.updateDisplay();
    }

    moveTeamUp(teamName: string) {
        this.queue.moveUp(teamName);
        this.saveGameState();
        this.updateDisplay();
    }

    moveTeamDown(teamName: string) {
        this.queue.moveDown(teamName);
        this.saveGameState();
        this.updateDisplay();
    }

    loadGameState() {
        const savedState = localStorage.getItem("gameState");
        if (savedState) {
            const state: State = JSON.parse(savedState);

            this.queue.items = state.queueItems.map((item) => item);
            this.slotA.team = state.teamInMatchA ? state.teamInMatchA : null;
            this.slotB.team = state.teamInMatchB ? state.teamInMatchB : null;
            this.currentState = state.currentState;
            this.updateDisplay();
        }
    }

    saveGameState() {
        const state: State = {
            queueItems: this.queue.items,
            teamInMatchA: this.slotA.team,
            teamInMatchB: this.slotB.team,
            currentState: this.currentState,
        };

        localStorage.setItem("gameState", JSON.stringify(state));
    }

    resetGame() {
        const confirmation = confirm(
            "Are you sure you want to reset the game? This action is unrecoverable."
        );
        if (confirmation) {
            localStorage.removeItem("gameState");
            location.reload(); // Refresh the page
        }
    }

    editTeamName(oldName: string) {
        const newName = prompt("Enter new team name:", oldName)
            ?.trim()
            .toUpperCase();

        if (!newName || newName === oldName) {
            return;
        }

        // Check if new name already exists
        if (
            this.queue.items.some((team) => team.name === newName) ||
            this.slotA.team?.name === newName ||
            this.slotB.team?.name === newName
        ) {
            this.showError("Team name already exists");
            return;
        }

        // Update name in queue
        const team = this.queue.items.find((team) => team.name === oldName);
        if (team) {
            team.name = newName;
        }

        // Update name in slots if necessary
        if (this.slotA.team?.name === oldName) {
            this.slotA.team.name = newName;
        }
        if (this.slotB.team?.name === oldName) {
            this.slotB.team.name = newName;
        }

        this.saveGameState();
        this.updateDisplay();
    }

    handleResult(result: MatchResult) {
        if (this.slotA.isEmpty() || this.slotB.isEmpty()) {
            return;
        }

        if (!this.slotA.team) {
            throw new Error("Uh oh! There's no team in slot A!");
        }

        if (!this.slotB.team) {
            throw new Error("Uh oh! There's no team in slot B!");
        }

        if (result === "team1") {
            this.slotA.team.wins++;
            this.slotA.team.currentStreak++;

            this.slotB.team.losses++;
            this.slotB.team.currentStreak = 0;

            if (this.queue.items.length > 0) {
                this.queue.enqueue(this.slotB.team);
                this.slotB.clear();

                this.currentState = GameState.WINNER_NEEDS_CHALLENGER;
            }
        } else if (result === "team2") {
            this.slotB.team.wins++;
            this.slotB.team.currentStreak++;

            this.slotA.team.losses++;
            this.slotA.team.currentStreak = 0;

            if (this.queue.items.length > 0) {
                this.queue.enqueue(this.slotA.team);
                this.slotA.clear();

                // winner stays in their slot. no swap.
                this.currentState = GameState.WINNER_NEEDS_CHALLENGER;
            }
        } else if (result === "draw") {
            this.slotA.team.draws++;
            this.slotA.team.currentStreak = 0;

            this.slotB.team.draws++;
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

        // we don't save state here, because the next method alters the state again
        this.setupNextMatch();
    }

    updateDrawButton() {
        const drawButton = document.getElementById(
            "draw-button"
        ) as HTMLInputElement;
        if (!drawButton) {
            return;
        }

        // Disable draw button if there's only one or no teams waiting
        drawButton.disabled = this.queue.size() <= 1;
    }

    updateDisplay() {
        const matchDisplay = document.getElementById("match-display");
        if (!matchDisplay) {
            throw new Error("Uh oh! Can't get the match display element.");
        }

        const currentMatch = document.getElementById("current-match");
        if (!currentMatch) {
            throw new Error("Uh oh! Can't get the current match element!");
        }

        const buttons = document.querySelector(".buttons") as HTMLInputElement;
        if (!buttons) {
            throw new Error("Uh oh! Can't  get the buttons element!");
        }

        if (!this.slotA.isEmpty() && !this.slotB.isEmpty()) {
            if (!this.slotA.team) {
                throw new Error("Uh oh! There's no team in slot A!");
            }

            if (!this.slotB.team) {
                throw new Error("Uh oh! There's no team in slot B!");
            }

            currentMatch.style.display = "flex";
            buttons.style.display = "flex";

            getElementByQuerySelector(
                getElementById("team1"),
                "h2"
            ).textContent = this.slotA.team.name;

            getElementById("team1-stats").textContent = this.formatTeamStats(
                this.slotA.team
            );
            getElementById("team1-streak").textContent =
                this.slotA.team.currentStreak.toString();

            getElementByQuerySelector(
                getElementById("team2"),
                "h2"
            ).textContent = this.slotB.team.name;
            getElementById("team2-stats").textContent = this.formatTeamStats(
                this.slotB.team
            );
            getElementById("team2-streak").textContent =
                this.slotB.team.currentStreak.toString();

            // Update button text with team names
            getElementById(
                "left-team-name"
            ).textContent = `${this.slotA.team.name} Wins`;
            getElementById(
                "right-team-name"
            ).textContent = `${this.slotB.team.name} Wins`;

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
            // don't display a match
            currentMatch.style.display = "none";
            buttons.style.display = "none";

            // prompt the user to add more teams
            // but prevent duplicate prompts by removing the old one
            const existingNoMatch = matchDisplay.querySelector(".no-match");
            if (existingNoMatch) {
                existingNoMatch.remove();
            }

            const noMatch = document.createElement("div");
            noMatch.className = "no-match";
            noMatch.textContent = "Add more teams to start matches";
            matchDisplay.appendChild(noMatch);
        }

        this.updateQueueDisplay();

        // Update draw button state
        this.updateDrawButton();

        function getElementById(id: string): HTMLElement | HTMLInputElement {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Uh oh! Can't get element with id ${id}`);
            }

            return element;
        }

        function getElementByQuerySelector(
            element: HTMLElement,
            selector: string
        ): Element {
            const innerElement = element.querySelector(selector);
            if (!innerElement) {
                throw new Error(
                    `Uh oh! Can't get element with selector ${selector}`
                );
            }

            return innerElement;
        }
    }

    private formatTeamStats(team: Team): string {
        return `${team.wins}W | ${team.draws}D | ${team.losses}L`;
    }

    private updateQueueDisplay() {
        // Update queue display
        const queueList = document.getElementById("queue-list");
        if (!queueList) {
            throw new Error("Uh oh! Can't get the queue list element!");
        }

        queueList.innerHTML = "";
        this.queue.items.forEach((team, index) => {
            const li = document.createElement("li");
            li.className = "queue-item";
            li.innerHTML = `
            <span><b>${team.name}</b> - <em>${this.formatTeamStats(
                team
            )}</em></span>
            <div class="queue-item-buttons">
                <button class="move-button" onclick="game.moveTeamUp('${
                    team.name
                }')" ${index === 0 ? "disabled" : ""} aria-label="Move ${
                team.name
            } up">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button class="move-button" onclick="game.moveTeamDown('${
                    team.name
                }')" ${
                index === this.queue.items.length - 1 ? "disabled" : ""
            } aria-label="Move ${team.name} down">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button class="edit-team" onclick="game.editTeamName('${
                    team.name
                }')" aria-label="Edit ${team.name}">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="remove-team" onclick="game.removeTeam('${
                    team.name
                }')" aria-label="Remove ${team.name}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
            queueList.appendChild(li);
        });

        // Update waiting count
        const waitingCount = document.getElementById("waiting-count");
        if (!waitingCount) {
            throw new Error("Uh oh! Can't get the waiting count element!");
        }

        waitingCount.textContent = `(${this.queue.size()} waiting)`;
    }

    setupNextMatch() {
        switch (this.currentState) {
            case GameState.WAITING_FOR_TEAMS:
                if (this.queue.size() >= 2) {
                    this.slotA.setTeam(getTeamFromQueue(this));
                    this.slotB.setTeam(getTeamFromQueue(this));
                    this.currentState = GameState.MATCH_IN_PROGRESS;
                }
                break;

            case GameState.WINNER_NEEDS_CHALLENGER:
                if (this.queue.size() >= 1) {
                    // Check which slot has the winner
                    if (!this.slotA.isEmpty()) {
                        // Winner in A, fill B
                        this.slotB.setTeam(getTeamFromQueue(this));
                    } else {
                        // Winner in B, fill A
                        this.slotA.setTeam(getTeamFromQueue(this));
                    }
                    this.currentState = GameState.MATCH_IN_PROGRESS;
                }
                break;
        }

        this.saveGameState();
        this.updateDisplay();

        function getTeamFromQueue(gameManager: GameManager): Team {
            const team = gameManager.queue.dequeue();
            if (team) {
                return team;
            } else {
                throw new Error("");
            }
        }
    }

    initializeEventListeners() {
        const newTeamNameElement = document.getElementById("new-team-name");
        if (!newTeamNameElement) {
            throw new Error("Uh oh! Can't init event listeners.");
        }

        newTeamNameElement.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.addTeam();
            }
        });
    }
}

const game = new GameManager();
