#!/bin/bash
npm install
mkdir -p dist/server/db
cp ../src/server/db/init.sql dist/server/db/
npm run build 