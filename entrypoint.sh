#!/bin/sh

node /tools/pullDatabase.js
exec "$@"
