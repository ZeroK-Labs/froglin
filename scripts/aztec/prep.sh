#!/bin/bash

if [ -f contracts/artifacts/Froglin.ts ]; then exit 0; fi

printf Compiling...
if ! scripts/aztec/compile.sh; then exit $?; fi
echo done

printf Generating ABI...
if ! scripts/aztec/codegen.sh; then exit $?; fi
echo done
