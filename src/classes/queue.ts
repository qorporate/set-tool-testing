import { Team } from "./team";

export class Queue {
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
