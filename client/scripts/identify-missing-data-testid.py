# This script scans TypeScript and TSX files for JSX tags that are missing the `data-testid` attribute.
import os
import re
import argparse

TAGS_TO_SCAN = ["button", "input", "select", "option", "textarea"]
JSX_TAG_REGEX = re.compile(
    r'<(' + '|'.join(TAGS_TO_SCAN) + r')\b[^>]*?>'
)

DATA_TESTID_REGEX = re.compile(r'data-testid\s*=')



def scan_file(filepath):
    missing_count = 0
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    # Find all opening tags (including multi-line)
    for match in JSX_TAG_REGEX.finditer(content):
        tag = match.group(0)
        if not DATA_TESTID_REGEX.search(tag):
            # Find line number for the start of the tag
            line_num = content[:match.start()].count('\n') + 1
            print(f"{filepath}:{line_num}")
            missing_count += 1
    return missing_count

def should_scan_file(filename):
    # Only scan .ts and .tsx files, but ignore test files
    if not (filename.endswith(".ts") or filename.endswith(".tsx")):
        return False
    if filename.endswith(".test.tsx") or filename.endswith("test.ts"):
        return False
    return True

def main(src_dir):
    total_missing = 0
    for root, _, files in os.walk(src_dir):
        for file in files:
            if should_scan_file(file):
                total_missing += scan_file(os.path.join(root, file))
    print(f"\nTotal missing data-testid attributes: {total_missing}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan for missing data-testid attributes in JSX tags.")
    parser.add_argument("src_dir", type=str, help="Source directory to scan")
    args = parser.parse_args()
    main(args.src_dir)