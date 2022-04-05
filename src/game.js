import { Raft, reservoir } from "./data";

export default class Game {
  day = 0;
  hour = 0;
  total_hours = 0;
  reservoirs = [new reservoir()];

  advance(hours) {
    this.total_hours = this.total_hours + hours;
    this.day = Math.floor(this.total_hours / 24)
    this.hour = this.total_hours % 24;
    for (var reservoir in this.reservoirs) {
      reservoir.fill(hours);
    }
  }

  start() {
    this.loopId = setInterval(this.loop, this.speed);
    console.log(this.loopId);
  }

  reset() {
    clearInterval(this.loopId);
  }
}
