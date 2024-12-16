import { Team } from "./team";
import { Slot } from "../misc";

export class MatchSlot {
    position: Slot;
    team: Team | null;

    constructor(position: Slot) {
        this.position = position;
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
