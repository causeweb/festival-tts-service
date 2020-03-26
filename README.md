# Festival TTS Service

<!-- badges: start -->
[![lifecycle](https://img.shields.io/badge/lifecycle-experimental-orange.svg)](https://www.tidyverse.org/lifecycle/#experimental)
<!-- badges: end -->

Based on the [Festival TTS](https://github.com/festvox/festival/) project and [heyMP/r-service](https://github.com/heyMP/r-service/).

## Setup
Setup instructions below will be for CentOS systems with Apache but can be used on any setup that supports Docker.

**Requires:**
- [Docker](https://docs.docker.com/install/linux/docker-ce/centos/)
- Webserver [[Apache](https://httpd.apache.org/docs/current/install.html) / [NGINX](https://www.nginx.com/resources/wiki/start/topics/tutorials/install/)]

Set up a Reverse Proxy to allow access to a nonstandard port on web server:
**/etc/httpd/conf.d/festival.conf**
```
<Location /api/festival>
  <IfModule mod_proxy.c>
    ProxyPass http://127.0.0.1:3000
    ProxyPassReverse http://127.0.0.1:3000
  </IfModule>
</Location>
```

Restart web server with `sudo systemctl httpd restart`

In the command line run following commands to launch festival-tts-service where it was installed.
```
docker build -t tts . && docker run -v `pwd`/synthesized:/opt/festival/synthesized -p 3000:3000 --rm tts
```

## Sample Usage

Sample Request [GET]:

`/smiles/api/generate/wav?bpm=130&beats=1.0&notes=A4&utterance=test`

Result:

`./synthesized/130_1.0_A4_test.wav`

Params: (wav) | xml

Sample Request [GET]:

`/smiles/api/lookup/word?terms=test`

Result:

  `{"test":{"wordid":true,"foul":false,"syllables":1}}`

Params: (word)

### Music note symbols:
- Flat - ♭ - &#9837
- Natural - ♮ - &#9838
- Sharp - # - %23