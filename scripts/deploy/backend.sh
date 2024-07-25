#!/bin/bash

eval $(node -e "
  (async () => {
    const settings = (await import('./settings/dev.js')).default;

    const env = 'DEPLOY_USER=' + settings.DEPLOY_USER + ';'
              + 'DEPLOY_HOST=' + settings.DEPLOY_HOST + ';'
              + 'DEPLOY_DIR=' + settings.DEPLOY_BACKEND_DIR + ';';

    console.log(env);
  })()
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
")

printf "\nSyncing files...\n"

items=(
  "aztec"
  "backend"
  "common"
  "scripts/.env"
  "scripts/aztec"
  "scripts/docker"
  "scripts/prerequisites"
  "src/settings.ts"
  ".nvmrc"
  "bun.lockb"
  "package.json"
)

for item in "${items[@]}"; do
  rsync                                       \
  -avz                                        \
  --progress                                  \
  --relative                                  \
  -e "ssh -i ~/.ssh/id_rsa_contabo"           \
  "$item"                                     \
  ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR} \
  || { printf "\nFailed to sync files\n"; exit 1; }
done

printf "\nFiles synced successfully!\n"
