#!/usr/bin/bash
set -e

echo "🚀 Deploying dataConnectExport Lambda function..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

LAMBDA_NAME="dataconnectexport"
EXPORT_BUCKET="dataconnect-bucket"
LAMBDA_DIR="/workspaces/demos/lambdas/dataConnectExport"
BUILD_DIR="$LAMBDA_DIR/dist/localstack"

# This lambda needs a native binding, which makes it the one localstack script where
# architecture matters. esbuild cannot bundle a .node file, so @duckdb/node-api stays external
# and is installed into the zip separately, and the binding npm picks has to match the
# architecture the function is registered as. The sibling scripts let create-function default to
# x86_64; on an arm64 devcontainer that would run the binary under emulation, so this script
# registers the function as whatever the devcontainer actually is.
case "$(uname -m)" in
    aarch64 | arm64)
        LAMBDA_ARCH="arm64"
        NPM_CPU="arm64"
        ;;
    *)
        LAMBDA_ARCH="x86_64"
        NPM_CPU="x64"
        ;;
esac

cd "$LAMBDA_DIR"

npm ci --silent

# Same source of truth as the CDK bundling hook in
# deployment/lib/dataConnectExportProcessor.ts: the resolved version from the lockfile, never
# the range in package.json.
DUCKDB_VERSION=$(node -p "require('./package-lock.json').packages['node_modules/@duckdb/node-api'].version")
echo "🦆 DuckDB $DUCKDB_VERSION, binding for linux/$NPM_CPU (glibc), function as $LAMBDA_ARCH"

rm -rf "$BUILD_DIR" "$LAMBDA_DIR/lambda.zip"
mkdir -p "$BUILD_DIR"

# CJS to match the other localstack lambdas. The deployed artifact is ESM, which is a known
# difference between the two paths rather than an oversight.
npx esbuild index.ts \
  --bundle \
  --platform=node \
    --format=cjs \
    --target=node24 \
  --external:@duckdb/node-api \
  --sourcemap \
    --sources-content=true \
    --source-root=$LAMBDA_DIR/ \
    --outfile=$BUILD_DIR/index.js

# --min-release-age=0 overrides the 7 day floor in this lambda's .npmrc. --ignore-scripts is
# safe because none of the three duckdb packages defines one.
npm install --prefix "$BUILD_DIR" \
    --os=linux --cpu=$NPM_CPU --libc=glibc \
    --no-save --ignore-scripts --no-audit --no-fund --min-release-age=0 --silent \
    "@duckdb/node-api@$DUCKDB_VERSION"

if [ ! -d "$BUILD_DIR/node_modules/@duckdb/node-bindings-linux-$NPM_CPU" ]; then
    echo "❌ Expected @duckdb/node-bindings-linux-$NPM_CPU in the bundle, and it is not there."
    echo "   Without it the handler throws on its first import, so stopping here."
    exit 1
fi

# Zip from inside the build directory so index.js sits at the root next to node_modules. The
# sibling scripts use zip -j, which flattens paths and would strip the binding's directories.
(cd "$BUILD_DIR" && zip -qr "$LAMBDA_DIR/lambda.zip" .)

cd - > /dev/null

# The export bucket lives here rather than in setup_s3.sh so this script can be re-run on its
# own. It needs none of what setup_s3.sh does to the upload buckets: no CORS, since nothing in a
# browser reads it, and no versioning.
echo "🪣 Creating $EXPORT_BUCKET..."
$AWS_CMD s3 mb "s3://$EXPORT_BUCKET" 2>/dev/null && echo "✅ Created $EXPORT_BUCKET" || echo "✅ $EXPORT_BUCKET already exists"

# Delete existing Lambda if exists
$AWS_CMD lambda delete-function --function-name $LAMBDA_NAME 2>/dev/null || true

# Create Lambda function
$AWS_CMD lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs24.x \
    --architectures $LAMBDA_ARCH \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://$LAMBDA_DIR/lambda.zip \
    --timeout 900 \
    --memory-size 3008 \
    --environment "Variables={AWS_REGION=$AWS_REGION,AWS_ENDPOINT_URL=$LOCALSTACK_ENDPOINT,DATABASE_SECRET_ARN=database-secret,DB_SCHEMA=demos_app,DB_SSL_MODE=disable,EXPORT_BUCKET=$EXPORT_BUCKET,NODE_OPTIONS=--enable-source-maps}" >/dev/null

# Wait for Lambda to be active
echo "⏳ Waiting for dataConnectExport Lambda to be active..."
for i in {1..15}; do
    STATUS=$($AWS_CMD lambda get-function \
        --function-name $LAMBDA_NAME \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")

    if [ "$STATUS" = "Active" ]; then
        echo "✅ dataConnectExport Lambda function created"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo "❌ dataConnectExport Lambda function failed to initialize in 30 seconds"
        exit 1
    fi
    sleep 2
done

echo ""
echo "🧪 There is no trigger to wait for. The deployed lambda runs on an EventBridge schedule,"
echo "   so invoke it by hand:"
echo "   aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION lambda invoke \\"
echo "     --function-name $LAMBDA_NAME /tmp/dataconnectexport-out.json"
echo ""
echo "   Then look at what it wrote:"
echo "   aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://$EXPORT_BUCKET/ --recursive"
echo ""
echo "   It reads the allowlisted relations out of demos_app, so the local database needs those"
echo "   tables to exist. It exports nothing and writes no marker if any relation fails."
echo ""
echo "⚠️  The npm ci above resolved this lambda's node_modules for linux, and lambdas/ is a bind"
echo "   mount, so a host checkout now holds the linux binding. That only matters for this"
echo "   lambda, because it is the only one with a native dependency, and it only matters if you"
echo "   run its tests outside the container: parquet/writer.test.ts loads DuckDB for real and"
echo "   will fail to find its binding. Run npm install on the host to regain the host bindings."

cd "$LAMBDA_DIR"
rm lambda.zip
