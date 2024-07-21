#!/bin/bash

cd contracts

${AZTEC_NARGO:-aztec-nargo} compile --silence-warnings
