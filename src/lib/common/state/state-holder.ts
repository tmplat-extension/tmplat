export class StateHolder<T> {
  private value: T | null = null;

  clear() {
    this.value = null;
  }

  get(): T | null {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value == null;
  }

  set(value: T) {
    this.value = value;
  }
}
