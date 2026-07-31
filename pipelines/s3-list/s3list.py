import boto3
import csv
import os

# Initialize S3 client
s3 = boto3.client('s3')
bucket_name = os.environ.get('S3_BUCKET_NAME')
output_file = 's3_file_list.csv'

with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    # Write CSV Header
    writer.writerow(['File_Path', 'Size_Bytes', 'ETag'])
    
    # Handle pagination for buckets with more than 1,000 files
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket_name)
    
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                writer.writerow([obj['Key'], obj['Size'], obj.get('ETag', '').replace('"', '')])

print(f"Successfully generated {output_file}")

# 2. Upload the file back to the top level (root) of the bucket
try:
    s3.upload_file(output_file, bucket_name, output_file)
    print(f"Successfully uploaded {output_file} to s3://{bucket_name}/{output_file}")
    
    # Optional: Delete the local file after upload to save space
    os.remove(output_file)
except Exception as e:
    print(f"Failed to upload file to S3: {e}")
