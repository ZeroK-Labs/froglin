#!/bin/bash

${AZTEC_BUILDER:-aztec-builder} codegen contracts/target -o contracts/artifacts
