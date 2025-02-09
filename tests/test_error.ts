import { expect, test } from "bun:test";

export function test_error(
  description: string,
  promise: () => Promise<any>,
  error_message: string,
) {
  test(
    `fails when ${description}`,
    () => expect(promise()).rejects.toThrowError(`Assertion failed: ${error_message}`),
    60_000,
  );
}
