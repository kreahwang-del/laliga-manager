#!/bin/bash
# 월드 풋볼매니저 APK 빌드(Gradle 없이): 우분투 패키지 aapt·dalvik-exchange·zipalign·apksigner·android-23
# 사용: KS=<서명키.jks> KSPASS=<비밀번호 파일 경로> WEB=<배포 index.html> ./build.sh  → out/wfm-<versionCode>.apk
set -e
cd "$(dirname "$0")"
AJ=/usr/lib/android-sdk/platforms/android-23/android.jar
V=$(grep -o 'versionCode="[0-9]*"' AndroidManifest.xml | grep -o '[0-9]*')
rm -rf out build && mkdir -p out build/classes build/assets
cp "$WEB" build/assets/index.html
javac -nowarn -source 8 -target 8 -bootclasspath "$AJ" -classpath "$AJ" -d build/classes src/kr/hwang/laliga/MainActivity.java
dalvik-exchange --dex --output=build/classes.dex build/classes
aapt package -f -M AndroidManifest.xml -S res -A build/assets -I "$AJ" -F build/unsigned.apk
(cd build && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 build/unsigned.apk build/aligned.apk
apksigner sign --ks "$KS" --ks-pass file:"$KSPASS" --out out/wfm-$V.apk build/aligned.apk
apksigner verify --print-certs out/wfm-$V.apk | head -3
ls -la out/
