#!/usr/bin/env bash

# Check STAGE environment variable
STAGE=${STAGE:-dev}

if [ "$STAGE" = "prod" ]; then
    echo "Starting production server..."
    pnpm start &
else
    echo "Starting development server..."
    pnpm i
    pnpm dev &
fi

# Keep the script running indefinitely
echo "Running indefinitely..." ;
sleep infinity &

wait $! ;