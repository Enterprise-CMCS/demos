#!/usr/bin/env python3
import urllib.request
import json
import subprocess
import uuid

def graphql_request(query, variables={}, url="http://localhost:4000/"):
    """Make a GraphQL request with the given query and variables."""
    headers = {"Content-Type": "application/json"}
    payload = {
        "query": query,
        "variables": variables
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("UTF-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as response:
        result = response.read()
    return json.loads(result.decode())

def run_mutator(mutator, input_idx=0):
    """Run a mutator and pass a given input based on the index"""
    return graphql_request(
        MUTATORS[mutator],
        INPUTS[mutator][input_idx]
    )

def run_and_return_id(create_mutator, input_idx=0):
    """Run a creation mutator and return the new ID."""
    return run_mutator(
        create_mutator,
        input_idx
    ).get("data").get(create_mutator).get("id")

# Seed the DB for testing
subprocess.run("npm run seed", shell=True)

# Formatting
print("\nTEST ASSERTIONS\n---------------")

QUERIES = {
    "amendmentStatus": {
        "idAndDescription": """
            query Query($id: String!) {
              amendmentStatus(id: $id) {
                id
                description
              }
            }
        """,
        "idAndAmendments": """
            query Query($id: String!) {
              amendmentStatus(id: $id) {
                id
                amendments {
                  id
                }
              }
            }
        """
    },
    "amendmentStatuses": {
        "idAndDescription": """
            query Query {
              amendmentStatuses {
                id
                description
              }
            }
        """
    },
    "amendment": {
        "idAndDescription": """
            query Query($id: ID!) {
              amendment(id: $id) {
                id
                description
              }
            }
        """,
        "idAndDocuments": """
            query Query($id: ID!) {
              amendment(id: $id) {
                id
                documents {
                  id
                }
              }
            }
        """
    },
    "amendments": {
        "idAndDescription": """
            query Query {
              amendments {
                id
                description
              }
            }
        """
    },
    "document": {
        "idAndDescriptionAndBundleType": """
          query Document($id: ID!) {
            document(id: $id) {
              id
              description
              bundleType
            }
          }
        """,
        "idAndDescriptionAndBundle": """
            query Document($id: ID!) {
              document(id: $id) {
                id
                description
                bundle {
                  ... on Demonstration {
                    id
                  }
                  ... on Amendment {
                    id
                  }
                }
              }
            }
        """
    },
    "demonstration": {
        "idAndAmendments": """
            query Query($id: ID!) {
              demonstration(id: $id) {
                id
                amendments {
                  id
                }
              }
            }
        """
    }
}

MUTATORS = {
    "addUser": """
        mutation Mutation($input: AddUserInput!) {
          addUser(input: $input) {
            id
          }
        }
    """,
    "addState": """
        mutation Mutation($input: AddStateInput!) {
          addState(input: $input) {
            id
          }
        }
    """,
    "addDocumentType": """
        mutation Mutation($input: AddDocumentTypeInput!) {
          addDocumentType(input: $input) {
            id
          }
        }
    """,
    "addDemonstrationStatus": """
        mutation Mutation($input: AddDemonstrationStatusInput!) {
          addDemonstrationStatus(input: $input) {
            id
          }
        }
    """,
    "addAmendmentStatus": """
        mutation Mutation($input: AddAmendmentStatusInput!) {
          addAmendmentStatus(input: $input) {
            id
          }
        }
    """,
    "addDemonstration": """
        mutation AddDemonstration($input: AddDemonstrationInput!) {
          addDemonstration(input: $input) {
            id
          }
        }
    """,
    "addAmendment": """
        mutation Mutation($input: AddAmendmentInput!) {
          addAmendment(input: $input) {
            id
          }
        }
    """,
    "updateAmendmentStatus": """
        mutation UpdateAmendmentStatus($id: String!, $input: UpdateAmendmentStatusInput!) {
          updateAmendmentStatus(id: $id, input: $input) {
            id
          }
        }
    """,
    "updateAmendment": """
        mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
          updateAmendment(id: $id, input: $input) {
            id
          }
        }
    """,
    "addAmendmentDocument": """
        mutation Mutation($input: AddAmendmentDocumentInput!) {
          addAmendmentDocument(input: $input) {
            id
          }
        }
    """,
    "updateAmendmentDocument": """
        mutation UpdateAmendmentDocument($id: ID!, $input: UpdateAmendmentDocumentInput!) {
          updateAmendmentDocument(id: $id, input: $input) {
            id
          }
        }
    """,
    "deleteAmendmentDocument": """
        mutation DeleteAmendmentDocument($id: ID!) {
          deleteAmendmentDocument(id: $id) {
            id
          }
        }
    """,
    "deleteAmendment": """
        mutation DeleteAmendment($id: ID!) {
          deleteAmendment(id: $id) {
            id
          }
        }
    """,
    "deleteAmendmentStatus": """
        mutation DeleteAmendmentStatus($id: String!) {
          deleteAmendmentStatus(id: $id) {
            id
          }
        }
    """
}

INPUTS = {
    "addUser": [
        {
            "input": {
                "cognitoSubject": str(uuid.uuid4()),
                "displayName": "Test user",
                "email": "test@user.mail",
                "fullName": "Testington J. Userman",
                "username": "test.user"
            }
        },
        {
            "input": {
                "cognitoSubject": str(uuid.uuid4()),
                "displayName": "Test user 2",
                "email": "test2@user.mail",
                "fullName": "Testington J. Userman III",
                "username": "test.user2"
            }
        }
    ],
    "addState": [
        {
            "input": {
                "stateCode": "CS",
                "stateName": "Cascadia"
            }
        }
    ],
    "addDocumentType": [
        {
            "input": {
                "id": "NOTIFICATION_OF_SUCCESS",
                "description": "Document used to notify people of success."
            }
        }
    ],
    "addDemonstrationStatus": [
        {
            "input": {
                "name": "In Flight",
                "description": "In flight demonstration status."
            }
        }
    ],
    "addAmendmentStatus": [
        {
            "input": {
                "id": "FRESH_BAKED",
                "description": "Freshly baked amendment!"
            }
        }
    ],
    "updateAmendmentStatus": [
        {
            "id": "FRESH_BAKED",
            "input": {
                "description": "Toasty warm amendment fresh from the oven."
            }
        }
    ]
}

STATE_ID = run_and_return_id("addState")
DOCUMENT_TYPE_ID = run_and_return_id("addDocumentType")
DEMONSTRATION_STATUS_ID = run_and_return_id("addDemonstrationStatus")
USER_IDS = [
    run_and_return_id("addUser", 0),
    run_and_return_id("addUser", 1)
]
AMENDMENT_STATUS_ID = run_and_return_id("addAmendmentStatus")

result = graphql_request(
    QUERIES["amendmentStatus"]["idAndDescription"],
    {"id": AMENDMENT_STATUS_ID}
).get("data").get("amendmentStatus").get("description")
expected = INPUTS["addAmendmentStatus"][0]["input"]["description"]
print("Asserting that amendment status created successfully...")
print("Asserting that a single amendment status can be queried successfully...")
assert result == expected

run_mutator("updateAmendmentStatus")
result = graphql_request(
    QUERIES["amendmentStatus"]["idAndDescription"],
    {"id": AMENDMENT_STATUS_ID}
).get("data").get("amendmentStatus").get("description")
expected = INPUTS["updateAmendmentStatus"][0]["input"]["description"]
print("Asserting that amendment status updated successfully...")
assert result == expected

INPUTS["addDemonstration"] = [
    {
        "input": {
            "projectOfficerUserId": USER_IDS[0],
            "name": "A test demonstration",
            "evaluationPeriodStartDate": "2025-01-01T00:00:00+04:00",
            "evaluationPeriodEndDate": "2025-01-01T00:00:00+04:00",
            "description": "A demonstration that shows that tests are being tested.",
            "demonstrationStatusId": DEMONSTRATION_STATUS_ID,
            "stateId": STATE_ID
        }
    }
]
DEMONSTRATION_ID = run_and_return_id("addDemonstration")

INPUTS["addAmendment"] = [
    {
        "input": {
            "amendmentStatusId": AMENDMENT_STATUS_ID,
            "demonstrationId": DEMONSTRATION_ID,
            "description": "An amendment to the test demonstration.",
            "effectiveDate": "2025-01-01T00:00:00+04:00",
            "expirationDate": "2025-01-01T00:00:00+04:00",
            "name": "The test amendment",
            "projectOfficerUserId": USER_IDS[1]
        }
    }
]
AMENDMENT_ID = run_and_return_id("addAmendment")

result = graphql_request(
    QUERIES["amendment"]["idAndDescription"],
    {"id": AMENDMENT_ID}
).get("data").get("amendment").get("description")
expected = INPUTS["addAmendment"][0]["input"]["description"]
print("Asserting that amendment created successfully...")
print("Asserting that a amendment can be queried successfully...")
assert result == expected

INPUTS["updateAmendment"] = [
    {
        "id": AMENDMENT_ID,
        "input": {
            "description": "A properly updated description!"
        }
    }
]
run_mutator("updateAmendment")

result = graphql_request(
    QUERIES["amendment"]["idAndDescription"],
    {"id": AMENDMENT_ID}
).get("data").get("amendment").get("description")
expected = INPUTS["updateAmendment"][0]["input"]["description"]
print("Asserting that amendment updated successfully...")
assert result == expected

result = graphql_request(
    QUERIES["amendmentStatuses"]["idAndDescription"]
).get("data").get("amendmentStatuses")
print("Asserting that amendment statuses can be queried successfully...")
expected = INPUTS["updateAmendmentStatus"][0]["id"]
assert expected in [record["id"] for record in result]
expected = INPUTS["updateAmendmentStatus"][0]["input"]["description"]
assert expected in [record["description"] for record in result]

result = graphql_request(
    QUERIES["amendmentStatus"]["idAndAmendments"],
    {"id": AMENDMENT_STATUS_ID}
)
expected = {
    "data": {
        "amendmentStatus": {
            "id": AMENDMENT_STATUS_ID,
            "amendments": [
                {"id": AMENDMENT_ID}
            ]
        }
    }
}
print("Asserting that amendments can be queried from amendment statuses...")
assert result == expected

result = graphql_request(
    QUERIES["amendments"]["idAndDescription"]
).get("data").get("amendments")
print("Asserting that amendments can be queried successfully...")
expected = INPUTS["updateAmendment"][0]["id"]
assert expected in [record["id"] for record in result]
expected = INPUTS["updateAmendment"][0]["input"]["description"]
assert expected in [record["description"] for record in result]

INPUTS["addAmendmentDocument"] = [
    {
        "input": {
            "amendmentId": AMENDMENT_ID,
            "description": "A test amendment document!",
            "documentTypeId": DOCUMENT_TYPE_ID,
            "ownerUserId": USER_IDS[1],
            "s3Path": "s3://path/to-a-test/document",
            "title": "The Test Amendment Document"
        }
    }
]
AMENDMENT_DOCUMENT_ID = run_and_return_id("addAmendmentDocument")

result = graphql_request(
    QUERIES["document"]["idAndDescriptionAndBundleType"],
    {"id": AMENDMENT_DOCUMENT_ID}
).get("data").get("document")
expected = INPUTS["addAmendmentDocument"][0]["input"]
print("Asserting that amendment document created successfully...")
print("Asserting that a single amendment document can be queried successfully...")
print("Asserting that the amendment document has the correct bundle type...")
assert result["description"] == expected["description"]
assert result["bundleType"] == "AMENDMENT"

INPUTS["updateAmendmentDocument"] = [
    {
        "id": AMENDMENT_DOCUMENT_ID,
        "input": {
            "description": "An updated document description."
        }
    }
]
run_mutator("updateAmendmentDocument")

result = graphql_request(
    QUERIES["document"]["idAndDescriptionAndBundle"],
    {"id": AMENDMENT_DOCUMENT_ID}
).get("data").get("document")
expected = {
    "id": AMENDMENT_DOCUMENT_ID,
    "description": INPUTS["updateAmendmentDocument"][0]["input"]["description"],
    "bundle": {
        "id": AMENDMENT_ID
    }
}
print("Asserting that amendment document updated successfully...")
print("Asserting that bundles are resolved correctly via __resolveType...")
assert result == expected

result = graphql_request(
    QUERIES["amendment"]["idAndDocuments"],
    {"id": AMENDMENT_ID}
).get("data").get("amendment")
expected = {
    "id": AMENDMENT_ID,
    "documents": [
        {
            "id": AMENDMENT_DOCUMENT_ID
        }
    ]
}
print("Asserting that documents can be retrieved from amendments...")
assert result == expected

result = graphql_request(
    QUERIES["demonstration"]["idAndAmendments"],
    {"id": DEMONSTRATION_ID}
).get("data").get("demonstration")
expected = {
    "id": DEMONSTRATION_ID,
    "amendments": [
        {
            "id": AMENDMENT_ID
        }
    ]
}
print("Asserting that amendments can be retrieved from demonstrations...")
assert result == expected

INPUTS["deleteAmendmentDocument"] = [
    {
        "id": AMENDMENT_DOCUMENT_ID
    }
]
INPUTS["deleteAmendment"] = [
    {
        "id": AMENDMENT_ID
    }
]
INPUTS["deleteAmendmentStatus"] = [
    {
        "id": AMENDMENT_STATUS_ID
    }
]

run_mutator("deleteAmendmentDocument")
result = graphql_request(
    QUERIES["document"]["idAndDescriptionAndBundleType"],
    {"id": AMENDMENT_DOCUMENT_ID}
).get("data").get("document")
print("Asserting that amendment documents can be deleted...")
assert result is None

run_mutator("deleteAmendment")
result = graphql_request(
    QUERIES["amendment"]["idAndDescription"],
    {"id": AMENDMENT_ID}
).get("data").get("amendment")
print("Asserting that amendments can be deleted...")
assert result is None

run_mutator("deleteAmendmentStatus")
result = graphql_request(
    QUERIES["amendmentStatus"]["idAndDescription"],
    {"id": AMENDMENT_STATUS_ID}
).get("data").get("amendmentStatus")
print("Asserting that amendment statuses can be deleted...")
assert result is None
