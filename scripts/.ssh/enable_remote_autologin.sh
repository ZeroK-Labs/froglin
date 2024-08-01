#!/bin/bash

eval $(node -e "
  (async () => {
    const settings = (await import('./settings/dev.js')).default;

    const env = 'DEPLOY_USER=' + settings.DEPLOY_USER + ';'
              + 'DEPLOY_HOST=' + settings.DEPLOY_HOST + ';';

    console.log(env);
  })()
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
")

GIT_EMAIL=$(git config --global user.email)

if [ ! -f ~/.ssh/id_rsa_contabo ]; then
  ssh-keygen -t rsa -b 2048 -C "$GIT_EMAIL" -N "" -f ~/.ssh/id_rsa_contabo || { exit 1; }
fi

ssh-copy-id -i ~/.ssh/id_rsa_contabo.pub $DEPLOY_USER@$DEPLOY_HOST
