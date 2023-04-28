cd /home/dat/app/cloud-encrypt
git pull
yarn docker:dev:down
cp .env.example .env
yarn docker:prod