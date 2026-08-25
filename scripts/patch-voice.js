const fs = require('fs');
const path = require('path');

const voiceGradlePath = path.join(__dirname, '../node_modules/@react-native-voice/voice/android/build.gradle');

if (fs.existsSync(voiceGradlePath)) {
  const content = `apply plugin: 'com.android.library'

repositories {
    mavenLocal()
    mavenCentral()
    google()
    maven {
        url "$projectDir/../node_modules/react-native/android"
    }
    maven {
        url "$projectDir/../../react-native/android"
    }
}

def DEFAULT_COMPILE_SDK_VERSION = 34
def DEFAULT_BUILD_TOOLS_VERSION = "34.0.0"
def DEFAULT_TARGET_SDK_VERSION = 34

android {
    namespace "com.wenkesj.voice"
    compileSdk rootProject.hasProperty('compileSdkVersion') ? rootProject.compileSdkVersion : DEFAULT_COMPILE_SDK_VERSION
    buildToolsVersion rootProject.hasProperty('buildToolsVersion') ? rootProject.buildToolsVersion : DEFAULT_BUILD_TOOLS_VERSION

    defaultConfig {
        minSdkVersion rootProject.hasProperty('minSdkVersion') ? rootProject.minSdkVersion : 24
        targetSdkVersion rootProject.hasProperty('targetSdkVersion') ? rootProject.targetSdkVersion : DEFAULT_TARGET_SDK_VERSION
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.facebook.react:react-native:+'
}
`;
  fs.writeFileSync(voiceGradlePath, content, 'utf8');
  console.log('✅ @react-native-voice/voice build.gradle patched successfully!');
}

const voiceJavaPath = path.join(__dirname, '../node_modules/@react-native-voice/voice/android/src/main/java/com/wenkesj/voice/VoiceModule.java');
if (fs.existsSync(voiceJavaPath)) {
  let javaContent = fs.readFileSync(voiceJavaPath, 'utf8');
  if (javaContent.includes('ArrayList<String> matches = results.getStringArrayList')) {
    javaContent = javaContent.replace(
      /ArrayList<String> matches = results\.getStringArrayList\(SpeechRecognizer\.RESULTS_RECOGNITION\);\s*for \(String result : matches\) \{\s*arr\.pushString\(result\);\s*\}/g,
      `ArrayList<String> matches = results != null ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
    if (matches != null) {
      for (String result : matches) {
        if (result != null) arr.pushString(result);
      }
    }`
    );
    fs.writeFileSync(voiceJavaPath, javaContent, 'utf8');
    console.log('✅ @react-native-voice/voice VoiceModule.java patched successfully!');
  }

  let javaContent2 = fs.readFileSync(voiceJavaPath, 'utf8');
  if (javaContent2.includes('return Locale.getDefault().toString();')) {
    javaContent2 = javaContent2.replace(
      /private String getLocale\(String locale\) \{\s*if \(locale != null && !locale\.equals\(""\)\) \{\s*return locale;\s*\}\s*return Locale\.getDefault\(\)\.toString\(\);\s*\}/g,
      `private String getLocale(String locale) {
    if (locale != null && !locale.equals("")) {
      return locale.replace("_", "-");
    }
    try {
      return Locale.getDefault().toLanguageTag();
    } catch (Exception e) {
      return Locale.getDefault().toString().replace("_", "-");
    }
  }`
    );
    fs.writeFileSync(voiceJavaPath, javaContent2, 'utf8');
    console.log('✅ @react-native-voice/voice getLocale BCP-47 patched successfully!');
  }
}
