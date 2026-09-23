import { Construct } from "constructs";
import { addCheckovSkip } from "./addCheckovSkip";
import { CfnResource } from "aws-cdk-lib";

const mockAdd = vi.fn()
const mockGet = vi.fn()

const mockConstruct = {
  node: {
    defaultChild: {
      addMetadata: mockAdd,
      getMetadata: mockGet
    }
  }
} as unknown as Construct;

describe("checkCloudfront", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should properly add checkov skips to empty metadata", async () => {

    mockGet.mockImplementationOnce(() => ({}))

    const mockSkip = {
      id: "test",
      reason: "this is a test"
    }

    addCheckovSkip(mockConstruct, mockSkip)

    expect(mockAdd).toHaveBeenCalledExactlyOnceWith("checkov", {skip: [mockSkip]})
  });

  it("should properly add checkov skips to existing skips", async () => {
    
    const mockOldSkip = {
      id: "test1",
      reason: "this is was already here"
    }

    mockGet.mockImplementationOnce(() => ({skip: [mockOldSkip]}))

    const mockNewSkip = {
      id: "test2",
      reason: "this is a test"
    }
    addCheckovSkip(mockConstruct, mockNewSkip)

    expect(mockAdd).toHaveBeenCalledExactlyOnceWith("checkov", {skip: [mockOldSkip, mockNewSkip]})

  });

  it("should error when the function receives unexpected input", async () => {
  

    // This is invalid because skip should never be 1
    mockGet.mockImplementationOnce(() => ({skip: 1}))

    const mockNewSkip = {
      id: "test2",
      reason: "this is a test"
    }
    expect(() => addCheckovSkip(mockConstruct, mockNewSkip)).toThrow()


  });

  it("should properly handle when the passed object is already a CfnResource", async () => {
  
    const mockNode = {
      addMetadata: mockAdd,
      getMetadata: mockGet
    }

    Object.setPrototypeOf(mockNode, CfnResource.prototype)

    expect(mockNode).toBeInstanceOf(CfnResource)

    const mockSkip = {
      id: "test",
      reason: "this is a test"
    }
    
    addCheckovSkip(mockNode as unknown as Construct, mockSkip)

    expect(mockAdd).toHaveBeenCalledExactlyOnceWith("checkov", {skip: [mockSkip]})

  });
});
