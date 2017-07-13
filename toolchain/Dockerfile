FROM ubuntu:16.04

ARG WORKDIR=/workdir
ARG INSTALLDIR=/opt
WORKDIR $WORKDIR

RUN mkdir -p $WORKDIR
COPY setup.sh $WORKDIR/

RUN apt-get update && \
  apt-get install -y g++-multilib subversion git cmake python && \
  bash setup.sh && \
  rm -rf $WORKDIR/* && \
  apt-get autoremove -y --purge g++-multilib subversion git cmake python

ENV PATH=$INSTALLDIR/bin:$PATH
