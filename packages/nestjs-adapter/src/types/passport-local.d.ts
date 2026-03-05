declare module 'passport-local' {
  export class Strategy {
    constructor(options: unknown, verify?: (...args: unknown[]) => unknown);
  }
}
