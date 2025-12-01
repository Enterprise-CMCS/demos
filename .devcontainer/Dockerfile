FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

RUN apt-get update && \
  export DEBIAN_FRONTEND=noninteractive && \
  apt-get -y install \
  python3 \
  python3-pip \
  python-is-python3 \
  awscli && \
  pip3 install pre-commit --break-system-packages

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"
