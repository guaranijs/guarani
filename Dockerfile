FROM node:18.14.0-bullseye-slim

RUN apt-get update \
  && apt-get install git -yq --no-install-suggests --no-install-recommends --allow-downgrades --allow-remove-essential --allow-change-held-packages \
  && apt-get install openssh-client -yq --no-install-suggests --no-install-recommends --allow-downgrades --allow-remove-essential --allow-change-held-packages \
  && apt-get install nano -yq --no-install-suggests --no-install-recommends --allow-downgrades --allow-remove-essential --allow-change-held-packages \
  && apt-get clean

RUN npm install -g pnpm@7.26.3

EXPOSE 3000
