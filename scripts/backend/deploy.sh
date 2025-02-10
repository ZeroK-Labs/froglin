#!/bin/bash

# do a production build
# scripts/aztec/compile.sh || { exit 1; }

# load required env vars
eval $(bun -e "
  (async () => {
    const configuration = (await import('./env.config.js')).default;

    const env = 'DEPLOY_USER=' + configuration.DEPLOY_USER + ';'
              + 'DEPLOY_HOST=' + configuration.DEPLOY_HOST + ';'
              + 'DEPLOY_DIR=' + configuration.DEPLOY_BACKEND_DIR + ';';

    console.log(env);
  })()
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
")

printf "\nSyncing files...\n"

items=(
  "contracts/aztec/gateway/artifact"
  "contracts/aztec/gateway/target"
  "backend"
  "common"
  "frontend/settings.ts"
  "scripts/.env"
  "scripts/aztec"
  "scripts/backend/start.sh"
  "scripts/docker/start.sh"
  "scripts/prerequisites"
  "scripts/cleanup.sh"
  "scripts/setup.sh"
  "bun.lockb"
  "package.json"
  "tsconfig.json"
)

for item in "${items[@]}"; do
  rsync                                       \
  -avz                                        \
  --progress                                  \
  --relative                                  \
  -e "ssh -i ~/.ssh/id_rsa_contabo"           \
  "$item"                                     \
  ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR} \
  || {
    printf "\nFailed to sync files\n"
    exit 1
  }
done

printf "\nFiles synced successfully!\n"
