FROM centos:7

ENV USER root

# Install Festival
RUN yum install festival -y \
    && cd /usr/share \
    && curl -o festlex_CMU.tar.gz http://festvox.org/packed/festival/2.4/festlex_CMU.tar.gz \
    && tar -xvf festlex_CMU.tar.gz \
    && rm festlex_CMU.tar.gz \
    && curl -o festlex_OALD.tar.gz http://festvox.org/packed/festival/2.4/festlex_OALD.tar.gz \
    && tar -xvf festlex_OALD.tar.gz \
    && rm festlex_OALD.tar.gz \
    && curl -o festlex_POSLEX.tar.gz http://festvox.org/packed/festival/2.4/festlex_POSLEX.tar.gz \
    && tar -xvf festlex_POSLEX.tar.gz \
    && rm festlex_POSLEX.tar.gz \
    && curl -o festvox_rablpc16k.tar.gz http://festvox.org/packed/festival/2.0.95/festvox_rablpc16k.tar.gz \
    && tar -xvf festvox_rablpc16k.tar.gz \
    && rm festvox_rablpc16k.tar.gz

RUN echo "(set! voice_default 'voice_rab_diphone)" | tee -a /etc/festival/siteinit.scm

RUN mkdir -p /opt/festival/{synthesized,utterances}

WORKDIR /opt/festival

RUN curl -o utterances/daisy.xml https://raw.githubusercontent.com/festvox/festival/master/examples/songs/daisy.xml

# COPY entrypoint.sh /entrypoint.sh
# ENTRYPOINT ["/bin/bash", "-c", "/entrypoint.sh ${*}", "--"]

# Install Node
RUN curl -sL https://rpm.nodesource.com/setup_12.x | bash - \
    && yum install -y nodejs \
    && echo "Node Version: " && node -v && echo "NPM Version: " && npm -v

COPY package.json package-lock*.json ./

# Install build tools for npm deps
RUN yum install centos-release-scl scl-utils -y \
    && yum install devtoolset-6-make devtoolset-6-gcc devtoolset-6-gcc-c++ -y \
    && source scl_source enable devtoolset-6 \
    && npm install

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]