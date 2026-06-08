#!/usr/bin/env bash
# Use Android Studio JBR and strip JVM flags incompatible with CLI Gradle sync.
set -euo pipefail

MOBILE_JDK="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
if [[ -x "$MOBILE_JDK/bin/java" ]]; then
  export JAVA_HOME="$MOBILE_JDK"
fi

export JAVA_OPTS=""
export JAVA_TOOL_OPTIONS=""
export GRADLE_OPTS=""
export PATH="${JAVA_HOME:+$JAVA_HOME/bin:}$PATH"

exec env -u JAVA_TOOL_OPTIONS -u JAVA_OPTS "$@"
