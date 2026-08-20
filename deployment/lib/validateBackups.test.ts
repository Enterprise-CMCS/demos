const {
  mockBackupValidationResult,
  mockPaginateListObjectsV2,
  mockPoolEnd,
  mockPoolQuery,
  mockRandomInt,
  mockRdsSend,
  mockS3Send,
  mockSecretsManagerSend,
} = vi.hoisted(() => ({
  mockBackupValidationResult: vi.fn(),
  mockPaginateListObjectsV2: vi.fn(),
  mockPoolEnd: vi.fn(),
  mockPoolQuery: vi.fn(),
  mockRandomInt: vi.fn(),
  mockRdsSend: vi.fn(),
  mockS3Send: vi.fn(),
  mockSecretsManagerSend: vi.fn(),
}));

vi.mock(import("@aws-sdk/client-s3"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    paginateListObjectsV2: mockPaginateListObjectsV2,
    S3Client: vi.fn().mockImplementation(function () {
      return { send: mockS3Send };
    }),
  };
});

vi.mock(import("@aws-sdk/client-backup"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Backup: vi.fn().mockImplementation(function () {
      return { putRestoreValidationResult: mockBackupValidationResult };
    }),
  };
});

vi.mock(import("@aws-sdk/client-rds"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    RDSClient: vi.fn().mockImplementation(function () {
      return { send: mockRdsSend };
    }),
  };
});

vi.mock(import("@aws-sdk/client-secrets-manager"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    SecretsManagerClient: vi.fn().mockImplementation(function () {
      return { send: mockSecretsManagerSend };
    }),
  };
});

vi.mock("pg", () => ({
  Pool: vi.fn().mockImplementation(function () {
    return { end: mockPoolEnd, query: mockPoolQuery };
  }),
}));

vi.mock(import("node:crypto"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    randomInt: mockRandomInt,
  };
});

import { RestoreValidationStatus } from "@aws-sdk/client-backup";
import { DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  getRDSEndpoint,
  handler,
  parseBucketName,
  selectRandomObjects,
  validateS3Event,
  validateSelectedObjects,
} from "./validateBackups";

function pages(...responses: Array<{ Contents?: Array<{ Key?: string; ETag?: string }> }>) {
  return (async function* () {
    yield* responses;
  })();
}

function restoreEvent(
  detailOverrides: Partial<Parameters<typeof handler>[0]["detail"]> = {},
): Parameters<typeof handler>[0] {
  return {
    account: "123456789012",
    detail: {
      backupSizeInBytes: "100",
      backupVaultArn: "arn:aws:backup:us-east-1:123456789012:backup-vault:test",
      completionDate: "2026-08-20T12:00:00Z",
      createdResourceArn: "arn:aws:s3:::restored-bucket",
      creationDate: "2026-08-20T11:00:00Z",
      iamRoleArn: "arn:aws:iam::123456789012:role/test",
      isParent: false,
      percentDone: 100,
      recoveryPointArn: "arn:aws:backup:us-east-1:123456789012:recovery-point:test",
      resourceType: "S3",
      restoreJobId: "restore-job-id",
      restoreTestingPlanArn: "arn:aws:backup:us-east-1:123456789012:restore-testing-plan:test",
      sourceResourceArn: "arn:aws:s3:::source-bucket",
      status: "COMPLETED",
      ...detailOverrides,
    },
    "detail-type": "Restore Job State Change",
    id: "event-id",
    region: "us-east-1",
    resources: [],
    source: "aws.backup",
    time: "2026-08-20T12:00:00Z",
    version: "0",
  };
}

describe("Validate Backups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("selectRandomObjects", () => {
    test("selects one object per page and stops after five objects", async () => {
      const objects = Array.from({ length: 6 }, (_, index) => ({
        Key: `object-${index}.json`,
        ETag: `etag-${index}`,
      }));
      mockPaginateListObjectsV2.mockReturnValue(
        pages(...objects.map((object) => ({ Contents: [object] }))),
      );
      mockRandomInt.mockReturnValue(0);

      const result = await selectRandomObjects("restored-bucket");

      expect(mockPaginateListObjectsV2).toHaveBeenCalledWith(
        expect.objectContaining({ client: expect.anything() }),
        { Bucket: "restored-bucket" },
      );
      expect(result).toEqual(objects.slice(0, 5));
      expect(mockRandomInt).toHaveBeenCalledTimes(5);
    });

    test("skips folder entries and objects without keys until it finds a file", async () => {
      const file = { Key: "documents/report.pdf", ETag: "report-etag" };
      mockPaginateListObjectsV2.mockReturnValue(
        pages({
          Contents: [{ Key: "documents/" }, { ETag: "missing-key" }, file],
        }),
      );
      mockRandomInt
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2);

      await expect(selectRandomObjects("restored-bucket")).resolves.toEqual([file]);
      expect(mockRandomInt).toHaveBeenCalledTimes(3);
    });

    test.each([
      ["missing contents", {}],
      ["an empty contents list", { Contents: [] }],
    ])("returns undefined when a page has %s", async (_description, page) => {
      mockPaginateListObjectsV2.mockReturnValue(pages(page));

      await expect(selectRandomObjects("restored-bucket")).resolves.toBeUndefined();
      expect(mockRandomInt).not.toHaveBeenCalled();
    });

    test("gives up after 100 attempts when a page has no valid files", async () => {
      mockPaginateListObjectsV2.mockReturnValue(
        pages({ Contents: [{ Key: "folder/" }] }),
      );
      mockRandomInt.mockReturnValue(0);

      await expect(selectRandomObjects("restored-bucket")).resolves.toEqual([]);
      expect(mockRandomInt).toHaveBeenCalledTimes(100);
    });

    test("returns an empty list when listing the bucket fails", async () => {
      const error = new Error("S3 is unavailable");
      mockPaginateListObjectsV2.mockReturnValue(
        (async function* () {
          yield await Promise.reject(error);
        })(),
      );

      await expect(selectRandomObjects("restored-bucket")).resolves.toEqual([]);
      expect(console.log).toHaveBeenCalledWith(error);
    });
  });

  describe("validateSelectedObjects", () => {
    test("returns only objects whose restored ETag differs from the source", async () => {
      const matchingObject = { Key: "matching.txt", ETag: "same-etag" };
      const changedObject = { Key: "changed.txt", ETag: "old-etag" };
      mockS3Send
        .mockResolvedValueOnce({ ETag: "same-etag" })
        .mockResolvedValueOnce({ ETag: "new-etag" });

      const errors = await validateSelectedObjects("source-bucket", [
        matchingObject,
        changedObject,
      ]);

      expect(errors).toEqual([
        { resp: { ETag: "new-etag" }, obj: changedObject },
      ]);
      expect(mockS3Send).toHaveBeenCalledTimes(2);
      expect(mockS3Send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
      expect(mockS3Send.mock.calls[0][0].input).toEqual({
        Bucket: "source-bucket",
        Key: "matching.txt",
      });
    });

    test("reports an S3 error instead of rejecting", async () => {
      const error = new Error("head request failed");
      mockS3Send.mockRejectedValue(error);

      await expect(
        validateSelectedObjects("source-bucket", [{ Key: "file.txt" }]),
      ).resolves.toEqual([error]);
    });
  });

  describe("parseBucketName", () => {
    test("extracts the bucket name from an S3 ARN", () => {
      expect(parseBucketName("arn:aws:s3:::my-restored-bucket")).toBe(
        "my-restored-bucket",
      );
    });
  });

  describe("validateS3Event", () => {
    test("marks validation as failed when a selected object's ETag changed", async () => {
      const restoredObject = { Key: "report.pdf", ETag: "restored-etag" };
      mockPaginateListObjectsV2.mockReturnValue(
        pages({ Contents: [restoredObject] }),
      );
      mockRandomInt.mockReturnValue(0);
      mockS3Send.mockResolvedValue({ ETag: "source-etag" });
      mockBackupValidationResult.mockResolvedValue({});

      await expect(validateS3Event(restoreEvent())).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({ message: "complete" }),
      });
      expect(mockBackupValidationResult).toHaveBeenCalledWith(
        expect.objectContaining({
          RestoreJobId: "restore-job-id",
          ValidationStatus: RestoreValidationStatus.FAILED,
        }),
      );
    });
  });

  describe("getRDSEndpoint", () => {
    test("returns the hostname and port from the first DB instance", async () => {
      mockRdsSend.mockResolvedValue({
        DBInstances: [{ Endpoint: { Address: "database.example", Port: 5432 } }],
      });

      await expect(getRDSEndpoint("database-arn")).resolves.toEqual({
        hostname: "database.example",
        port: 5432,
      });
      expect(mockRdsSend.mock.calls[0][0]).toBeInstanceOf(
        DescribeDBInstancesCommand,
      );
      expect(mockRdsSend.mock.calls[0][0].input).toEqual({
        DBInstanceIdentifier: "database-arn",
      });
    });

    test("rejects when RDS does not return an endpoint address", async () => {
      mockRdsSend.mockResolvedValue({ DBInstances: [] });

      await expect(getRDSEndpoint("database-arn")).rejects.toThrow(
        "rds endpoint not found",
      );
    });
  });

  describe("database configuration", () => {
    test("loads and caches the database secret", async () => {
      vi.resetModules();
      const { getDatabaseSecret } = await import("./validateBackups");
      process.env.DATABASE_SECRET_ARN = "database-secret-arn"; // pragma: allowlist secret
      const secret = { username: "dbuser", password: "secret", dbname: "demos" };  // pragma: allowlist secret
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: JSON.stringify(secret),
      });

      await expect(getDatabaseSecret()).resolves.toEqual(secret);
      await expect(getDatabaseSecret()).resolves.toEqual(secret);
      expect(mockSecretsManagerSend).toHaveBeenCalledTimes(1);
      expect(mockSecretsManagerSend.mock.calls[0][0]).toBeInstanceOf(
        GetSecretValueCommand,
      );
      expect(mockSecretsManagerSend.mock.calls[0][0].input).toEqual({
        SecretId: "database-secret-arn",  // pragma: allowlist secret
      });
    });

    test("builds a PostgreSQL URL from the secret and RDS endpoint", async () => {
      vi.resetModules();
      const { getDatabaseURL } = await import("./validateBackups");
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: JSON.stringify({
          username: "dbuser",
          password: "secret",  // pragma: allowlist secret
          dbname: "demos",
        }),
      });
      mockRdsSend.mockResolvedValue({
        DBInstances: [{ Endpoint: { Address: "database.example", Port: 5432 } }],
      });

      await expect(getDatabaseURL("database-arn")).resolves.toBe(
        "postgresql://dbuser:secret@database.example:5432/demos",  // pragma: allowlist secret
      );
    });
  });

  describe("validateRDSEvent", () => {
    test("fails validation when an expected table is empty and closes the pool", async () => {
      vi.resetModules();
      const { validateRDSEvent } = await import("./validateBackups");
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: JSON.stringify({
          username: "dbuser",
          password: "secret",  // pragma: allowlist secret
          dbname: "demos",
        }),
      });
      mockRdsSend.mockResolvedValue({
        DBInstances: [{ Endpoint: { Address: "database.example", Port: 5432 } }],
      });
      mockPoolQuery.mockResolvedValue({
        rows: [{ amendment: "2", application: "0", document: "4" }],
      });
      mockBackupValidationResult.mockResolvedValue({});

      await expect(
        validateRDSEvent(
          restoreEvent({
            createdResourceArn: "database-arn",
            resourceType: "RDS",
          }),
        ),
      ).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({ message: "complete" }),
      });
      expect(mockPoolEnd).toHaveBeenCalledOnce();
      expect(console.error).toHaveBeenCalledWith("Empty tables: application");
      expect(mockBackupValidationResult).toHaveBeenCalledWith(
        expect.objectContaining({
          RestoreJobId: "restore-job-id",
          ValidationStatus: RestoreValidationStatus.FAILED,
        }),
      );
    });
  });

  describe("handler", () => {
    test("does not validate a restore job that is not complete", async () => {
      await expect(handler(restoreEvent({ status: "RUNNING" }))).resolves.toEqual({
        statusCode: 200,
        body: JSON.stringify({
          message: "validation only runs on completed restore jobs",
        }),
      });
      expect(mockPaginateListObjectsV2).not.toHaveBeenCalled();
      expect(mockRdsSend).not.toHaveBeenCalled();
    });

    test("returns a bad request for an unsupported completed resource", async () => {
      await expect(
        handler(restoreEvent({ resourceType: "DynamoDB" })),
      ).resolves.toEqual({
        statusCode: 400,
        body: JSON.stringify({
          message: "the resource type DynamoDB is not currently supported",
        }),
      });
    });
  });
});
