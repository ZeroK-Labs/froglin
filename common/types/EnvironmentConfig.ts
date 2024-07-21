type EnvironmentConfig = {
  WEBPACK_PORT: number;

  SSL_KEY: string;
  SSL_CERT: string;

  MAPBOX_ACCESS_TOKEN: string;

  SANDBOX_HOST: string;
  SANDBOX_PORT: number;

  BACKEND_HOST: string;
  BACKEND_PORT: number;
  BACKEND_PROTOCOL: "http" | "https";
};

export default EnvironmentConfig;
