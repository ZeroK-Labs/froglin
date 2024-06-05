#!/bin/bash

npm outdated --parseable --depth=0 | cut -d: -f4
