export class Team {
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
