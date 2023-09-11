export type Duration = number & { unit: "seconds" };
export const seconds = (value: number) => value as Duration;
export const toMs = (value: Duration) => value * 1000;

export interface Clock {
  now(): Date;
}
export class RealClock implements Clock {
  now(): Date {
    return new Date();
  }
}
export class FakeClock implements Clock {
  private nowInMs = new Date().getTime();
  now(): Date {
    return new Date(this.nowInMs);
  }
  advance(duration: Duration) {
    this.nowInMs += toMs(duration);
  }
}
