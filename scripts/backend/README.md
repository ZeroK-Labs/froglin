# Deploy to hosting server

Make sure to set

    DEPLOY_HOST
    DEPLOY_USER
    DEPLOY_BACKEND_DIR

in your `env.config.js` file.<br>
<br>

The script will copy files to `~/Projects/froglin` on the `DEPLOY_HOST` specified in `env.config.js`.<br>
<br>

Additionally run `./scripts/setup.sh` on the `DEPLOY_HOST` when
- deploying for the first time
- updates to Aztec sandbox and packages are made

<br>

```sh
./scripts/webpack/deploy.sh
```
or
```sh
bun webpack:deploy
```

<br>
<br>

# Start the backend server

```sh
./scripts/backend/start.sh
```
or
```sh
bun backend:start
```
