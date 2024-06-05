#!/bin/bash

cd src/contracts

${AZTEC_NARGO:-aztec-nargo} compile --silence-warnings
