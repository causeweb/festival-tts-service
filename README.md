## Description
Based on the Festival project (https://github.com/festvox/festival/).

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
