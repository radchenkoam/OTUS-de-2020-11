<div align="right"><h4>Занятие 16, 17</br>DWH. Хранилища данных</br>
Домашнее задание</h4></div>

<div align="center"><h2>Проектирование витрины данных в Vertica</br>с использованием Data Build Tool (dbt)</h2></div>

***

<details><summary>Описание домашнего задания</summary>

Домашнее задание: проектирование DWH и аналитических витрин

Цель:
В этом ДЗ вы спроектируете схему данных и построите аналитическую витрину

Цель: Спроектировать схему данных + построить аналитическую витрину данных
СУБД: Использовать Vertica (Docker) либо PostgreSQL (Docker) либо BigQuery (GCP)
Датасет: Любой из использованных на курсе: Boston Crimes, Chicago Taxi Trips, Захват данных из Divolte, либо любой из GCP Public Datasets)
Definition of Done: • DDL объектов • DML шагов преобразований • Опционально: Тестирование на наличие ошибок в данных

</details>

---

<div align="center"><h3>Подготовка рабочего окружения</h3></div>

---

- при подготовке к выполнению домашнего задания я стал искать готовые `docker`-контейнеры с `Vertica` и `dbt`
- то, что я нашел не совсем соответствовало моим ожиданиям, версии были не совсем свежие, а мне хотелось попробовать более-менее новые инструменты
- так как у `dbt` [нет официального адаптера](https://docs.getdbt.com/docs/available-adapters) к `Vertica` я стал искать неофициальные разработки и нашел [вот этот адаптер](https://github.com/mpcarter/dbt-vertica)
- на основании этого адаптера я решил самостоятельно построить `docker`-образы для выполнения домашнего задания
- получился вот такой продукт -> [radchenkoam/vertica-dbt-docker](https://github.com/radchenkoam/vertica-dbt-docker)
    (установка тестовых контейнеров описана в `readme` этого репозитория)
    `Vertica` последней версии на текущий день - 10.1.0-0, адаптер `dbt-vertica` содержит в своем составе `dbt` версии 18.2
- в этом же репозитории содержится [проект `dbt`](https://github.com/radchenkoam/vertica-dbt-docker/tree/main/dbt/crimes_in_boston) созданный с использованием датасета [Crimes in Boston](https://www.kaggle.com/AnalyzeBoston/crimes-in-boston)

---

<div align="center"><h3>Data Build Tool (dbt)</h3></div>

---

- в терминале контейнера `dbt` выполнил команду для загрузки данных `dbt seed`:
```bash
$ dbt seed
Running with dbt=0.18.2
[WARNING]: Configuration paths exist in your dbt_project.yml file which do not apply to any resources.
There are 2 unused configuration paths:
- seeds.crimes_in_boston.offense_codes
- seeds.crimes_in_boston.crime

Found 6 models, 12 tests, 0 snapshots, 0 analyses, 141 macros, 0 operations, 2 seed files, 0 sources

00:43:05 | Concurrency: 1 threads (target='dev')
00:43:05 | 
00:43:05 | 1 of 2 START seed file dbt.crime..................................... [RUN]
00:43:47 | 1 of 2 OK loaded seed file dbt.crime................................. [-1 in 42.46s]
00:43:47 | 2 of 2 START seed file dbt.offense_codes............................. [RUN]
00:43:47 | 2 of 2 OK loaded seed file dbt.offense_codes......................... [-1 in 0.06s]
00:43:47 | 
00:43:47 | Finished running 2 seeds in 42.77s.

Completed successfully

Done. PASS=2 WARN=0 ERROR=0 SKIP=0 TOTAL=2
```

- выполнил команду развертывания моделей `dbt run`:
    ```bash
    $ dbt run
    Running with dbt=0.18.2
    [WARNING]: Configuration paths exist in your dbt_project.yml file which do not apply to any resources.
    There are 2 unused configuration paths:
    - seeds.crimes_in_boston.crime
    - seeds.crimes_in_boston.offense_codes
    
    Found 6 models, 13 tests, 0 snapshots, 0 analyses, 141 macros, 0 operations, 2 seed files, 0 sources
    
    00:46:28 | Concurrency: 1 threads (target='dev')
    00:46:28 | 
    00:46:28 | 1 of 6 START view model dbt.stg_crime................................ [RUN]
    00:46:28 | 1 of 6 OK created view model dbt.stg_crime........................... [-1 in 0.09s]
    00:46:28 | 2 of 6 START view model dbt.stg_offense_codes........................ [RUN]
    00:46:28 | 2 of 6 OK created view model dbt.stg_offense_codes................... [-1 in 0.04s]
    00:46:28 | 3 of 6 START table model dbt.crimes.................................. [RUN]
    00:46:29 | 3 of 6 OK created table model dbt.crimes............................. [-1 in 1.21s]
    00:46:29 | 4 of 6 START table model dbt.mrt_offense_all_count................... [RUN]
    00:46:29 | 4 of 6 OK created table model dbt.mrt_offense_all_count.............. [-1 in 0.16s]
    00:46:29 | 5 of 6 START table model dbt.mrt_offense_by_year_count............... [RUN]
    00:46:29 | 5 of 6 OK created table model dbt.mrt_offense_by_year_count.......... [-1 in 0.18s]
    00:46:29 | 6 of 6 START table model dbt.mrt_offense_by_year_month_count......... [RUN]
    00:46:30 | 6 of 6 OK created table model dbt.mrt_offense_by_year_month_count.... [-1 in 0.19s]
    00:46:30 | 
    00:46:30 | Finished running 2 view models, 4 table models in 2.04s.
    
    Completed successfully
    
    Done. PASS=6 WARN=0 ERROR=0 SKIP=0 TOTAL=6
    ```

    - выполнил тестирование моделей `dbt test`:
```bash
$ dbt test
Running with dbt=0.18.2
[WARNING]: Configuration paths exist in your dbt_project.yml file which do not apply to any resources.
There are 2 unused configuration paths:
- seeds.crimes_in_boston.offense_codes
- seeds.crimes_in_boston.crime

Found 6 models, 12 tests, 0 snapshots, 0 analyses, 141 macros, 0 operations, 2 seed files, 0 sources

01:36:11 | Concurrency: 1 threads (target='dev')
01:36:11 | 
01:36:11 | 1 of 12 START test not_null_crime_INCIDENT_NUMBER.................... [RUN]
01:36:11 | 1 of 12 PASS not_null_crime_INCIDENT_NUMBER.......................... [PASS in 0.07s]
01:36:11 | 2 of 12 START test not_null_mrt_offense_by_year_count_year........... [RUN]
01:36:11 | 2 of 12 PASS not_null_mrt_offense_by_year_count_year................. [PASS in 0.03s]
01:36:11 | 3 of 12 START test not_null_offense_codes_CODE....................... [RUN]
01:36:11 | 3 of 12 PASS not_null_offense_codes_CODE............................. [PASS in 0.05s]
01:36:11 | 4 of 12 START test not_null_stg_crime_INCIDENT_ID.................... [RUN]
01:36:11 | 4 of 12 PASS not_null_stg_crime_INCIDENT_ID.......................... [PASS in 0.06s]
01:36:11 | 5 of 12 START test not_null_stg_offense_codes_OFFENSE_CODE........... [RUN]
01:36:11 | 5 of 12 PASS not_null_stg_offense_codes_OFFENSE_CODE................. [PASS in 0.04s]
01:36:11 | 6 of 12 START test unique_crime_INCIDENT_NUMBER...................... [RUN]
01:36:11 | 6 of 12 FAIL 27523 unique_crime_INCIDENT_NUMBER...................... [FAIL 27523 in 0.10s]
01:36:11 | 7 of 12 START test unique_mrt_offense_all_count__offense_name_offense_code_group_ [RUN]
01:36:11 | 7 of 12 PASS unique_mrt_offense_all_count__offense_name_offense_code_group_ [PASS in 0.03s]
01:36:11 | 8 of 12 START test unique_mrt_offense_by_year_count_year............. [RUN]
01:36:11 | 8 of 12 FAIL 4 unique_mrt_offense_by_year_count_year................. [FAIL 4 in 0.05s]
01:36:11 | 9 of 12 START test unique_mrt_offense_by_year_month_count__year_month_ [RUN]
01:36:11 | 9 of 12 FAIL 40 unique_mrt_offense_by_year_month_count__year_month_.. [FAIL 40 in 0.06s]
01:36:11 | 10 of 12 START test unique_offense_codes_CODE........................ [RUN]
01:36:11 | 10 of 12 FAIL 150 unique_offense_codes_CODE.......................... [FAIL 150 in 0.04s]
01:36:11 | 11 of 12 START test unique_stg_crime_INCIDENT_ID..................... [RUN]
01:36:12 | 11 of 12 FAIL 27523 unique_stg_crime_INCIDENT_ID..................... [FAIL 27523 in 0.10s]
01:36:12 | 12 of 12 START test unique_stg_offense_codes_OFFENSE_CODE............ [RUN]
01:36:12 | 12 of 12 FAIL 150 unique_stg_offense_codes_OFFENSE_CODE.............. [FAIL 150 in 0.02s]
01:36:12 | 
01:36:12 | Finished running 12 tests in 0.80s.

Completed with 6 errors and 0 warnings:

Failure in test unique_crime_INCIDENT_NUMBER (data/seeds/schema.yml)
  Got 27523 results, expected 0.

  compiled SQL at compiled/compiled/crimes_in_boston/data/seeds/schema.yml/schema_test/unique_crime_INCIDENT_NUMBER.sql

Failure in test unique_mrt_offense_by_year_count_year (models/marts/schema.yml)
  Got 4 results, expected 0.

  compiled SQL at compiled/compiled/crimes_in_boston/models/marts/schema.yml/schema_test/unique_mrt_offense_by_year_count_year.sql

Failure in test unique_mrt_offense_by_year_month_count__year_month_ (models/marts/schema.yml)
  Got 40 results, expected 0.

  compiled SQL at compiled/compiled/crimes_in_boston/models/marts/schema.yml/schema_test/unique_mrt_offense_by_year_month_count__year_month_.sql

Failure in test unique_offense_codes_CODE (data/seeds/schema.yml)
  Got 150 results, expected 0.

  compiled SQL at compiled/compiled/crimes_in_boston/data/seeds/schema.yml/schema_test/unique_offense_codes_CODE.sql

Failure in test unique_stg_crime_INCIDENT_ID (models/staging/schema.yml)
  Got 27523 results, expected 0.

  compiled SQL at compiled/compiled/crimes_in_boston/models/staging/schema.yml/schema_test/unique_stg_crime_INCIDENT_ID.sql

Failure in test unique_stg_offense_codes_OFFENSE_CODE (models/staging/schema.yml)
  Got 150 results, expected 0.

  compiled SQL at compiled/compiled/crimes_in_boston/models/staging/schema.yml/schema_test/unique_stg_offense_codes_OFFENSE_CODE.sql

Done. PASS=6 WARN=0 ERROR=6 SKIP=0 TOTAL=12
```

👍🏻 считаю, цель домашнего задания достигнута, я начал изучение инструмента `Data Build Tools (dbt)`, в процессе понял как строится структура проекта, некоторые моменты взаимодействия с СУБД, немного узнал про тесты... инструмент интересный, обязательно буду использовать его в своей работе.
