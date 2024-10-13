#!/bin/bash

source scripts/.env/maybe_sudo.sh

maybe_sudo chmod 700 ~/.ssh
maybe_sudo chown ${USER}:${USER} ~/.ssh
