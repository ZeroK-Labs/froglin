#!/bin/bash

cd contracts

${AZTEC_BUILDER:-aztec-builder} codegen target -o artifacts
