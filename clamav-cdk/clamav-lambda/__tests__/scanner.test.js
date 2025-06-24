import { jest } from "@jest/globals";

// Mock 'child_process' before importing your module
jest.unstable_mockModule("child_process", () => ({
  exec: jest.fn(),
}));

// Now dynamically import AFTER mock
const { exec } = await import("child_process");
const { scanWithClamAV } = await import("../scanner.js");

describe("scanWithClamAV", () => {
  it('returns "Clean" for a clean file', async () => {
    exec.mockImplementation((_cmd, cb) =>
      cb(
        null,
        "/path/hello.txt: OK\n\n----------- SCAN SUMMARY -----------\nInfected files: 0\n"
      )
    );
    const result = await scanWithClamAV(
      "hello.txt",
      "clamav",
      "clamav/clamscan"
    );
    expect(result).toBe("Clean");
  });

  it('returns "Infected" for a bad file', async () => {
    exec.mockImplementation((_cmd, cb) =>
      cb(
        null,
        "/path/eicar.com: Eicar-Test-Signature FOUND\n\n----------- SCAN SUMMARY -----------\nInfected files: 1\n"
      )
    );
    const result = await scanWithClamAV(
      "eicar.com",
      "clamav",
      "clamav/clamscan"
    );
    expect(result).toBe("Infected");
  });

  it("throws an error if exec fails and output doesn't contain 'FOUND'", async () => {
    const fakeError = new Error("Exec failed");
    exec.mockImplementation((_cmd, cb) => cb(fakeError, "Unexpected failure"));

    await expect(
      scanWithClamAV("fail.txt", "clamav", "clamav/clamscan")
    ).rejects.toEqual(fakeError);
  });
});
