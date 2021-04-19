<div align="right"><h4>Занятие 29</br>Защита проектных работ</br>
Проектная работа</h4></div>

<div align="center"><h2>Изучение набора данных в JupiterLab (PySpark), </br>последующая загрузка и построение витрин в СУБД Vertica </br>с помощью Data Build Tool, визуализация в Redash.</h2></div>

***
<p align="center"><img src="https://user-images.githubusercontent.com/29423304/115256529-f7f16e00-a137-11eb-877f-547a793844a7.jpg" /></p>

<h3><div align="center">1. Изучение датасета <Crimes in Boston> в JupiterLab</h3>

***
- установил в контейнере [JupiterLab](https://jupyter.org/) -> [руководство по установке в Docker-контейнере](https://jupyterlab.readthedocs.io/en/latest/getting_started/installation.html#docker)
- для изучения данных создал новый jupiter-ноутбук  -> :link: [здесь](https://github.com/radchenkoam/OTUS-de-2020-11/blob/dev/pyspark/workspace/boston.ipynb)
![image](https://user-images.githubusercontent.com/29423304/115265232-b49afd80-a13f-11eb-9db8-435227289cac.png)

***

<h3><div align="center">2. Загрузка и построение витрин в СУБД Vertica
с помощью Data Build Tool</h3>

***

- установил [Vertica](https://www.vertica.com/try/) v10.1.0 и [dbt](https://www.getdbt.com/) v18.2 -> [руководство по установке в Docker-контейнере](https://github.com/radchenkoam/vertica-dbt-docker)
- создал проект `dbt` **crimes_in_boston** -> 🔗 [здесь](https://github.com/radchenkoam/vertica-dbt-docker/tree/main/dbt/crimes_in_boston) <- для загрузки и создания витрин в СУБД `Vertica`
- загрузил данные `dbt seed`
```bash
docker run --name dbt --rm -it \
	--network dbt-net \
	--entrypoint /bin/bash \
	-v /home/am/work/code/vertica-dbt-docker/dbt/crimes_in_boston:/home/dbt_user/.dbt \
  -t radchenkoam/dbt:latest
dbt_user@89169795720a:~/.dbt$ dbt seed
Running with dbt=0.18.2
[WARNING]: Configuration paths exist in your dbt_project.yml file which do not apply to any resources.
There are 2 unused configuration paths:
- seeds.crimes_in_boston.crime
- seeds.crimes_in_boston.offense_codes

Found 6 models, 12 tests, 0 snapshots, 0 analyses, 141 macros, 0 operations, 2 seed files, 0 sources

15:59:31 | Concurrency: 1 threads (target='dev')
15:59:31 |
15:59:31 | 1 of 2 START seed file dbt.crime..................................... [RUN]
16:00:08 | 1 of 2 OK loaded seed file dbt.crime................................. [-1 in 37.02s]
16:00:08 | 2 of 2 START seed file dbt.offense_codes............................. [RUN]
16:00:08 | 2 of 2 OK loaded seed file dbt.offense_codes......................... [-1 in 0.06s]
16:00:08 |
16:00:08 | Finished running 2 seeds in 37.20s.

Completed successfully

Done. PASS=2 WARN=0 ERROR=0 SKIP=0 TOTAL=2
```

- запустил создание моделей `dbt run`
```
Running with dbt=0.18.2
[WARNING]: Configuration paths exist in your dbt_project.yml file which do not apply to any resources.
There are 2 unused configuration paths:
- seeds.crimes_in_boston.offense_codes
- seeds.crimes_in_boston.crime

Found 6 models, 12 tests, 0 snapshots, 0 analyses, 141 macros, 0 operations, 2 seed files, 0 sources

16:07:08 | Concurrency: 1 threads (target='dev')
16:07:08 |
16:07:08 | 1 of 6 START view model dbt.stg_crime................................ [RUN]
16:07:08 | 1 of 6 OK created view model dbt.stg_crime........................... [-1 in 0.08s]
16:07:08 | 2 of 6 START view model dbt.stg_offense_codes........................ [RUN]
16:07:08 | 2 of 6 OK created view model dbt.stg_offense_codes................... [-1 in 0.03s]
16:07:08 | 3 of 6 START table model dbt.crimes.................................. [RUN]
16:07:09 | 3 of 6 OK created table model dbt.crimes............................. [-1 in 1.21s]
16:07:09 | 4 of 6 START table model dbt.mrt_offense_all_count................... [RUN]
16:07:10 | 4 of 6 OK created table model dbt.mrt_offense_all_count.............. [-1 in 0.17s]
16:07:10 | 5 of 6 START table model dbt.mrt_offense_by_year_count............... [RUN]
16:07:10 | 5 of 6 OK created table model dbt.mrt_offense_by_year_count.......... [-1 in 0.17s]
16:07:10 | 6 of 6 START table model dbt.mrt_offense_by_year_month_count......... [RUN]
16:07:10 | 6 of 6 OK created table model dbt.mrt_offense_by_year_month_count.... [-1 in 0.18s]
16:07:10 |
16:07:10 | Finished running 2 view models, 4 table models in 1.99s.

Completed successfully

Done. PASS=6 WARN=0 ERROR=0 SKIP=0 TOTAL=6
```
- проверил
```bash
dbadmin=> \c boston_crimes
You are now connected to database "boston_crimes" as user "dbadmin".
boston_crimes=> \dtv+
                            List of tables
 Schema |              Name               | Kind  |  Owner  | Comment
--------+---------------------------------+-------+---------+---------
 dbt    | crime                           | table | dbadmin |
 dbt    | crimes                          | table | dbadmin |
 dbt    | mrt_offense_all_count           | table | dbadmin |
 dbt    | mrt_offense_by_year_count       | table | dbadmin |
 dbt    | mrt_offense_by_year_month_count | table | dbadmin |
 dbt    | offense_codes                   | table | dbadmin |
 dbt    | seed_rejects                    | table | dbadmin |
 dbt    | stg_crime                       | view  | dbadmin |
 dbt    | stg_offense_codes               | view  | dbadmin |

boston_crimes=> select * from dbt.crime limit 5;
-[ RECORD 1 ]-------+------------------------------------
INCIDENT_NUMBER     | 142052550
OFFENSE_CODE        | 3125
OFFENSE_CODE_GROUP  | Warrant Arrests
OFFENSE_DESCRIPTION | WARRANT ARREST
DISTRICT            | D4
REPORTING_AREA      | 903
SHOOTING            |
OCCURRED_ON_DATE    | 2015-06-22 00:12:00
YEAR                | 2015
MONTH               | 6
DAY_OF_WEEK         | Monday
HOUR                | 0
UCR_PART            | Part Three
STREET              | WASHINGTON ST
Lat                 | 42.33383935
Long                | -71.08029038
Location            | (42.33383935, -71.08029038)
-[ RECORD 2 ]-------+------------------------------------
INCIDENT_NUMBER     | I010370257-00
OFFENSE_CODE        | 3125
OFFENSE_CODE_GROUP  | Warrant Arrests
OFFENSE_DESCRIPTION | WARRANT ARREST
DISTRICT            | E13
REPORTING_AREA      | 569
SHOOTING            |
OCCURRED_ON_DATE    | 2016-05-31 19:35:00
YEAR                | 2016
MONTH               | 5
DAY_OF_WEEK         | Tuesday
HOUR                | 19
UCR_PART            | Part Three
STREET              | NEW WASHINGTON ST
Lat                 | 42.30233307
Long                | -71.11156487
Location            | (42.30233307, -71.11156487)
...
```
👍🏻 всё ок

***

<h3><div align="center">3. Визуализация в Readsh</h3>

***

- установил [Redash](https://redash.io/) -> [руководство по установке в Docker-контейнере](https://redash.io/help/open-source/dev-guide/docker)
- создал дашборд для визуализации
![image](https://user-images.githubusercontent.com/29423304/115268617-1f9a0380-a143-11eb-82ca-b05a26554cb1.png)
