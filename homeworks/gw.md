<div align="right"><h4>Занятие 29</br>Защита проектных работ</br>
Проектная работа</h4></div>

<div align="center"><h2>Практическое применение в работе Инженера данных современных инструментов обработки данных (ETL и ELT).</h2></div>

***
<h3><div align="center">1. Настройка рабочего окружения</div></h3>

***

- установил [redash](https://redash.io/) -> [руководство по установке в Docker-контейнере](https://redash.io/help/open-source/dev-guide/docker)
- установил [Vertica](https://www.vertica.com/try/) и [dbt](https://www.getdbt.com/) -> [руководство по установке в Docker-контейнере](https://github.com/radchenkoam/vertica-dbt-docker)
- установил [JupiterLab](https://jupyter.org/) -> [руководство по установке в Docker-контейнере](https://jupyterlab.readthedocs.io/en/latest/getting_started/installation.html#docker)

- использовал JupiterLab для изучения датасета `Crimes in Boston` -> [ноутбук](https://github.com/radchenkoam/OTUS-de-2020-11/blob/dev/datascience-notebook/workspace/boston.ipynb)

- [StreamSets](https://streamsets.com/) [Data Collector](https://github.com/streamsets/datacollector-docker) -> [руководство по установке в Docker-контейнере](https://github.com/streamsets/datacollector-docker)

docker network connect --alias vertica dbt-net redash_server_1
docker network connect --alias vertica dbt-net redash_worker_1
docker network connect --alias vertica dbt-net redash_scheduler_1



StreamSets
$ cd cdc
$ mkdir -pv ./streamsets/sdc-data
$ sudo chmod -R 777 ./streamsets/sdc-data
docker-compose build
docker-compose up -d


$ cd debezium_pg_cdc
$ mkdir -pv ./streamsets/sdc-data
$ sudo chmod -R 777 ./streamsets/sdc-data
$ docker-compose -f docker-compose-apicurio.yml pull
$ docker-compose -f docker-compose-apicurio.yml build
$ docker-compose -f docker-compose-apicurio.yml up
$ make register-postgres-apicurio


переписал профиль под postgresql
построил докер образ dbt
запустил dbt-postgresql
dbt seed
проверил - данные загружаются

теперь сделать реестр схемы для debezium
