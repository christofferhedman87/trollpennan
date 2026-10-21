#!/bin/bash
# kör skärmprovet lokalt: $1 = namn, resten = argument
cd "${ARBETE:-/workspace/p3fix-dev}"
N=$1; shift
rm -rf /workspace/p3fix-$N-bilder
nice -n 19 node rundor/P3a-fix/skarm-prov.mjs --dist dist-pages --kalib /workspace/p3fix-$N.jsonl --bilder /workspace/p3fix-$N-bilder "$@" > /workspace/p3fix-$N.json 2>/workspace/p3fix-$N.err
echo $? > /workspace/p3fix-$N.exit
