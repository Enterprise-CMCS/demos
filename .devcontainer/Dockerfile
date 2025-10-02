FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      python-is-python3 \
      awscli \
      vim \
      screen \
 && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir pre-commit --break-system-packages

