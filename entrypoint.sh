#!/bin/bash

set -e

# sanity check
#if [ ! -d "/opt/out" ]; then
#  echo "Please run docker with \"-v \`pwd\`/out:/opt/out\" option"
#  false;
#fi

#text="Hello World"
#if [ ! -z "$1" ]; then
#    text=$@
#fi

cd /opt/festival

text2wave -mode singing utterances/daisy.xml -o synthesized/daisy.wav

# debug: keep alive
while true; do sleep 1000; done
