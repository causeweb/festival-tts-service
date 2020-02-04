## Description
Based on the Festival project (https://github.com/festvox/festival/).

## Usage
In the command line run following commands
```
docker build -t tts .
docker run -i -v `pwd`/synthesized:/opt/festival/synthesized --rm tts
```

## Provide your own text
run docker container with your text as argument:
```
docker run -it -v `pwd``/synthesized:/opt/festival/synthesized tts "Hello. This is text to speech service"
```
Resulting audio file location: 'synthesized/tts.wav'.
