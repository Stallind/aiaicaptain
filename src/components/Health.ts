/** Hit points with a short invulnerability window after each hit. */
export class Health {
  private current: number;
  private invulnerableUntil = 0;

  constructor(
    readonly max: number,
    private readonly invulnerableMs: number,
  ) {
    this.current = max;
  }

  get value(): number {
    return this.current;
  }

  get isDead(): boolean {
    return this.current <= 0;
  }

  isInvulnerable(now: number): boolean {
    return now < this.invulnerableUntil;
  }

  /** Returns true if the damage was applied. */
  damage(amount: number, now: number): boolean {
    if (this.isDead || this.isInvulnerable(now)) {
      return false;
    }
    this.current = Math.max(0, this.current - amount);
    this.invulnerableUntil = now + this.invulnerableMs;
    return true;
  }

  kill(): void {
    this.current = 0;
  }
}
