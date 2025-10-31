import { BUNDLING_STACKS } from "aws-cdk-lib/cx-api";
import { main } from "./app";

import { getSecret } from "./util/getSecret";

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const actual = jest.requireActual("@aws-sdk/client-cognito-identity-provider");
  return {
    ...actual,
    CognitoIdentityProviderClient: jest.fn(() => ({
      send: jest.fn(async (command) => {
        if (command instanceof actual.ListUserPoolsCommand) {
          return { UserPools: [{ Name: "demos-dev-user-pool", Id: "abc123" }] };
        }
        return {};
      }),
    })),
  };
});

jest.mock("@aws-sdk/client-ec2", () => {
  const actual = jest.requireActual("@aws-sdk/client-ec2");
  return {
    ...actual,
    EC2Client: jest.fn(() => ({
      send: jest.fn(async (command) => {
        if (
          command instanceof actual.DescribeManagedPrefixListsCommand ||
          command instanceof actual.GetManagedPrefixListEntriesCommand
        ) {
          return { PrefixLists: [{ PrefixListName: "zscaler" }], Entries: ["0.0.0.0"] };
        }
        return {};
      }),
    })),
  };
});
jest.mock("./util/getSecret");

(getSecret as jest.Mock).mockImplementation(() =>
  JSON.stringify({
    cloudfrontCertificateArn: "arn:aws:acm:us-east-1:0123456789:certificate/fake",
    idmMetadataEndpoint: "test",
    cloudfrontWafHeaderValue: "test",
  })
);

describe("app", () => {
  test("should create proper stacks without database", async () => {
    process.env.EXPECTED_DEMOS_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_REGION = "us-east-1";

    const mockStageName = "unit-test";

    const app = await main({
      stage: mockStageName,
      [BUNDLING_STACKS]: []
    });
    const assembly = app!.synth();

    expect(assembly.getStackByName(`demos-${mockStageName}-core`)).toBeDefined();
    expect(assembly.getStackByName(`demos-${mockStageName}-file-upload`)).toBeDefined();
    expect(assembly.getStackByName(`demos-${mockStageName}-api`)).toBeDefined();
    expect(assembly.getStackByName(`demos-${mockStageName}-ui`)).toBeDefined();

    let dbStackExists = true;
    try {
      assembly.getStackByName(`demos-${mockStageName}-database`);
    } catch {
      dbStackExists = false;
    }

    expect(dbStackExists).toBe(false);
  });

  test("should create db stack", async () => {
    process.env.EXPECTED_DEMOS_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_REGION = "us-east-1";

    const mockStageName = "unit-test";

    const app = await main({
      stage: mockStageName,
      db: "include",
      [BUNDLING_STACKS]: []
    });
    const assembly = app!.synth();

    expect(assembly.getStackByName(`demos-${mockStageName}-core`)).toBeDefined();
    expect(assembly.getStackByName(`demos-${mockStageName}-file-upload`)).toBeDefined();
    expect(assembly.getStackByName(`demos-${mockStageName}-api`)).toBeDefined();
    expect(assembly.getStackByName(`demos-${mockStageName}-ui`)).toBeDefined();
    expect(assembly.getStackByName(`demos-${mockStageName}-database`)).toBeDefined();
  });

  test("should only run bootstrap stack", async () => {
    process.env.EXPECTED_DEMOS_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_REGION = "us-east-1";

    const app = await main({
      stage: "bootstrap",
      [BUNDLING_STACKS]: []
    });
    const assembly = app!.synth();

    expect(assembly.getStackByName(`demos-bootstrap`)).toBeDefined();
  });

  test("should include the DB role stack", async () => {
    process.env.EXPECTED_DEMOS_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_ACCOUNT = "123456";
    process.env.CDK_DEFAULT_REGION = "us-east-1";

    const mockStageName = "dev";

    const app = await main({
      stage: mockStageName,
      [BUNDLING_STACKS]: []
    });
    const assembly = app!.synth();

    expect(assembly.getStackByName(`demos-dev-db-role`)).toBeDefined();
  });
});
