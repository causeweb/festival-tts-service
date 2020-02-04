# Dockerfile for text to speech (TTS) based on
# Merlin project (https://github.com/CSTR-Edinburgh/merlin/)
# The Neural Network (NN) based Speech Synthesis System
#
# (c) Abylay Ospan <aospan@jokersys.com>, 2017
# https://jokersys.com
# under GPLv2 license

FROM centos:7
MAINTAINER rpc5102@psu.edu

ENV USER root

RUN yum install festival -y

RUN cd /usr/share \
    && curl -o festvox_rablpc16k.tar.gz http://festvox.org/packed/festival/1.96/festlex_CMU.tar.gz \
    && tar -xvf festlex_CMU.tar.gz \
    && rm festlex_CMU.tar.gz
    && curl -o festvox_rablpc16k.tar.gz http://festvox.org/packed/festival/1.96/festlex_OALD.tar.gz \
    && tar -xvf festlex_OALD.tar.gz \
    && rm festlex_OALD.tar.gz
    && curl -o festvox_rablpc16k.tar.gz http://festvox.org/packed/festival/1.96/festlex_POSLEX.tar.gz \
    && tar -xvf festlex_POSLEX.tar.gz \
    && rm festlex_POSLEX.tar.gz
    && curl -o festvox_rablpc16k.tar.gz http://festvox.org/packed/festival/2.0.95/festvox_rablpc16k.tar.gz \
    && tar -xvf festvox_rablpc16k.tar.gz \
    && rm festvox_rablpc16k.tar.gz

RUN mkdir -p /opt/festival/{synthesized,utterances}

WORKDIR /opt/festival

RUN curl -o utterances/doremi.xml https://raw.githubusercontent.com/festvox/festival/master/examples/songs/doremi.xml

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/bin/bash", "-c", "/entrypoint.sh ${*}", "--"]

