# Main info
```
"android": "expo run:android", -- dev
"android:release": "expo run:android --variant release", -- install APK
"android:apk": "expo prebuild --platform android && cd android && ./gradlew assembleRelease", -- build prod APK only
```

# Working with npm sandboxed
```
docker build -f Dockerfile.npm -t mobile-npm .
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/workspace" mobile-npm install
```
