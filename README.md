# Festival TTS Service

<!-- badges: start -->
[![lifecycle](https://img.shields.io/badge/lifecycle-experimental-orange.svg)](https://www.tidyverse.org/lifecycle/#experimental)
[![License: MIT](https://img.shields.io/github/license/rpc5102/festival-tts-service.svg?style=flat)](https://opensource.org/licenses/MIT)
<!-- badges: end -->

Based on the [Festival TTS](https://github.com/festvox/festival/) project and [heyMP/r-service](https://github.com/heyMP/r-service/).

## Usage
In the command line run following commands
```
docker build -t tts .  && docker run -v `pwd`/synthesized:/opt/festival/synthesized -p 3000:3000 --rm tts
```

## Provide your own text
run docker container with your text as argument:
```
curl -X POST --data-binary @out.xml http://localhost:3000
```
Resulting audio file location: 'synthesized/tmp.wav'.
