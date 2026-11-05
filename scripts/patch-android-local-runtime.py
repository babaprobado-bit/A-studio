#!/usr/bin/env python3
"""Add llama.kt and the LocalLlm Capacitor bridge to a generated Android project."""
from pathlib import Path
import re
import shutil
import sys

REPO = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
ANDROID = REPO / "android"
if not ANDROID.is_dir():
    raise SystemExit("Android project not found; run npx cap add android first.")

def write(path, value):
    path.write_text(value, encoding="utf-8", newline="\n")

def insert_before_matching_brace(source, block_start, insertion):
    start = source.find(block_start)
    if start < 0:
        raise SystemExit(f"Required Gradle block not found: {block_start}")
    brace = source.find("{", start)
    if brace < 0:
        raise SystemExit(f"Opening brace not found: {block_start}")
    depth = 0
    for pos in range(brace, len(source)):
        if source[pos] == "{":
            depth += 1
        elif source[pos] == "}":
            depth -= 1
            if depth == 0:
                return source[:pos] + insertion + "\n" + source[pos:]
    raise SystemExit(f"Unclosed Gradle block: {block_start}")

settings = ANDROID / "settings.gradle"
if not settings.exists():
    raise SystemExit("Generated Groovy android/settings.gradle was not found.")
settings_text = settings.read_text(encoding="utf-8")
root_gradle = ANDROID / "build.gradle"
if not root_gradle.exists():
    raise SystemExit("Generated android/build.gradle was not found.")
root_text = root_gradle.read_text(encoding="utf-8")
agp_match = re.search(r"com\.android\.tools\.build:gradle:([0-9.]+)", root_text)
agp_version = agp_match.group(1) if agp_match else "8.7.3"

# The llama.kt module uses the plugin DSL without explicit versions.
plugin_versions = (
    "\n    plugins {\n"
    f"        id 'com.android.library' version '{agp_version}'\n"
    "        id 'org.jetbrains.kotlin.android' version '2.0.21'\n"
    "    }\n"
)
if "id 'org.jetbrains.kotlin.android' version '2.0.21'" not in settings_text:
    if "pluginManagement {" in settings_text:
        settings_text = insert_before_matching_brace(settings_text, "pluginManagement {", plugin_versions)
    else:
        settings_text = (
            "pluginManagement {\n"
            "    repositories { google(); mavenCentral(); gradlePluginPortal() }\n"
            + plugin_versions +
            "}\n" + settings_text
        )
include_line = "include ':llama-kt'"
if include_line not in settings_text:
    settings_text += (
        "\ninclude ':llama-kt'\n"
        "project(':llama-kt').projectDir = new File('../libs/llama.kt/llama-kt')\n"
    )
write(settings, settings_text)

# Match the app's SDK levels to llama.kt's Android 10+ requirement.
variables = ANDROID / "variables.gradle"
if variables.exists():
    value = variables.read_text(encoding="utf-8")
    value, count = re.subn(r"(minSdkVersion\s*=\s*)\d+", r"\g<1>29", value, count=1)
    if count != 1:
        raise SystemExit("minSdkVersion could not be updated in variables.gradle.")
    value, count = re.subn(r"(compileSdkVersion\s*=\s*)\d+", r"\g<1>35", value, count=1)
    if count != 1:
        raise SystemExit("compileSdkVersion could not be updated in variables.gradle.")
    write(variables, value)

# The legacy Android app plugin block needs Kotlin Gradle plugin on the buildscript classpath.
if "org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21" not in root_text:
    root_text = insert_before_matching_brace(
        root_text,
        "dependencies {",
        "\n        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21'\n    "
    )
write(root_gradle, root_text)

app_gradle = ANDROID / "app" / "build.gradle"
if not app_gradle.exists():
    raise SystemExit("Generated android/app/build.gradle was not found.")
app_text = app_gradle.read_text(encoding="utf-8")

if "apply plugin: 'org.jetbrains.kotlin.android'" not in app_text:
    app_line = "apply plugin: 'com.android.application'"
    if app_line in app_text:
        app_text = app_text.replace(app_line, app_line + "\napply plugin: 'org.jetbrains.kotlin.android'", 1)
    else:
        app_line = 'apply plugin: "com.android.application"'
        if app_line not in app_text:
            raise SystemExit("Could not locate the Android application plugin line.")
        app_text = app_text.replace(app_line, app_line + "\napply plugin: 'org.jetbrains.kotlin.android'", 1)

if "abiFilters 'arm64-v8a'" not in app_text:
    app_text = insert_before_matching_brace(
        app_text,
        "defaultConfig {",
        "\n        ndk { abiFilters 'arm64-v8a' }\n    "
    )
if "ndkVersion" not in app_text:
    app_text = insert_before_matching_brace(
        app_text,
        "android {",
        '\n    ndkVersion "27.2.12479018"\n'
    )
if "implementation project(':llama-kt')" not in app_text:
    app_text = insert_before_matching_brace(
        app_text,
        "dependencies {",
        "\n    implementation project(':llama-kt')\n"
    )
if "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0" not in app_text:
    app_text = insert_before_matching_brace(
        app_text,
        "dependencies {",
        '\n    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0"\n'
    )
app_text, code_count = re.subn(r"versionCode\s+\d+", "versionCode 2", app_text, count=1)
app_text, name_count = re.subn(r'versionName\s+["\'][^"\']+["\']', 'versionName "1.1.0"', app_text, count=1)
if code_count != 1 or name_count != 1:
    raise SystemExit("Android versionCode/versionName were not found.")
write(app_gradle, app_text)

# Copy the native plugin into the generated application's package.
plugin_source = REPO / "android-local-runtime" / "LocalLlmPlugin.kt"
if not plugin_source.is_file():
    raise SystemExit("android-local-runtime/LocalLlmPlugin.kt is missing.")
java_root = ANDROID / "app" / "src" / "main" / "java" / "com" / "aistudio" / "alpha1"
java_root.mkdir(parents=True, exist_ok=True)
shutil.copy2(plugin_source, java_root / "LocalLlmPlugin.kt")

activities = list((ANDROID / "app" / "src" / "main" / "java").rglob("MainActivity.java"))
if not activities:
    activities = list((ANDROID / "app" / "src" / "main" / "java").rglob("MainActivity.kt"))
if len(activities) != 1:
    raise SystemExit(f"Expected one MainActivity source; found {len(activities)}.")
activity = activities[0]
content = activity.read_text(encoding="utf-8")
if "LocalLlmPlugin" not in content:
    package_match = re.search(r"^package\s+[^;\n]+;?", content, re.M)
    if not package_match:
        raise SystemExit("MainActivity package declaration missing.")
    imports = []
    if activity.suffix == ".java":
        if "import android.os.Bundle;" not in content:
            imports.append("import android.os.Bundle;")
        imports.append("import com.aistudio.alpha1.LocalLlmPlugin;")
        content = content[:package_match.end()] + "\n\n" + "\n".join(imports) + content[package_match.end():]
        if "onCreate(" in content:
            # Existing onCreate: register the plugin before BridgeActivity builds its bridge.
            if "super.onCreate(savedInstanceState);" in content:
                content = content.replace(
                    "super.onCreate(savedInstanceState);",
                    "registerPlugin(LocalLlmPlugin.class);\n        super.onCreate(savedInstanceState);",
                    1
                )
            elif "super.onCreate(" in content:
                content = re.sub(
                    r"super\.onCreate\(([^)]*)\);",
                    r"registerPlugin(LocalLlmPlugin.class);\n        super.onCreate(\1);",
                    content,
                    count=1
                )
            else:
                raise SystemExit("Existing MainActivity onCreate has no super.onCreate call.")
        else:
            class_match = re.search(r"(class\s+MainActivity[^{]*\{)", content)
            if not class_match:
                raise SystemExit("MainActivity Java class declaration missing.")
            method = """
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalLlmPlugin.class);
        super.onCreate(savedInstanceState);
    }
"""
            content = content[:class_match.end()] + method + content[class_match.end():]
    else:
        if "import android.os.Bundle" not in content:
            imports.append("import android.os.Bundle")
        imports.append("import com.aistudio.alpha1.LocalLlmPlugin")
        content = content[:package_match.end()] + "\n\n" + "\n".join(imports) + content[package_match.end():]
        if "onCreate(" in content:
            if "super.onCreate(savedInstanceState)" in content:
                content = content.replace(
                    "super.onCreate(savedInstanceState)",
                    "registerPlugin(LocalLlmPlugin::class.java)\n        super.onCreate(savedInstanceState)",
                    1
                )
            elif "super.onCreate(" in content:
                content = re.sub(
                    r"super\.onCreate\(([^)]*)\)",
                    r"registerPlugin(LocalLlmPlugin::class.java)\n        super.onCreate(\1)",
                    content,
                    count=1
                )
            else:
                raise SystemExit("Existing MainActivity onCreate has no super.onCreate call.")
        else:
            class_match = re.search(r"(class\s+MainActivity[^{]*\{)", content)
            if not class_match:
                raise SystemExit("MainActivity Kotlin class declaration missing.")
            method = """
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(LocalLlmPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
"""
            content = content[:class_match.end()] + method + content[class_match.end():]
    write(activity, content)

# Include upstream license and notice files in the APK assets when present.
notices = ANDROID / "app" / "src" / "main" / "assets" / "third-party-notices"
notices.mkdir(parents=True, exist_ok=True)
for source, target in [
    (REPO / "libs" / "llama.kt" / "LICENSE", notices / "LLAMA-KT-LICENSE.txt"),
    (REPO / "libs" / "llama.kt" / "THIRD_PARTY_LICENSES.md", notices / "THIRD_PARTY_LICENSES.md"),
]:
    if source.exists():
        shutil.copy2(source, target)

print(f"Android LocalLlm bridge configured (AGP {agp_version}, Kotlin 2.0.21, Android 10+, arm64-v8a).")
