# Build

```sh
./scripts/webpack/build.sh ${MODE}
```
or
```sh
bun webpack:build ${MODE}
```

<br>

`MODE` - empty (defaults to `"dev"`), `"dev"` or `"prod"`

<br>
<br>

# Nuke `build` folder

```sh
./scripts/webpack/clean.sh
```
or
```sh
bun webpack:clean
```

<br>
<br>

# Deploy to hosting server


Make sure to set

    DEPLOY_HOST
    DEPLOY_USER
    DEPLOY_FRONTEND_DIR

in your `env.config.js` file.

<br>

Additionally, make sure to have set

    SANDBOX_HOST
    BACKEND_HOST

to the expected hosting links/IPs, as these will be included in the output bundle.<br>
<br>

The script will copy files to `/var/www/froglin` on the `DEPLOY_HOST` specified in `env.config.js`.

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

# Start the frontend dev server

```sh
./scripts/webpack/start.sh ${MODE}
```
or
```sh
bun webpack:start ${MODE}
```

<br>

`MODE` - empty (defaults to `"dev"`), `"dev"` or `"prod"`
