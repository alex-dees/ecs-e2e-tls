#!/bin/bash
set -x

openssl genrsa -out castore.key 2048
openssl req -x509 -new -nodes -key castore.key -days 3650 -config castore.cfg -out castore.pem

openssl genrsa -out my-aws-private.key 2048
openssl req -new -key my-aws-private.key -out my-aws.csr -config castore.cfg
openssl x509 -req -in my-aws.csr -CA castore.pem -CAkey castore.key -CAcreateserial  -out my-aws-public.crt -days 365

cert=$(aws acm import-certificate \
--certificate fileb://my-aws-public.crt \
--private-key fileb://my-aws-private.key \
--certificate-chain  fileb://castore.pem \
--output text \
--query CertificateArn)

aws ssm put-parameter \
--name cert-arn \
--type String \
--value $cert \
--overwrite