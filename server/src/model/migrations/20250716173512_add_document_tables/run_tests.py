#!/usr/bin/env python3
import urllib.request
import json
import subprocess
import uuid

def graphql_request(input_tuple, url="http://localhost:4000/"):
    """Make a GraphQL request with the given query and variables."""
    headers = {"Content-Type": "application/json"}
    payload = {
        "query": input_tuple[0],
        "variables": input_tuple[1] or {}
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

# Seed the DB for testing
subprocess.run("npm run seed", shell=True)
print("\nTEST ASSERTIONS\n---------------")

# Test variables
# Document creation
DOC_TYPE_1 = "TEST_DOC_TYPE_ONE"
DOC_TYPE_2 = "TEST_DOC_TYPE_TWO"
DOC_TYPE_1_DESC_1 = "TEST DOC TYPE ONE DESC 1"
DOC_TYPE_1_DESC_2 = "TEST DOC TYPE ONE DESC 2"
DOC_TYPE_2_DESC_1 = "TEST DOC TYPE TWO DESC 1"

# Document creation
TEST_DOC_TITLE_1 = "The world's nicest document"
TEST_DOC_DESC_1 = "Truly, this is the best document ever"
TEST_DOC_S3PATH_1 = "s3://the/best/path"

# Document updating
TEST_DOC_TITLE_2 = "A better title for the world's best document"
TEST_DOC_DESC_2 = "Truly, this is the best document ever - I really mean it!"
TEST_DOC_S3PATH_2 = "s3://the/best/path/for/real"

# Add users
add_user_1 = (
    """
    mutation Mutation($addUserInput: AddUserInput!) {
        addUser(input: $addUserInput) {
            id
        }
    }
    """,
    {
        "addUserInput": {
            "cognitoSubject": str(uuid.uuid4()),
            "displayName": "Test user",
            "email": "test@user.mail",
            "fullName": "Testington J. Userman",
            "username": "test.user"
        }
    }
)
result = graphql_request(add_user_1)
TEST_USER_1 = result["data"]["addUser"]["id"]

add_user_2 = (
    """
    mutation Mutation($addUserInput: AddUserInput!) {
        addUser(input: $addUserInput) {
            id
        }
    }
    """,
    {
        "addUserInput": {
            "cognitoSubject": str(uuid.uuid4()),
            "displayName": "Test user 2",
            "email": "test2@user.mail",
            "fullName": "Testington J. Userman III",
            "username": "test.user2"
        }
    }
)
result = graphql_request(add_user_2)
TEST_USER_2 = result["data"]["addUser"]["id"]

# Add doc types
add_doc_type_1 = (
    """
    mutation Mutation($input: AddDocumentTypeInput!) {
        addDocumentType(input: $input) {
            id
        }
    }
    """,
    {
        "input": {
            "id": DOC_TYPE_1,
            "description": DOC_TYPE_1_DESC_1
        }
    }
)
result = graphql_request(add_doc_type_1)

add_doc_type_2 = (
    """
    mutation Mutation($input: AddDocumentTypeInput!) {
        addDocumentType(input: $input) {
            id
        }
    }
    """,
    {
        "input": {
            "id": DOC_TYPE_2,
            "description": DOC_TYPE_2_DESC_1
        }
    }
)
result = graphql_request(add_doc_type_2)

# Get static values for states and demonstration status
get_states = (
    """
    query Query {
        states {
            id
        }
    }
    """,
    None
)
result = graphql_request(get_states)
STATE_ID = result["data"]["states"][0]["id"]

get_demo_statuses = (
    """
    query Query {
        demonstrationStatuses {
            id
        }
    }
    """,
    None
)
result = graphql_request(get_demo_statuses)
DEMO_STATUS_ID = result["data"]["demonstrationStatuses"][0]["id"]

# Create demonstrations
add_demo = (
    """
    mutation AddDemonstration($input: AddDemonstrationInput!) {
        addDemonstration(input: $input) {
            id
        }
    }
    """,
    {
        "input": {
            "projectOfficerUserId": TEST_USER_1,
            "name": "A test demonstration",
            "evaluationPeriodStartDate": "2025-01-01T00:00:00+04:00",
            "evaluationPeriodEndDate": "2025-01-01T00:00:00+04:00",
            "description": "A demonstration that shows that tests are being tested.",
            "demonstrationStatusId": DEMO_STATUS_ID,
            "stateId": STATE_ID
        }
    }
)
result = graphql_request(add_demo)
DEMO_ID_1 = result["data"]["addDemonstration"]["id"]
result = graphql_request(add_demo)
DEMO_ID_2 = result["data"]["addDemonstration"]["id"]

# Show doc type creation
get_doc_type_1 = (
    """
    query Query($documentTypeId: String!) {
        documentType(id: $documentTypeId) {
            id
            description
        }
    }
    """,
    {
        "documentTypeId": DOC_TYPE_1
    }
)
result = graphql_request(get_doc_type_1)
print("Asserting document type created correctly")
assert result["data"]["documentType"]["id"] == DOC_TYPE_1
assert result["data"]["documentType"]["description"] == DOC_TYPE_1_DESC_1

# Show no-op update_doc_type
no_change_update_doc_type = (
    """
    mutation Mutation($updateDocumentTypeId: String!, $input: UpdateDocumentTypeInput!) {
        updateDocumentType(id: $updateDocumentTypeId, input: $input) {
            id
        }
    }
    """,
    {
        "updateDocumentTypeId": DOC_TYPE_1,
        "input": {}
    }
)
result = graphql_request(no_change_update_doc_type)
result = graphql_request(get_doc_type_1)
print("Asserting that empty updates do not change document type")
assert result["data"]["documentType"]["id"] == DOC_TYPE_1
assert result["data"]["documentType"]["description"] == DOC_TYPE_1_DESC_1

# Show update to doc type
update_doc_type = (
    """
    mutation Mutation($updateDocumentTypeId: String!, $input: UpdateDocumentTypeInput!) {
        updateDocumentType(id: $updateDocumentTypeId, input: $input) {
            id
        }
    }
    """,
    {
        "updateDocumentTypeId": DOC_TYPE_1,
        "input": {
            "description": DOC_TYPE_1_DESC_2
        }
    }
)
result = graphql_request(update_doc_type)
result = graphql_request(get_doc_type_1)
print("Asserting that non-empty updates change document type correctly")
assert result["data"]["documentType"]["id"] == DOC_TYPE_1
assert result["data"]["documentType"]["description"] == DOC_TYPE_1_DESC_2

# Create demo doc
create_demo_doc = (
    """
    mutation Mutation($input: AddDemonstrationDocumentInput!) {
        addDemonstrationDocument(input: $input) {
            id
        }
    }
    """,
    {
        "input": {
            "title": TEST_DOC_TITLE_1,
            "description": TEST_DOC_DESC_1,
            "s3Path": TEST_DOC_S3PATH_1,
            "ownerUserId": TEST_USER_1,
            "documentTypeId": DOC_TYPE_1,
            "demonstrationId": DEMO_ID_1
        }
    }
)
result = graphql_request(create_demo_doc)
DEMO_DOC_ID = result["data"]["addDemonstrationDocument"]["id"]

# Get demonstration doc
get_demo_doc = (
    """
    query Document($documentId: ID!) {
        document(id: $documentId) {
            id
            title
            description
            s3Path
            documentType {
                id
            }
            bundle {
                id
            }
            bundleType
            owner {
                id
            }
        }
    }
    """,
    {
        "documentId": DEMO_DOC_ID
    }
)
result = graphql_request(get_demo_doc)
expected = {
    "data": {
        "document": {
            "id": DEMO_DOC_ID,
            "title": TEST_DOC_TITLE_1,
            "description": TEST_DOC_DESC_1,
            "s3Path": TEST_DOC_S3PATH_1,
            "documentType": {
                "id": DOC_TYPE_1
            },
            "bundle": {
                "id": DEMO_ID_1
            },
            "bundleType": "DEMONSTRATION",
            "owner": {
                "id": TEST_USER_1
            }
        }
    }
}
print("Asserting document created correctly")
assert result == expected

# Update demo doc
update_demo_doc = (
    """
    mutation Mutation($updateDemonstrationDocumentId: ID!, $input: UpdateDemonstrationDocumentInput!) {
        updateDemonstrationDocument(id: $updateDemonstrationDocumentId, input: $input) {
            id
        }
    }
    """,
    {
        "updateDemonstrationDocumentId": DEMO_DOC_ID,
        "input": {
            "demonstrationId": DEMO_ID_2,
            "description": TEST_DOC_DESC_2,
            "documentTypeId": DOC_TYPE_2,
            "ownerUserId": TEST_USER_2,
            "s3Path": TEST_DOC_S3PATH_2,
            "title": TEST_DOC_TITLE_2
        }
    }
)
result = graphql_request(update_demo_doc)
result = graphql_request(get_demo_doc)
expected = {
    "data": {
        "document": {
            "id": DEMO_DOC_ID,
            "title": TEST_DOC_TITLE_2,
            "description": TEST_DOC_DESC_2,
            "s3Path": TEST_DOC_S3PATH_2,
            "documentType": {
                "id": DOC_TYPE_2
            },
            "bundle": {
                "id": DEMO_ID_2
            },
            "bundleType": "DEMONSTRATION",
            "owner": {
                "id": TEST_USER_2
            }
        }
    }
}
print("Asserting that non-empty updates change document correctly")
assert result == expected

# List documents from doc types
# None expected for type 1 because we assigned it to type 2
list_docs_type_1 = (
    """
    query Query($documentTypeId: String!) {
        documentType(id: $documentTypeId) {
            id
            documents {
                id
            }
        }
    }
    """,
    {
        "documentTypeId": DOC_TYPE_1
    }
)
result = graphql_request(list_docs_type_1)
expected = {
    "data": {
        "documentType": {
            "id": DOC_TYPE_1,
            "documents": []
        }
    }
}
print("Asserting that listing documents from document type works as expected for empty sets")
assert result == expected

list_docs_type_2 = (
    """
    query Query($documentTypeId: String!) {
        documentType(id: $documentTypeId) {
            id
            documents {
                id
            }
        }
    }
    """,
    {
        "documentTypeId": DOC_TYPE_2
    }
)
result = graphql_request(list_docs_type_2)
expected = {
    "data": {
        "documentType": {
            "id": DOC_TYPE_2,
            "documents": [{
                "id": DEMO_DOC_ID
            }]
        }
    }
}
print("Asserting that listing documents from document type works as expected for non-empty sets")
assert result == expected

# List document from users
# Like above, there are two test users
list_docs_by_user_1 = (
    """
    query User($userId: ID!) {
        user(id: $userId) {
            id
            ownedDocuments {
                id
            }
        }
    }
    """,
    {
        "userId": TEST_USER_1
    }
)
result = graphql_request(list_docs_by_user_1)
expected = {
    "data": {
        "user": {
            "id": TEST_USER_1,
            "ownedDocuments": []
        }
    }
}
print("Asserting that listing documents from user works as expected for empty sets")
assert result == expected

list_docs_by_user_2 = (
    """
    query User($userId: ID!) {
        user(id: $userId) {
            id
            ownedDocuments {
                id
            }
        }
    }
    """,
    {
        "userId": TEST_USER_2
    }
)
result = graphql_request(list_docs_by_user_2)
expected = {
    "data": {
        "user": {
            "id": TEST_USER_2,
            "ownedDocuments": [{
                "id": DEMO_DOC_ID
            }]
        }
    }
}
print("Asserting that listing documents from user works as expected for non-empty sets")
assert result == expected

# List docs by demonstration
# Two test demonstrations
list_docs_by_demo_1 = (
    """
    query Demonstration($demonstrationId: ID!) {
        demonstration(id: $demonstrationId) {
            id
            documents {
                id
            }
        }
    }
    """,
    {
        "demonstrationId": DEMO_ID_1
    }
)
result = graphql_request(list_docs_by_demo_1)
expected = {
    "data": {
        "demonstration": {
            "id": DEMO_ID_1,
            "documents": []
        }
    }
}
print("Asserting that listing documents from demonstration works as expected for empty sets")
assert result == expected

list_docs_by_demo_2 = (
    """
    query Demonstration($demonstrationId: ID!) {
        demonstration(id: $demonstrationId) {
            id
            documents {
                id
            }
        }
    }
    """,
    {
        "demonstrationId": DEMO_ID_2
    }
)
result = graphql_request(list_docs_by_demo_2)
expected = {
    "data": {
        "demonstration": {
            "id": DEMO_ID_2,
            "documents": [{
                "id": DEMO_DOC_ID
            }]
        }
    }
}
print("Asserting that listing documents from demonstration works as expected for non-empty sets")
assert result == expected

# List docs for specific bundle types
# Shows the error handling
list_docs_for_demonstrations = (
    """
    query Documents($bundleTypeId: String) {
        documents(bundleTypeId: $bundleTypeId) {
            id
        }
    }
    """,
    {
        "bundleTypeId": "DEMONSTRATION"
    }
)
result = graphql_request(list_docs_for_demonstrations)
print("Asserting that listing documents for demonstrations returns at least one row")
assert len(result["data"]["documents"]) >= 1

list_docs_for_invalid_bundle = (
    """
    query Documents($bundleTypeId: String) {
        documents(bundleTypeId: $bundleTypeId) {
            id
        }
    }
    """,
    {
        "bundleTypeId": "DEMONS"
    }
)
try:
    print("Asserting that listing documents for invalid bundle types returns errors")
    result = graphql_request(list_docs_for_invalid_bundle)
except Exception as e:
    assert e.reason == "Unprocessable Entity"
    assert e.status == 422

list_docs_for_unimplemented_bundle = (
    """
    query Documents($bundleTypeId: String) {
        documents(bundleTypeId: $bundleTypeId) {
            id
        }
    }
    """,
    {
        "bundleTypeId": "AMENDMENT"
    }
)
try:
    print("Asserting that listing documents for unimplemented bundle types returns errors")
    result = graphql_request(list_docs_for_unimplemented_bundle)
except Exception as e:
    assert e.reason == "Not Implemented"
    assert e.status == 501

# Deleting documents
delete_doc = (
    """
    mutation Mutation($deleteDemonstrationDocumentId: ID!) {
        deleteDemonstrationDocument(id: $deleteDemonstrationDocumentId) {
            id
        }
    }
    """,
    {
        "deleteDemonstrationDocumentId": DEMO_DOC_ID
    }
)
result = graphql_request(delete_doc)
result = graphql_request(get_demo_doc)
expected = {
    "data": {
        "document": None
    }
}
print("Asserting that deleting documents works correctly")
assert result == expected

# Deleting documents
delete_doc_type = (
    """
    mutation Mutation($deleteDocumentTypeId: String!) {
        deleteDocumentType(id: $deleteDocumentTypeId) {
            id
        }
    }
    """,
    {
        "deleteDocumentTypeId": DOC_TYPE_1
    }
)
result = graphql_request(delete_doc_type)
result = graphql_request(get_doc_type_1)
expected = {
    "data": {
        "documentType": None
    }
}
print("Asserting that deleting document types works correctly")
assert result == expected
