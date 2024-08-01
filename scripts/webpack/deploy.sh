#!/bin/bash

bun webpack:build prod || { exit 1; }

eval $(node -e "
  (async () => {
    const settings = (await import('./settings/dev.js')).default;

    const env = 'DEPLOY_USER=' + settings.DEPLOY_USER + ';'
              + 'DEPLOY_HOST=' + settings.DEPLOY_HOST + ';'
              + 'DEPLOY_DIR=' + settings.DEPLOY_FRONTEND_DIR + ';';

    console.log(env);
  })()
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
")

printf "\nSyncing files...\n"

rsync                                         \
  -avz                                        \
  --progress                                  \
  -e "ssh -i ~/.ssh/id_rsa_contabo"           \
  "build/prod"                                \
  ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR} \
  || { printf "\nFailed to sync files\n"; exit 1; }

printf "\nFiles synced successfully!\n"
