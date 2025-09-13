import { generateTempPassword } from "./password";

describe("password", () => {
  test("should return a password of the proper length", () => {
    let pw = generateTempPassword();
    expect(pw).toHaveLength(20);
    pw = generateTempPassword(30);
    expect(pw).toHaveLength(30);
    pw = generateTempPassword(12);
    expect(pw).toHaveLength(12);
    pw = generateTempPassword(50);
    expect(pw).toHaveLength(50);
  });

  test("should always return passwords with at least one of each character type", () => {
    for (let i = 0; i < 100; i++) {
      const pw = generateTempPassword();
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[!@#$%^&*]/);
    }
  });
});
