#!/bin/bash

# do a production build
rm -rf "build/prod"
scripts/webpack/build.sh prod || { exit 1; }

# load required env vars
eval $(bun -e "
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

items=(
  "public/images" "images"
  "build/prod/"   ""
)

for ((i=0; i<${#items[@]}; i+=2)); do
  item="${items[i]}"
  DEST_DIR="${DEPLOY_DIR}/${items[i+1]}"

  rsync                                       \
  -avz                                        \
  --progress                                  \
  -e "ssh -i ~/.ssh/id_rsa_contabo"           \
  "$item"                                     \
  ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR} \
  || {
    printf "\nFailed to sync files\n"
    exit 1
  }
done

printf "\nFiles synced successfully!\n"
