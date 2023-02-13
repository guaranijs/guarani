ROOT=$PWD

cd $ROOT

# preemptively remove the dist folder
rm -rf dist

# install workspace dependencies
pnpm install

# create the distribution packages
pnpm nx run-many --target=version --projects=$1
pnpm nx run-many --target=build --projects=$1

# deploy to the registry
cd dist/packages

for f in *; do
  cd $f
  pnpm publish
  cd ..
done

# remove the dist folder
cd $ROOT

rm -rf dist
