#!/bin/bash

${AZTEC_BUILDER:-aztec-builder} codegen src/contracts/target -o src/contracts/artifacts
