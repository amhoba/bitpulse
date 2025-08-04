#!/usr/bin/env bash

# Explicitly set SHELL to bash to avoid chokidar error
export SHELL=/bin/bash

# Check STAGE environment variable
STAGE=${STAGE:-dev}

if [ "$STAGE" = "prod" ]; then
    echo "Starting production server..."
    pnpm watch-content &
else
    echo "Starting development server..."
    pnpm i
    pnpm watch-content &
    pnpm dev &
fi

# Keep the script running indefinitely
echo "Running indefinitely..." ;
sleep infinity &

wait $! ;