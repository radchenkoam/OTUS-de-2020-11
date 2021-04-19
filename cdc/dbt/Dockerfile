ARG BASE_IMAGE="python:3.8-slim-buster"
FROM $BASE_IMAGE

ARG DBT_USER
ARG DBT_PROFILES_DIR

RUN apt-get update -y \
  && apt-get dist-upgrade -y \
  && apt-get install -y --no-install-recommends -y -q \
    git \
    software-properties-common \
    make \
    build-essential \
    ca-certificates \
    libpq-dev python-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY requirements.txt ./requirements.txt

RUN pip install --upgrade pip setuptools
RUN pip install --requirement ./requirements.txt

# install dbt
RUN pip install dbt

RUN useradd -mU $DBT_USER
# RUN mkdir /usr/app && chown dbt_test_user /usr/app
USER $DBT_USER

WORKDIR $DBT_PROFILES_DIR
VOLUME $DBT_PROFILES_DIR

ENV PYTHONIOENCODING=utf-8
ENV LANG C.UTF-8
