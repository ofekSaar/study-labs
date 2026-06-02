#!/bin/bash
# Run once on the VM to generate a self-signed certificate for StudyLabs.
# Place output in nginx/certs/ next to this script.

set -e
CERT_DIR="$(dirname "$0")/certs"
mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 825 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/studylabs.key" \
  -out    "$CERT_DIR/studylabs.crt" \
  -subj "/C=IL/ST=Center/L=Rishon/O=Colman/CN=studylabs.cs.colman.ac.il" \
  -addext "subjectAltName=DNS:studylabs.cs.colman.ac.il,IP:193.106.55.134"

echo "Certificates written to $CERT_DIR"
