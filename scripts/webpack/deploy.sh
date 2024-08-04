#!/bin/bash

# do a production build
rm -rf "build/prod"
bun webpack:build prod || { exit 1; }

# load required env vars
eval $(node -e "
  (async () => {
    const configuration = (await import('./env.config.js')).default;

    const env = 'DEPLOY_USER=' + configuration.DEPLOY_USER + ';'
              + 'DEPLOY_HOST=' + configuration.DEPLOY_HOST + ';'
              + 'DEPLOY_DIR=' + configuration.DEPLOY_FRONTEND_DIR + ';';

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
