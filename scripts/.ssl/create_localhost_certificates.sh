#!/bin/bash

if [ -f certificates/localhost-key.pem ]; then exit 0; fi

# define the directory and file paths
CERTIFICATES_DIR="certificates"
KEY_FILE="$CERTIFICATES_DIR/localhost-key.pem"
CERT_FILE="$CERTIFICATES_DIR/localhost-cert.pem"
CSR_FILE="$CERTIFICATES_DIR/localhost.csr"

# create the certificates directory if it is missing
if [ ! -d "$CERTIFICATES_DIR" ]; then mkdir -p "$CERTIFICATES_DIR"; fi

# generate SSL key if it is missing
if [ ! -f "$KEY_FILE" ]; then
  echo "Generating SSL key..."
  openssl genpkey -algorithm RSA -out "$KEY_FILE" > /dev/null 2>&1
fi

# sign SSL certificate if it is missing
if [ ! -f "$CERT_FILE" ]; then
  echo "Signing SSL certificate..."

  SSL_CONFIG_FILE="$CERTIFICATES_DIR/openssl.cnf"
  SSL_CONFIG_CONTENT="[req]
distinguished_name = req_distinguished_name
prompt = no

[req_distinguished_name]
C = XY
ST = Your Country
L = Your City
O = Your Organization
OU = Your Unit
CN = localhost"

  echo "$SSL_CONFIG_CONTENT" > "$SSL_CONFIG_FILE"
  openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" -config "$SSL_CONFIG_FILE" > /dev/null 2>&1
  rm -rf "$SSL_CONFIG_FILE"
  openssl x509 -req -days 365 -in "$CSR_FILE" -signkey "$KEY_FILE" -out "$CERT_FILE" > /dev/null 2>&1
  rm -rf "$CSR_FILE"
fi
