import { EventEmitter } from "@angular/core";

export class CallTable {
  private calls: { [index: string]: number } = {};

  updated: EventEmitter<string> = new EventEmitter<string>();

  get(name: string): number {
    return this.calls[name] || 0;
  }

  increment(name: string): void {
    const current = this.get(name) + 1;
    this.calls[name] = current;
    this.updated.emit(name);
  }
}
