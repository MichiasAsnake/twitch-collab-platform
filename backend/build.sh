#!/bin/bash
npm install
mkdir -p dist/server/db
cp src/db/init.sql dist/server/db/
npm run build 