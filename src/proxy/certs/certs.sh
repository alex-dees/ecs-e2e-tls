#!/bin/bash
set -x

openssl genrsa -out castore.key 2048
openssl req -x509 -new -nodes -key castore.key -days 3650 -config castore.cfg -out castore.pem

openssl genrsa -out my-aws-private.key 2048
openssl req -new -key my-aws-private.key -out my-aws.csr -config castore.cfg
openssl x509 -req -in my-aws.csr -CA castore.pem -CAkey castore.key -CAcreateserial  -out my-aws-public.crt -days 365

aws acm import-certificate \
--certificate fileb://my-aws-public.crt \
--private-key fileb://my-aws-private.key \
--certificate-chain  fileb://castore.pem \
--region us-east-1