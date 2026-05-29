declare module "node:assert/strict" {
  export function deepEqual(actual: unknown, expected: unknown, message?: string): void;
  export function doesNotThrow(fn: () => unknown, message?: string): void;
  export function equal(actual: unknown, expected: unknown, message?: string): void;
  export function match(value: string, regexp: RegExp, message?: string): void;
  export function ok(value: unknown, message?: string): asserts value;
  export function rejects(fn: () => Promise<unknown>, expected?: RegExp, message?: string): Promise<void>;
  export function throws(fn: () => unknown, expected?: RegExp, message?: string): void;
}

declare module "node:test" {
  export function afterEach(fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
}

declare const process: {
  env: Record<string, string | undefined>;
};
