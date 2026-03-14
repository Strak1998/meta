#!/bin/bash
cd /workspaces/meta/dua-metaverso
npx next build 2>&1
echo "EXIT_CODE: $?"
