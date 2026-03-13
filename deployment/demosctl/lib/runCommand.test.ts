/* eslint-disable @typescript-eslint/no-explicit-any */
import { reserveRandomColor, runCommand, runShell } from "./runCommand";
import { spawn } from "child_process";
import {type Mock} from "vitest"

vi.mock("child_process");
vi.mock(import("chalk"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    bgBlue: vi.fn(),
    bgGreen: vi.fn(),
    bgYellow: vi.fn(),
    bgRed: vi.fn(),
    bgMagenta: vi.fn(),
    bgCyan: vi.fn(),
    bgWhite: vi.fn(),
    black: vi.fn(),
    red: vi.fn(),
    green: vi.fn(),
    yellow: vi.fn(),
    blue: vi.fn(),
    magenta: vi.fn(),
    cyan: vi.fn(),
    white: vi.fn(),
}
})

describe("runCommand", () => {
  const mockChild = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
  };

  beforeEach(() => {
    // @ts-expect-error prevent invalid process.exit mock
    vi.spyOn(process, "exit").mockImplementation(() => "exit");
    vi.spyOn(console, "log").mockImplementation(() => true);
    vi.spyOn(console, "error").mockImplementation(() => true);
    (spawn as Mock).mockReturnValue(mockChild);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("resolves with code when child closes successfully", async () => {
    mockChild.on.mockImplementation((event: string, cb: any) => {
      if (event === "close") {
        setImmediate(() => cb(0));
      }
    });

    const code = await runCommand("test", "echo", ["hello"]);
    expect(code).toBe(0);
    expect(spawn).toHaveBeenCalledWith("echo", ["hello"], undefined);
  });

  test("rejects when child emits error", async () => {
    const error = new Error("fail");
    mockChild.on.mockImplementation((event: string, cb: any) => {
      if (event === "error") {
        setImmediate(() => cb(error));
      }
    });

    await expect(runCommand("test", "badcmd", [])).rejects.toThrow("fail");
  });

  test("writes stdout and stderr", async () => {
    const writeSpy = vi.spyOn(console, "log").mockImplementation(() => true);

    mockChild.stdout.on.mockImplementation((event: string, cb: any) => {
      if (event === "data") cb("stdout message");
    });

    mockChild.stderr.on.mockImplementation((event: string, cb: any) => {
      if (event === "data") cb("stderr message");
    });

    mockChild.on.mockImplementation((event: string, cb: any) => {
      if (event === "close") setImmediate(() => cb(0));
      if (event === "error") setImmediate(() => {});
    });

    await runCommand("test", "echo", ["hi"]);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("stdout message"));
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("stderr message"));

    writeSpy.mockRestore();
  });
});

describe("runShell", () => {
  let mockChild: any;

  beforeEach(() => {
    mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    };
    (spawn as Mock).mockReturnValue(mockChild);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("resolves with code when shell closes", async () => {
    mockChild.on.mockImplementation((event: string, cb: any) => {
      if (event === "close") setImmediate(() => cb(0));
    });

    const code = await runShell("myshell", "echo hi");
    expect(code).toBe(0);
    expect(spawn).toHaveBeenCalledWith("echo hi", expect.objectContaining({ shell: true }));
  });

  test("rejects on error", async () => {
    const err = new Error("shell fail");
    mockChild.on.mockImplementation((event: string, cb: any) => {
      if (event === "error") setImmediate(() => cb(err));
    });

    await expect(runShell("myshell", "badcmd")).rejects.toThrow("shell fail");
  });
});

describe("reserveRandomColor", () => {
  test("should return blue after other colors are taken", () => {
    let color = "";

    for (let i = 0; i < 20; i++) {
      color = reserveRandomColor();
    }

    expect(color).toEqual("blue");
  });
});
