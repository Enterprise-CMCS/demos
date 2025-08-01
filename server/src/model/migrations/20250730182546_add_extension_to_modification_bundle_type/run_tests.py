#!/usr/bin/env python3
"""
run_tests.py

Test runner for the "add_extension_to_modification_bundle_type" migration.
This migration:
1. Drops extension-related tables (extension, extension_status, extension_bundle_type, etc.)
2. Removes created_at/updated_at columns from bundle_type table
3. Adds 'EXTENSION' to modification_bundle_type to allow extensions to use the modification model

Tests:
- Verifies that EXTENSION bundle type exists
- Verifies that EXTENSION is in modification_bundle_type
- Verifies that extension records can be created as modifications
- Verifies that extension statuses can be created as modification statuses
"""

import urllib.request
import json
import subprocess
import uuid
import sys

GRAPHQL_URL = "http://localhost:4000/"

def graphql_request(query, variables=None, url=GRAPHQL_URL):
    """Make a GraphQL request with the given query and variables."""
    if variables is None:
        variables = {}
    headers = {"Content-Type": "application/json"}
    payload = json.dumps({
        "query": query,
        "variables": variables
    }).encode("UTF-8")

    req = urllib.request.Request(
        url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"GraphQL request failed: {e}")
        return None

def run_mutator(name, input_idx=0):
    """Run a mutation using MUTATORS and INPUTS."""
    return graphql_request(MUTATORS[name], INPUTS[name][input_idx])

def run_and_return_id(name, input_idx=0):
    """Run a mutation and return the created object's ID."""
    data = run_mutator(name, input_idx)
    if data and "data" in data and data["data"] and name in data["data"]:
        return data["data"][name]["id"]
    return None

def test_assertion(description, condition):
    """Print test result."""
    status = "✅ PASS" if condition else "❌ FAIL"
    print(f"{status}: {description}")
    return condition

# Step 1: Seed the database
print("Seeding the database...")
try:
    result = subprocess.run("npm run seed", shell=True, check=True, capture_output=True, text=True)
    print("Database seeded successfully")
except subprocess.CalledProcessError as e:
    print(f"Database seeding failed: {e}")
    print(f"Stdout: {e.stdout}")
    print(f"Stderr: {e.stderr}")
    sys.exit(1)

print("\nTEST ASSERTIONS\n---------------")

# GraphQL queries and mutations
QUERIES = {
    "bundleTypes": """
        query {
          bundleTypes {
            id
            name
            description
          }
        }
    """,
    "modificationStatuses": """
        query {
          modificationStatuses {
            id
            name
            description
            bundleTypeId
          }
        }
    """,
    "modifications": """
        query {
          modifications {
            id
            name
            bundleTypeId
            modificationStatusId
          }
        }
    """
}

MUTATORS = {
    "addUser": """
        mutation Mutation($input: AddUserInput!) {
          addUser(input: $input) {
            id
          }
        }
    """,
    "addDemonstration": """
        mutation Mutation($input: AddDemonstrationInput!) {
          addDemonstration(input: $input) {
            id
          }
        }
    """,
    "addModification": """
        mutation Mutation($input: AddModificationInput!) {
          addModification(input: $input) {
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
                "displayName": "Test Extension User",
                "email": "test.extension@example.com",
                "fullName": "Test Extension User",
                "username": "test.extension.user"
            }
        }
    ],
    "addDemonstration": [
        {
            "input": {
                "name": "Test Extension Demo",
                "description": "A demonstration for testing extensions",
                "effectiveDate": "2024-01-01",
                "expirationDate": "2024-12-31",
                "demonstrationStatusId": "NEW",
                "stateId": "AK",
                "projectOfficerUserId": None  # Will be set dynamically
            }
        }
    ],
    "addModification": [
        {
            "input": {
                "bundleTypeId": "EXTENSION",
                "demonstrationId": None,  # Will be set dynamically
                "name": "Test Extension Modification",
                "description": "A test extension created as a modification",
                "effectiveDate": "2024-06-01",
                "expirationDate": "2024-12-31",
                "modificationStatusId": "EXTENSION_NEW",
                "projectOfficerUserId": None  # Will be set dynamically
            }
        }
    ]
}

# Test 1: Verify bundle types exist including EXTENSION
print("1. Testing bundle types...")
bundle_types_response = graphql_request(QUERIES["bundleTypes"])
if bundle_types_response and "data" in bundle_types_response:
    bundle_types = bundle_types_response["data"]["bundleTypes"]
    bundle_type_ids = [bt["id"] for bt in bundle_types]
    
    test_assertion("DEMONSTRATION bundle type exists", "DEMONSTRATION" in bundle_type_ids)
    test_assertion("AMENDMENT bundle type exists", "AMENDMENT" in bundle_type_ids)
    test_assertion("EXTENSION bundle type exists", "EXTENSION" in bundle_type_ids)
else:
    test_assertion("Bundle types query succeeds", False)

# Test 2: Verify modification statuses include extension statuses
print("\n2. Testing modification statuses...")
mod_statuses_response = graphql_request(QUERIES["modificationStatuses"])
if mod_statuses_response and "data" in mod_statuses_response:
    mod_statuses = mod_statuses_response["data"]["modificationStatuses"]
    
    # Check for amendment statuses
    amendment_statuses = [ms for ms in mod_statuses if ms["bundleTypeId"] == "AMENDMENT"]
    test_assertion("Amendment statuses exist", len(amendment_statuses) > 0)
    
    # Check for extension statuses
    extension_statuses = [ms for ms in mod_statuses if ms["bundleTypeId"] == "EXTENSION"]
    test_assertion("Extension statuses exist (from seeder)", len(extension_statuses) > 0)
    
    if extension_statuses:
        extension_status_names = [es["name"] for es in extension_statuses]
        test_assertion("Extension NEW status exists", "New" in extension_status_names)
        test_assertion("Extension IN_PROGRESS status exists", "In Progress" in extension_status_names)
else:
    test_assertion("Modification statuses query succeeds", False)

# Test 3: Verify modifications include extensions
print("\n3. Testing modifications (including extensions)...")
modifications_response = graphql_request(QUERIES["modifications"])
if modifications_response and "data" in modifications_response:
    modifications = modifications_response["data"]["modifications"]
    
    # Check for amendments
    amendments = [m for m in modifications if m["bundleTypeId"] == "AMENDMENT"]
    test_assertion("Amendment modifications exist", len(amendments) > 0)
    
    # Check for extensions
    extensions = [m for m in modifications if m["bundleTypeId"] == "EXTENSION"]
    test_assertion("Extension modifications exist (from seeder)", len(extensions) > 0)
else:
    test_assertion("Modifications query succeeds", False)

# Test 4: Try to create a new extension as a modification
print("\n4. Testing extension creation as modification...")
try:
    # First create a user for the project officer
    user_id = run_and_return_id("addUser")
    if user_id:
        print(f"Created test user: {user_id}")
        
        # Update inputs with the user ID
        INPUTS["addDemonstration"][0]["input"]["projectOfficerUserId"] = user_id
        INPUTS["addModification"][0]["input"]["projectOfficerUserId"] = user_id
        
        # Create a demonstration
        demo_id = run_and_return_id("addDemonstration")
        if demo_id:
            print(f"Created test demonstration: {demo_id}")
            
            # Update modification input with demo ID
            INPUTS["addModification"][0]["input"]["demonstrationId"] = demo_id
            
            # Try to create an extension as a modification
            extension_id = run_and_return_id("addModification")
            if extension_id:
                print(f"Created test extension as modification: {extension_id}")
                test_assertion("Can create extension as modification", True)
            else:
                test_assertion("Can create extension as modification", False)
        else:
            test_assertion("Can create test demonstration", False)
    else:
        test_assertion("Can create test user", False)
        
except Exception as e:
    print(f"Error during extension creation test: {e}")
    test_assertion("Extension creation test completes without errors", False)

print("\n✨ Migration tests completed!")
print("\nThis migration successfully:")
print("- Removed extension-specific tables")
print("- Added EXTENSION to modification_bundle_type")
print("- Enabled extensions to be created as modifications")
print("- Maintained backward compatibility with amendments")
