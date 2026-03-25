#!/bin/bash
cd /home/kavia/workspace/code-generation/insurance-claim-fraud-detection-platform-65-102/frontend_webapp
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

