#!/bin/bash

printf Cleaning...
scripts/aztec/clean.sh
echo done

scripts/aztec/prep.sh
