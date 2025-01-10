#!/bin/bash
npm install
mkdir -p dist/db
cp src/db/init.sql dist/db/
npm run build 