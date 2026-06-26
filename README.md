# Main info
"android": "expo run:android", -- dev
"android:release": "expo run:android --variant release", -- install APK

# Other setup steps
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)

# Working with npm sandboxed
docker build -f Dockerfile.npm -t mobile-npm .
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/workspace" mobile-npm install
