#!/usr/bin/bash

# Configure Python environment
python -m venv /opt/demos-data
/opt/demos-data/bin/pip install --upgrade pip
/opt/demos-data/bin/pip install -r ./.devcontainer/python/requirements.txt

# Install pre-commit hooks
pre-commit install

# Make terminals automatically run inside the virtual environment
echo 'source /opt/demos-data/bin/activate' >> ~/.bashrc
echo 'source /opt/demos-data/bin/activate' >> ~/.zshrc

# Copy example settings over to settings.json
[ -f .vscode/settings.json ] && cp .vscode/settings.json .vscode/settings.backup.json
cp .vscode/settings.example.json .vscode/settings.json

# Configure AWS
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test # pragma: allowlist secret
aws configure set region us-east-1

# The ENDPOINT_URL setting is broken in all contexts except on the command line
# Add this alias to handle it
echo "alias aws='aws --endpoint-url=http://localstack:4566'" >> ~/.bashrc
echo "alias aws='aws --endpoint-url=http://localstack:4566'" >> ~/.zshrc
echo ""
echo "✅ Post-create setup complete!"
