#!/usr/bin/env bash

if [[ $# -eq 0 ]] ; then
    echo "Missing argument of new version"
    exit 1
fi

VERSION=$1

if ! [[ ${VERSION} =~ ^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}(-.+)?$ ]] ;
then
    echo "Version ${VERSION} isn't in format X.Y.Z"
    exit 1
fi

VERSION_DATE=$(git log -1 --format=%aI "v${VERSION}" | cut -c -10)
VERSION_COMMIT=$(git rev-list -n 1 "v${VERSION}")

# expecting the directory at a specific path
cd ~/trilium-flathub || exit

if ! git diff-index --quiet HEAD --; then
    echo "There are uncommitted changes"
    exit 1
fi

BASE_BRANCH=master

if [[ "$VERSION" == *"beta"* ]]; then
    BASE_BRANCH=beta
fi

git switch "${BASE_BRANCH}"
git pull

BRANCH=b${VERSION}

git branch "${BRANCH}"
git switch "${BRANCH}"

echo "Updating files with version ${VERSION}, date ${VERSION_DATE} and commit ${VERSION_COMMIT}"

flatpak-node-generator npm ../trilium/package-lock.json

xmlstarlet ed --inplace --update "/component/releases/release/@version" --value "${VERSION}" --update "/component/releases/release/@date" --value "${VERSION_DATE}" ./com.github.zadam.trilium.metainfo.xml

yq --inplace "(.modules[0].sources[0].tag = \"v${VERSION}\") | (.modules[0].sources[0].commit = \"${VERSION_COMMIT}\")" ./com.github.zadam.trilium.yml

git add ./generated-sources.json
git add ./com.github.zadam.trilium.metainfo.xml
git add ./com.github.zadam.trilium.yml

git commit -m "release $VERSION"
git push --set-upstream origin "${BRANCH}"

gh pr create --fill -B "${BASE_BRANCH}"
gh pr merge --auto --merge --delete-branch
