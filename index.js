var Queue = /** @class */ (function () {
    function Queue() {
        this.items = [];
    }
    Queue.prototype.enqueue = function (item) {
        this.items.push(item);
    };
    Queue.prototype.dequeue = function () {
        return this.items.shift();
    };
    Queue.prototype.peek = function () {
        return this.items[0];
    };
    Queue.prototype.isEmpty = function () {
        return this.items.length === 0;
    };
    Queue.prototype.size = function () {
        return this.items.length;
    };
    Queue.prototype.remove = function (teamName) {
        this.items = this.items.filter(function (team) { return team.name !== teamName; });
    };
    Queue.prototype.moveUp = function (teamName) {
        var index = this.items.findIndex(function (team) { return team.name === teamName; });
        if (index > 0) {
            var temp = this.items[index];
            this.items[index] = this.items[index - 1];
            this.items[index - 1] = temp;
        }
    };
    Queue.prototype.moveDown = function (teamName) {
        var index = this.items.findIndex(function (team) { return team.name === teamName; });
        if (index < this.items.length - 1) {
            var temp = this.items[index];
            this.items[index] = this.items[index + 1];
            this.items[index + 1] = temp;
        }
    };
    return Queue;
}());
var Team = /** @class */ (function () {
    function Team(name) {
        this.name = name;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.currentStreak = 0;
    }
    return Team;
}());
var GameState = /** @class */ (function () {
    function GameState() {
    }
    GameState.WAITING_FOR_TEAMS = "WAITING_FOR_TEAMS";
    GameState.MATCH_IN_PROGRESS = "MATCH_IN_PROGRESS";
    GameState.WINNER_NEEDS_CHALLENGER = "WINNER_NEEDS_CHALLENGER";
    return GameState;
}());
var MatchResult;
(function (MatchResult) {
    MatchResult["Team1"] = "team1";
    MatchResult["Team2"] = "team2";
    MatchResult["Draw"] = "draw";
})(MatchResult || (MatchResult = {}));
var MatchSlot = /** @class */ (function () {
    function MatchSlot(position) {
        this.position = position; // 'A' or 'B'
        this.team = null;
    }
    MatchSlot.prototype.setTeam = function (team) {
        this.team = team;
    };
    MatchSlot.prototype.clear = function () {
        this.team = null;
    };
    MatchSlot.prototype.isEmpty = function () {
        return this.team === null;
    };
    return MatchSlot;
}());
var GameManager = /** @class */ (function () {
    function GameManager() {
        this.slotA = new MatchSlot("A");
        this.slotB = new MatchSlot("B");
        this.queue = new Queue();
        this.errorTimeout = null;
        this.currentState = GameState.WAITING_FOR_TEAMS;
        this.initializeEventListeners();
        this.loadGameState();
        this.updateDisplay();
    }
    GameManager.prototype.showError = function (message) {
        var errorDiv = document.getElementById("error-message");
        if (!errorDiv) {
            throw Error("Uh Oh! Can't show an error!");
        }
        errorDiv.textContent = message;
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }
        this.errorTimeout = setTimeout(function () {
            errorDiv.textContent = "";
        }, 3000);
    };
    GameManager.prototype.addTeam = function () {
        var _a, _b;
        var input = document.getElementById("new-team-name");
        if (!input) {
            throw new Error("Uh oh! Can't get the new team name!");
        }
        var teamName = input.value.trim().toUpperCase();
        if (!teamName) {
            this.showError("Please enter a team name");
            return;
        }
        if (this.queue.items.some(function (team) { return team.name === teamName; }) ||
            ((_a = this.slotA.team) === null || _a === void 0 ? void 0 : _a.name) === teamName ||
            ((_b = this.slotB.team) === null || _b === void 0 ? void 0 : _b.name) === teamName) {
            this.showError("Team name already exists");
            return;
        }
        var newTeam = new Team(teamName);
        this.queue.enqueue(newTeam);
        input.value = "";
        if (!this.slotA.team || !this.slotB.team) {
            this.setupNextMatch();
        }
        this.saveGameState();
        this.updateDisplay();
    };
    GameManager.prototype.removeTeam = function (teamName) {
        var _a, _b;
        // If the team is in the current match, we need to handle that
        if (((_a = this.slotA.team) === null || _a === void 0 ? void 0 : _a.name) === teamName ||
            ((_b = this.slotB.team) === null || _b === void 0 ? void 0 : _b.name) === teamName) {
            this.slotA.team = null;
            this.slotB.team = null;
            this.setupNextMatch();
        }
        this.queue.remove(teamName);
        this.saveGameState();
        this.updateDisplay();
    };
    GameManager.prototype.moveTeamUp = function (teamName) {
        this.queue.moveUp(teamName);
        this.saveGameState();
        this.updateDisplay();
    };
    GameManager.prototype.moveTeamDown = function (teamName) {
        this.queue.moveDown(teamName);
        this.saveGameState();
        this.updateDisplay();
    };
    GameManager.prototype.loadGameState = function () {
        var savedState = localStorage.getItem("gameState");
        if (savedState) {
            var state = JSON.parse(savedState);
            this.queue.items = state.queueItems.map(function (item) { return item; });
            this.slotA.team = state.teamInMatchA ? state.teamInMatchA : null;
            this.slotB.team = state.teamInMatchB ? state.teamInMatchB : null;
            this.currentState = state.currentState;
            this.updateDisplay();
        }
    };
    GameManager.prototype.saveGameState = function () {
        var state = {
            queueItems: this.queue.items,
            teamInMatchA: this.slotA.team,
            teamInMatchB: this.slotB.team,
            currentState: this.currentState,
        };
        localStorage.setItem("gameState", JSON.stringify(state));
    };
    GameManager.prototype.resetGame = function () {
        var confirmation = confirm("Are you sure you want to reset the game? This action is unrecoverable.");
        if (confirmation) {
            localStorage.removeItem("gameState");
            location.reload(); // Refresh the page
        }
    };
    GameManager.prototype.editTeamName = function (oldName) {
        var _a, _b, _c, _d, _e;
        var newName = (_a = prompt("Enter new team name:", oldName)) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase();
        if (!newName || newName === oldName) {
            return;
        }
        // Check if new name already exists
        if (this.queue.items.some(function (team) { return team.name === newName; }) ||
            ((_b = this.slotA.team) === null || _b === void 0 ? void 0 : _b.name) === newName ||
            ((_c = this.slotB.team) === null || _c === void 0 ? void 0 : _c.name) === newName) {
            this.showError("Team name already exists");
            return;
        }
        // Update name in queue
        var team = this.queue.items.find(function (team) { return team.name === oldName; });
        if (team) {
            team.name = newName;
        }
        // Update name in slots if necessary
        if (((_d = this.slotA.team) === null || _d === void 0 ? void 0 : _d.name) === oldName) {
            this.slotA.team.name = newName;
        }
        if (((_e = this.slotB.team) === null || _e === void 0 ? void 0 : _e.name) === oldName) {
            this.slotB.team.name = newName;
        }
        this.saveGameState();
        this.updateDisplay();
    };
    GameManager.prototype.swapTeamInMatch = function (slot) {
        if (this.queue.isEmpty()) {
            this.showError("No teams in queue to swap");
            return;
        }
        var teamToSwap = slot === "A" ? this.slotA.team : this.slotB.team;
        if (!teamToSwap) {
            this.showError("No team in slot ".concat(slot, " to swap"));
            return;
        }
        var newTeam = this.queue.dequeue();
        if (!newTeam) {
            throw new Error("Queue is empty");
        }
        if (slot === "A") {
            this.slotA.setTeam(newTeam);
        }
        else {
            this.slotB.setTeam(newTeam);
        }
        this.queue.enqueue(teamToSwap);
        this.saveGameState();
        this.updateDisplay();
    };
    GameManager.prototype.handleResult = function (result) {
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
        }
        else if (result === "team2") {
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
        }
        else if (result === "draw") {
            this.slotA.team.draws++;
            this.slotA.team.currentStreak = 0;
            this.slotB.team.draws++;
            this.slotB.team.currentStreak = 0;
            if (this.slotA.team.wins <= this.slotB.team.wins) {
                this.queue.enqueue(this.slotA.team);
                this.queue.enqueue(this.slotB.team);
            }
            else {
                this.queue.enqueue(this.slotB.team);
                this.queue.enqueue(this.slotA.team);
            }
            this.slotA.clear();
            this.slotB.clear();
            this.currentState = GameState.WAITING_FOR_TEAMS;
        }
        // we don't save state here, because the next method alters the state again
        this.setupNextMatch();
    };
    GameManager.prototype.updateDrawButton = function () {
        var drawButton = document.getElementById("draw-button");
        if (!drawButton) {
            return;
        }
        // Disable draw button if there's only one or no teams waiting
        drawButton.disabled = this.queue.size() <= 1;
    };
    GameManager.prototype.updateSwapButton = function () {
        var team1SwapButton = document.getElementById("team1-swap-button");
        if (!team1SwapButton) {
            throw new Error("Uh oh! No swap button for team 1.");
        }
        var team2SwapButton = document.getElementById("team2-swap-button");
        if (!team2SwapButton) {
            throw new Error("Uh oh! No swap button for team 2.");
        }
        if (this.queue.isEmpty()) {
            team1SwapButton.disabled = true;
            team2SwapButton.disabled = true;
        }
        else {
            team1SwapButton.disabled = false;
            team2SwapButton.disabled = false;
        }
    };
    GameManager.prototype.updateDisplay = function () {
        var matchDisplay = document.getElementById("match-display");
        if (!matchDisplay) {
            throw new Error("Uh oh! Can't get the match display element.");
        }
        var currentMatch = document.getElementById("current-match");
        if (!currentMatch) {
            throw new Error("Uh oh! Can't get the current match element!");
        }
        var buttons = document.querySelector(".buttons");
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
            getElementByQuerySelector(getElementById("team1"), "h2").textContent = this.slotA.team.name;
            getElementById("team1-stats").textContent = this.formatTeamStats(this.slotA.team);
            getElementById("team1-streak").textContent =
                this.slotA.team.currentStreak.toString();
            getElementByQuerySelector(getElementById("team2"), "h2").textContent = this.slotB.team.name;
            getElementById("team2-stats").textContent = this.formatTeamStats(this.slotB.team);
            getElementById("team2-streak").textContent =
                this.slotB.team.currentStreak.toString();
            // Update button text with team names
            getElementById("left-team-name").textContent = "".concat(this.slotA.team.name, " Wins");
            getElementById("right-team-name").textContent = "".concat(this.slotB.team.name, " Wins");
            // Update no-match message based on queue size
            var existingNoMatch = matchDisplay.querySelector(".no-match");
            if (existingNoMatch) {
                existingNoMatch.remove();
            }
            if (this.queue.size() < 1) {
                var noMatch = document.createElement("div");
                noMatch.className = "no-match";
                noMatch.textContent = "Add more teams to swap out losers";
                matchDisplay.appendChild(noMatch);
            }
        }
        else {
            // don't display a match
            currentMatch.style.display = "none";
            buttons.style.display = "none";
            // prompt the user to add more teams
            // but prevent duplicate prompts by removing the old one
            var existingNoMatch = matchDisplay.querySelector(".no-match");
            if (existingNoMatch) {
                existingNoMatch.remove();
            }
            var noMatch = document.createElement("div");
            noMatch.className = "no-match";
            noMatch.textContent = "Add more teams to start matches";
            matchDisplay.appendChild(noMatch);
        }
        this.updateQueueDisplay();
        // Update button state
        this.updateDrawButton();
        this.updateSwapButton();
        // todo: move to util section
        function getElementById(id) {
            var element = document.getElementById(id);
            if (!element) {
                throw new Error("Uh oh! Can't get element with id ".concat(id));
            }
            return element;
        }
        function getElementByQuerySelector(element, selector) {
            var innerElement = element.querySelector(selector);
            if (!innerElement) {
                throw new Error("Uh oh! Can't get element with selector ".concat(selector));
            }
            return innerElement;
        }
    };
    GameManager.prototype.formatTeamStats = function (team) {
        return "".concat(team.wins, "W | ").concat(team.draws, "D | ").concat(team.losses, "L");
    };
    GameManager.prototype.updateQueueDisplay = function () {
        var _this = this;
        // Update queue display
        var queueList = document.getElementById("queue-list");
        if (!queueList) {
            throw new Error("Uh oh! Can't get the queue list element!");
        }
        queueList.innerHTML = "";
        this.queue.items.forEach(function (team, index) {
            var li = document.createElement("li");
            li.className = "queue-item";
            li.innerHTML = "\n            <span><b>".concat(team.name, "</b> - <em>").concat(_this.formatTeamStats(team), "</em></span>\n            <div class=\"queue-item-buttons\">\n                <button class=\"move-button\" onclick=\"game.moveTeamUp('").concat(team.name, "')\" ").concat(index === 0 ? "disabled" : "", " aria-label=\"Move ").concat(team.name, " up\">\n                    <i class=\"fas fa-chevron-up\"></i>\n                </button>\n                <button class=\"move-button\" onclick=\"game.moveTeamDown('").concat(team.name, "')\" ").concat(index === _this.queue.items.length - 1 ? "disabled" : "", " aria-label=\"Move ").concat(team.name, " down\">\n                    <i class=\"fas fa-chevron-down\"></i>\n                </button>\n                <button class=\"edit-team-button match-team-button\" onclick=\"game.editTeamName('").concat(team.name, "')\" aria-label=\"Edit ").concat(team.name, "\">\n                    <i class=\"fas fa-pencil-alt\"></i>\n                </button>\n                <button class=\"remove-team\" onclick=\"game.removeTeam('").concat(team.name, "')\" aria-label=\"Remove ").concat(team.name, "\">\n                    <i class=\"fas fa-trash-alt\"></i>\n                </button>\n            </div>\n        ");
            queueList.appendChild(li);
        });
        // Update waiting count
        var waitingCount = document.getElementById("waiting-count");
        if (!waitingCount) {
            throw new Error("Uh oh! Can't get the waiting count element!");
        }
        waitingCount.textContent = "(".concat(this.queue.size(), " waiting)");
    };
    /// Why do we set the currentStreak to 0 when adding new teams?
    /// well, when we added the feature to move teams into the queue from a match
    /// we found the streak was maintained.
    /// I chose not to clear the streak in that function, in case the team moved was immediately
    /// put back in the match.
    /// So, whenever a new team enters the match, we make sure to reset the value.
    GameManager.prototype.setupNextMatch = function () {
        switch (this.currentState) {
            case GameState.WAITING_FOR_TEAMS:
                if (this.queue.size() >= 2) {
                    var teamA = getTeamFromQueue(this);
                    teamA.currentStreak = 0;
                    var teamB = getTeamFromQueue(this);
                    teamB.currentStreak = 0;
                    this.slotA.setTeam(teamA);
                    this.slotB.setTeam(teamB);
                    this.currentState = GameState.MATCH_IN_PROGRESS;
                }
                break;
            case GameState.WINNER_NEEDS_CHALLENGER:
                if (this.queue.size() >= 1) {
                    // Check which slot has the winner
                    if (!this.slotA.isEmpty()) {
                        // Winner in A, fill B
                        var newTeam = getTeamFromQueue(this);
                        newTeam.currentStreak = 0;
                        this.slotB.setTeam(newTeam);
                    }
                    else {
                        // Winner in B, fill A
                        var newTeam = getTeamFromQueue(this);
                        newTeam.currentStreak = 0;
                        this.slotA.setTeam(newTeam);
                    }
                    this.currentState = GameState.MATCH_IN_PROGRESS;
                }
                break;
        }
        this.saveGameState();
        this.updateDisplay();
        function getTeamFromQueue(gameManager) {
            var team = gameManager.queue.dequeue();
            if (team) {
                return team;
            }
            else {
                throw new Error("");
            }
        }
    };
    GameManager.prototype.initializeEventListeners = function () {
        var _this = this;
        var newTeamNameElement = document.getElementById("new-team-name");
        if (!newTeamNameElement) {
            throw new Error("Uh oh! Can't init event listeners.");
        }
        newTeamNameElement.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                _this.addTeam();
            }
        });
    };
    return GameManager;
}());
var game = new GameManager();
