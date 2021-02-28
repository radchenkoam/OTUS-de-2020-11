<div align="right"><h4>Занятие 19</br>SQL-доступ к данным. Apache Hive</br>
Домашнее задание</h4></div>

<div align="center"><h2>Практика с Hive на GCP DataProc</h2></div>

<p align="center"><img src="https://user-images.githubusercontent.com/29423304/109416935-54ef6400-79d2-11eb-8d45-19f9304bfaec.png" /></p>

<details><summary>Описание домашнего задания</summary>
HiveQL

Цель: Практика с Hive на GCP DataProc

1. План домашней работы:
   https://gist.github.com/kzzzr/f82e1511e8c38aa7d5c352a0ce308868

Что внутри:

- конфигурируем окружение
- создаем Metastore (MySQL), Dataproc (Хадуп-кластер)
- загружаем датасет (Chicago Taxi Trips)
- создаем таблицы, записываем данные в бинарный формат .parquet
- работаем с данными через SQL (Hive, Presto, Pyspark)

Команды запускаем в командной строке GCP по порядку. В коде даны пояснительные комментарии по каждой команде.

2. Вопросы для домашнего задания:

- Вывести динамику количества поездок помесячно
- Вывести топ-10 компаний (company) по выручке (trip_total)
- Подсчитать долю поездок <5, 5-15, 16-25, 26-100 миль

Ответы на эти вопросы (в виде выгрузки или скриншотов) нужно вложить в тред.
Для ответа на эти вопросы потребуется сформировать SQL-запрос и выполнить его (в Hive или Presto).
Рекомендуем сдать до: 24.03.2021

</details>

---

- список проектов `GCP` и активация проекта из списка

```bash
$ gcloud projects list
$ gcloud config set project <my-project>
```

- список регионов и зон `GCP`

```bash
$ gcloud compute regions list
$ gcloud compute zones list
```

- для указания параметров при создании сервисов `GCP` установил переменные среды

```bash
$ GCP_REGION=europe-west3 \
GCP_ZONE=europe-west3-a \
GCP_PROJECT=$(gcloud info --format='value(config.project)') \
GCP_BUCKET_NAME=${GCP_PROJECT}-warehouse

$ set | grep 'GCP'
GCP_BUCKET_NAME=de-2020-11-warehouse
GCP_PROJECT=de-2020-11
GCP_REGION=europe-west3
GCP_ZONE=europe-west3-a
```

- создал бакет в `Google Storage`

```bash
$ gsutil mb -l ${GCP_REGION} gs://${GCP_BUCKET_NAME}
Creating gs://de-2020-11-warehouse/...

$ gsutil ls
gs://de-2020-11-warehouse/
```

- создал инстанс `MySQL` для `Hive Metastore`

```bash
$ gcloud sql instances create hive-metastore-mysql \
    --database-version="MYSQL_5_7" \
    --activation-policy=ALWAYS \
    --zone $GCP_ZONE
```

- проверил :+1:

```bash
$ gcloud sql instances list
NAME                   DATABASE_VERSION  LOCATION        TIER              PRIMARY_ADDRESS  PRIVATE_ADDRESS  STATUS
hive-metastore-mysql  MYSQL_5_7         europe-west3-a  db-n1-standard-1  35.246.145.111   -                RUNNABLE
```

- создал кластер `Dataproc`

```bash
$ gcloud config set compute/zone $GCP_ZONE
Updated property [compute/zone].

$ gcloud dataproc clusters create hive-cluster \
    --region=$GCP_REGION \
    --scopes cloud-platform \
    --image-version 1.3 \
    --bucket=$GCP_BUCKET_NAME \
    --master-machine-type=n1-standard-4 \
    --num-workers=2 \
    --worker-machine-type=n1-standard-4 \
    --optional-components=PRESTO \
    --initialization-actions gs://goog-dataproc-initialization-actions-${GCP_REGION}/cloud-sql-proxy/cloud-sql-proxy.sh \
    --properties hive:hive.metastore.warehouse.dir=gs://${GCP_PROJECT}-warehouse/datasets \
    --metadata "hive-metastore-instance=${GCP_PROJECT}:${GCP_REGION}:hive-metastore-mysql"
Waiting on operation [projects/de-2020-11/regions/europe-west3/operations/a9e157c8-7b5f-3655-91a1-ec297ae2a744].
Waiting for cluster creation operation...
WARNING: For PD-Standard without local SSDs, we strongly recommend provisioning 1TB or larger to ensure consistently high I/O performance. See https://cloud.google.com/compute/docs/disks/performance for information on disk I/O performance.
WARNING: This cluster is configured to use network 'https://www.googleapis.com/compute/v1/projects/de-2020-11/global/networks/default' and its associated firewall rules '[cdh]' which contains the following potential security vulnerability: 'port 8088 is open to the internet, this may allow arbitrary code execution via the YARN REST API. Use Component Gateway for secure remote access to the YARN UI and other cluster UIs instead: https://cloud.google.com/dataproc/docs/concepts/accessing/dataproc-gateways.'
Waiting for cluster creation operation...done.
Created [https://dataproc.googleapis.com/v1/projects/de-2020-11/regions/europe-west3/clusters/hive-cluster] Cluster placed in zone [europe-west3-a].
```

:exclamation: в конце значения параметра `--metadata "hive-metastore-instance=` указал имя инстанса `MySQL` из предыдущего шага
:memo: можно создавать кластер из одной или нескольких нод: для этого указать либо `--single-node` либо `--num-workers=${HMSC_NODE_NUM}`, где `${HMSC_NODE_NUM}` - требуемое количество `workers`.

- загрузил датасет

```bash
$ gsutil cp gs://hive-solution/part-00000.parquet \
    gs://${GCP_PROJECT}-warehouse/datasets/transactions/part-00000.parquet
Copying gs://hive-solution/part-00000.parquet [Content-Type=application/octet-stream]...
- [1 files][  6.5 MiB/  6.5 MiB]
Operation completed over 1 objects/6.5 MiB.
```

- проверил :+1:

```bash
$ gsutil ls -lr gs://${GCP_BUCKET_NAME}/datasets/
gs://de-2020-11-warehouse/datasets/:

gs://de-2020-11-warehouse/datasets/transactions/:
   6816776  2021-02-19T12:00:00Z  gs://de-2020-11-warehouse/datasets/transactions/part-00000.parquet
TOTAL: 1 objects, 6816776 bytes (6.5 MiB)
```

- создать `external Hive table`

```bash
$ gcloud dataproc jobs submit hive \
    --cluster hive-cluster \
    --execute "CREATE EXTERNAL TABLE transactions \
      (SubmissionDate DATE, TransactionAmount DOUBLE, TransactionType STRING) \
      STORED AS PARQUET \
      LOCATION 'gs://${GCP_PROJECT}-warehouse/datasets/transactions';" \
    --region $GCP_REGION
```

- проверил - запустил запрос с помощью `jobs API` :+1:

```bash
$ gcloud dataproc jobs submit hive \
    --cluster hive-cluster \
    --execute "SELECT * FROM transactions LIMIT 10;" \
    --region $GCP_REGION \
    --quiet
```

<pre><details><summary>вывод запроса</summary>
Job [7c3dbc2a07ca4c59b4a3749215297247] submitted.
Waiting for job output...
Connecting to jdbc:hive2://hive-cluster-m:10000
Connected to: Apache Hive (version 2.3.7)
Driver: Hive JDBC (version 2.3.7)
Transaction isolation: TRANSACTION_REPEATABLE_READ
+------------------------------+---------------------------------+-------------------------------+
| transactions.submissiondate  | transactions.transactionamount  | transactions.transactiontype  |
+------------------------------+---------------------------------+-------------------------------+
| 2017-12-03                   | 1167.39                         | debit                         |
| 2017-09-23                   | 2567.87                         | debit                         |
| 2017-12-22                   | 1074.73                         | credit                        |
| 2018-01-21                   | 5718.58                         | debit                         |
| 2017-10-21                   | 333.26                          | debit                         |
| 2017-09-12                   | 2439.62                         | debit                         |
| 2017-08-06                   | 5885.08                         | debit                         |
| 2017-12-05                   | 7353.92                         | authorization                 |
| 2017-09-12                   | 4710.29                         | authorization                 |
| 2018-01-05                   | 9115.27                         | debit                         |
+------------------------------+---------------------------------+-------------------------------+
10 rows selected (7.68 seconds)
Beeline version 2.3.7 by Apache Hive
Closing: 0: jdbc:hive2://hive-cluster-m:10000
Job [7c3dbc2a07ca4c59b4a3749215297247] finished successfully.
done: true
driverControlFilesUri: gs://de-2020-11-warehouse/google-cloud-dataproc-metainfo/2cebbfe9-ab93-4947-a759-6f7b7148a547/jobs/7c3dbc2a07ca4c59b4a3749215297247/
driverOutputResourceUri: gs://de-2020-11-warehouse/google-cloud-dataproc-metainfo/2cebbfe9-ab93-4947-a759-6f7b7148a547/jobs/7c3dbc2a07ca4c59b4a3749215297247/driveroutput
hiveJob:
  queryList:
    queries:
    - SELECT * FROM transactions LIMIT 10;
jobUuid: efa481df-966c-36c3-bff1-0a75561309ef
placement:
  clusterName: hive-cluster
  clusterUuid: 2cebbfe9-ab93-4947-a759-6f7b7148a547
reference:
  jobId: 7c3dbc2a07ca4c59b4a3749215297247
  projectId: de-2020-11
status:
  state: DONE
  stateStartTime: '2021-02-19T12:08:50.076Z'
statusHistory:
- state: PENDING
  stateStartTime: '2021-02-19T12:08:31.035Z'
- state: SETUP_DONE
  stateStartTime: '2021-02-19T12:08:31.078Z'
- details: Agent reported job success
  state: RUNNING
  stateStartTime: '2021-02-19T12:08:31.328Z'
</details></pre>

- подключился к мастер-ноде по `ssh`, запустил `Hive CLI beeline`

```bash
$ gcloud compute ssh hive-cluster-m
$ beeline -u "jdbc:hive2://hive-cluster-m:10000"
```

- выполнил запросы
  <pre><details><summary>!tables</summary>
  0: jdbc:hive2://hive-cluster-m:10000> !tables
  +------------+--------------+---------------+-------------+----------+-----------+-------------+------------+----------------------------+-----------------+
  | TABLE_CAT  | TABLE_SCHEM  |  TABLE_NAME   | TABLE_TYPE  | REMARKS  | TYPE_CAT  | TYPE_SCHEM  | TYPE_NAME  | SELF_REFERENCING_COL_NAME  | REF_GENERATION  |
  +------------+--------------+---------------+-------------+----------+-----------+-------------+------------+----------------------------+-----------------+
  |            | default      | transactions  | TABLE       | NULL     | NULL      | NULL        | NULL       | NULL                       | NULL            |
  +------------+--------------+---------------+-------------+----------+-----------+-------------+------------+----------------------------+-----------------+
  </details></pre>
  <pre><details><summary>!columns transactions</summary>
  0: jdbc:hive2://hive-cluster-m:10000> !columns transactions
  +------------+--------------+---------------+--------------------+------------+------------+--------------+----------------+-----------------+-----------------+-----------+----------+-------------+----------------+-------------------+--------------------+-------------------+--------------+----------------+---------------+--------------+-------------------+--------------------+
  | TABLE_CAT  | TABLE_SCHEM  |  TABLE_NAME   |    COLUMN_NAME     | DATA_TYPE  | TYPE_NAME  | COLUMN_SIZE  | BUFFER_LENGTH  | DECIMAL_DIGITS  | NUM_PREC_RADIX  | NULLABLE  | REMARKS  | COLUMN_DEF  | SQL_DATA_TYPE  | SQL_DATETIME_SUB  | CHAR_OCTET_LENGTH  | ORDINAL_POSITION  | IS_NULLABLE  | SCOPE_CATALOG  | SCOPE_SCHEMA  | SCOPE_TABLE  | SOURCE_DATA_TYPE  | IS_AUTO_INCREMENT  |
  +------------+--------------+---------------+--------------------+------------+------------+--------------+----------------+-----------------+-----------------+-----------+----------+-------------+----------------+-------------------+--------------------+-------------------+--------------+----------------+---------------+--------------+-------------------+--------------------+
  | NULL       | default      | transactions  | submissiondate     | 91         | DATE       | 10           | NULL           | NULL            | NULL            | 1         | NULL     | NULL        | NULL           | NULL              | NULL               | 1                 | YES          | NULL           | NULL          | NULL         | NULL              | NO                 |
  | NULL       | default      | transactions  | transactionamount  | 8          | DOUBLE     | 15           | NULL           | 15              | 10              | 1         | NULL     | NULL        | NULL           | NULL              | NULL               | 2                 | YES          | NULL           | NULL          | NULL         | NULL              | NO                 |
  | NULL       | default      | transactions  | transactiontype    | 12         | STRING     | 2147483647   | NULL           | NULL            | NULL            | 1         | NULL     | NULL        | NULL           | NULL              | NULL               | 3                 | YES          | NULL           | NULL          | NULL         | NULL              | NO                 |
  +------------+--------------+---------------+--------------------+------------+------------+--------------+----------------+-----------------+-----------------+-----------+----------+-------------+----------------+-------------------+--------------------+-------------------+--------------+----------------+---------------+--------------+-------------------+--------------------+
  </details></pre>
  <pre><details><summary>select</summary>
  0: jdbc:hive2://hive-cluster-m:10000> SELECT TransactionType, AVG(TransactionAmount) AS AverageAmount
  . . . . . . . . . . . . . . . . . . > FROM transactions
  . . . . . . . . . . . . . . . . . . > WHERE SubmissionDate = '2017-12-22'
  . . . . . . . . . . . . . . . . . . > GROUP BY TransactionType;
  +------------------+--------------------+
  | transactiontype  |   averageamount    |
  +------------------+--------------------+
  | authorization    | 4890.092525252529  |
  | credit           | 4863.769269565219  |
  | debit            | 4982.781458176331  |
  +------------------+--------------------+
  3 rows selected (46.782 seconds)
  </details></pre>

  :exclamation: 2-ой и 3-й раз `select` выполнился быстрее 14.761 sec и 13.008 sec соответственно

- вышел из `beeline` -> `!quit`

- запустил `pyspark` и выполнил [запрос](https://spark.apache.org/docs/latest/api/python/pyspark.sql.html "Ctrl+click -> new tab")

  ```python
  from pyspark.sql import HiveContext
  hc = HiveContext(sc)
  hc.sql("""
  SELECT SubmissionDate, AVG(TransactionAmount) as AvgDebit
  FROM transactions
  WHERE TransactionType = 'debit'
  GROUP BY SubmissionDate
  HAVING SubmissionDate >= '2017-10-01' AND SubmissionDate < '2017-10-06'
  ORDER BY SubmissionDate
  """).show()
  ```

    <pre><details><summary>результат</summary>
    $ pyspark
    Python 2.7.16 (default, Oct 10 2019, 22:02:15) 
    [GCC 8.3.0] on linux2
    Type "help", "copyright", "credits" or "license" for more information.
    Setting default log level to "WARN".
    To adjust logging level use sc.setLogLevel(newLevel). For SparkR, use setLogLevel(newLevel).
    21/02/19 18:51:22 WARN org.apache.spark.scheduler.FairSchedulableBuilder: Fair Scheduler configuration file not found so jobs will be scheduled in FIFO order. To use fair scheduling, configure pools in fairscheduler.xml or set spark.scheduler.allocation.file to a file that contains the configuration.
    Welcome to
          ____              __
         / __/__  ___ _____/ /__
        _\ \/ _ \/ _ `/ __/  '_/
       /__ / .__/\_,_/_/ /_/\_\   version 2.3.4
          /_/
    
    Using Python version 2.7.16 (default, Oct 10 2019 22:02:15)
    SparkSession available as 'spark'.
    >>> from pyspark.sql import HiveContext
    >>> hc = HiveContext(sc)
    >>> hc.sql("""
    ... SELECT SubmissionDate, AVG(TransactionAmount) as AvgDebit
    ... FROM transactions
    ... WHERE TransactionType = 'debit'
    ... GROUP BY SubmissionDate
    ... HAVING SubmissionDate >= '2017-10-01' AND SubmissionDate < '2017-10-06'
    ... ORDER BY SubmissionDate
    ... """).show()
    ivysettings.xml file not found in HIVE_HOME or HIVE_CONF_DIR,/etc/hive/conf.dist/ivysettings.xml will be used
    +--------------+-----------------+                                              
    |SubmissionDate|         AvgDebit|
    +--------------+-----------------+
    |    2017-10-01|4963.114920399849|
    |    2017-10-02|5021.493300510582|
    |    2017-10-03|4982.382279569891|
    |    2017-10-04|4873.302702503676|
    |    2017-10-05|4967.696333583777|
    +--------------+-----------------+
    </details></pre>

- вышел из `pyspark`, `ssh`-сессии

```bash
>>> exit()
$ exit
```

- выгрузил второй датасет из `BigQuery` - `chicago_taxi_trips`

```bash
$ bq --location=us extract --destination_format=CSV --field_delimiter=',' --print_header=false \
    "bigquery-public-data:chicago_taxi_trips.taxi_trips" \
    gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/csv/shard-*.csv
```

- проверил выгруженные файлы (72.83 GiB) :+1:

```bash
$ gsutil ls -rl gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/csv/
gs://de-2020-11-warehouse/chicago_taxi_trips/csv/:
 266025037  2021-02-23T19:13:27Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000000.csv
 266062838  2021-02-23T19:13:25Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000001.csv
 267247182  2021-02-23T19:13:25Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000002.csv
...
 266058736  2021-02-22T17:21:12Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000290.csv
 267162078  2021-02-22T17:21:12Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000291.csv
 269229941  2021-02-22T17:21:06Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000292.csv
TOTAL: 293 objects, 78202883755 bytes (72.83 GiB)

```

- удалил часть файлов для ускорения работы

```bash
$ gsutil ls gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/csv/ | head -261 | xargs gsutil rm
```

- проверил (7.96 GiB) :+1:

```bash
$ gsutil ls -rl gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/csv/
gs://de-2020-11-warehouse/chicago_taxi_trips/csv/:
 268008451  2021-02-23T19:13:30Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000261.csv
 268018464  2021-02-23T19:13:29Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000262.csv
 266015869  2021-02-23T19:13:30Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000263.csv
...
 269231180  2021-02-23T19:13:32Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000290.csv
 266050388  2021-02-23T19:13:30Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000291.csv
 269229941  2021-02-23T19:13:29Z  gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000292.csv
TOTAL: 32 objects, 8545019488 bytes (7.96 GiB)
```

- создал `Hive external table` для `chicago_taxi_trips_csv`

```bash
$ gcloud dataproc jobs submit hive \
    --cluster hive-cluster \
    --region=${GCP_REGION} \
    --execute "CREATE EXTERNAL TABLE chicago_taxi_trips_csv(
          unique_key STRING,
          taxi_id STRING,
          trip_start_timestamp STRING,
          trip_end_timestamp STRING,
          trip_seconds INT,
          trip_miles FLOAT,
          pickup_census_tract INT,
          dropoff_census_tract INT,
          pickup_community_area INT,
          dropoff_community_area INT,
          fare FLOAT,
          tips FLOAT,
          tolls FLOAT,
          extras FLOAT,
          trip_total FLOAT,
          payment_type STRING,
          company STRING,
          pickup_latitude FLOAT,
          pickup_longitude FLOAT,
          pickup_location STRING,
          dropoff_latitude FLOAT,
          dropoff_longitude FLOAT,
          dropoff_location STRING)
        ROW FORMAT DELIMITED
        FIELDS TERMINATED BY ','
        STORED AS TEXTFILE
        location 'gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/csv/';"
```

- проверил :+1: (~21.64 млн строк, ~30.5 сек)

```bash
$ gcloud dataproc jobs submit hive \
    --cluster hive-cluster \
    --region=${GCP_REGION} \
    --execute "SELECT COUNT(*) FROM chicago_taxi_trips_csv;"
Job [b4eb5ece25a84ba6ac6e05a48094ad35] submitted.
Waiting for job output...
Connecting to jdbc:hive2://hive-cluster-m:10000
Connected to: Apache Hive (version 2.3.7)
Driver: Hive JDBC (version 2.3.7)
Transaction isolation: TRANSACTION_REPEATABLE_READ
+-----------+
|    _c0    |
+-----------+
| 21641935  |
+-----------+
1 row selected (30.539 seconds)
Beeline version 2.3.7 by Apache Hive
Closing: 0: jdbc:hive2://hive-cluster-m:10000
Job [b4eb5ece25a84ba6ac6e05a48094ad35] finished successfully.
done: true
...
```

- создал таблицу в формате `parquet`

```bash
$ gcloud dataproc jobs submit hive \
    --cluster hive-cluster \
    --region=${GCP_REGION} \
    --execute "CREATE EXTERNAL TABLE chicago_taxi_trips_parquet(
          unique_key   STRING,
          taxi_id  STRING,
          trip_start_timestamp  TIMESTAMP,
          trip_end_timestamp  TIMESTAMP,
          trip_seconds  INT,
          trip_miles   FLOAT,
          pickup_census_tract  INT,
          dropoff_census_tract  INT,
          pickup_community_area  INT,
          dropoff_community_area  INT,
          fare  FLOAT,
          tips  FLOAT,
          tolls  FLOAT,
          extras  FLOAT,
          trip_total  FLOAT,
          payment_type  STRING,
          company  STRING,
          pickup_latitude  FLOAT,
          pickup_longitude  FLOAT,
          pickup_location  STRING,
          dropoff_latitude  FLOAT,
          dropoff_longitude  FLOAT,
          dropoff_location  STRING)
        STORED AS PARQUET
        location 'gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/parquet/';"
```

- записал данные в таблицу формата `parquet`

```bash
$ gcloud dataproc jobs submit hive \
    --cluster hive-cluster \
    --region=${GCP_REGION} \
    --execute "INSERT OVERWRITE TABLE chicago_taxi_trips_parquet
        SELECT unique_key, taxi_id,
          from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss')) as trip_start_timestamp,
          from_unixtime(to_unix_timestamp(trip_end_timestamp, 'yyyy-MM-dd HH:mm:ss')) as trip_end_timestamp,
          trip_seconds, trip_miles, pickup_census_tract, dropoff_census_tract,
          pickup_community_area, dropoff_community_area, fare, tips, tolls, extras,
          trip_total, payment_type, company, pickup_latitude, pickup_longitude,
          pickup_location, dropoff_latitude, dropoff_longitude, dropoff_location
        FROM chicago_taxi_trips_csv;"
Job [40336eaf490d4ff4bd64c30b0652eec0] submitted.
Waiting for job output...
Connecting to jdbc:hive2://hive-cluster-m:10000
Connected to: Apache Hive (version 2.3.7)
Driver: Hive JDBC (version 2.3.7)
Transaction isolation: TRANSACTION_REPEATABLE_READ
No rows affected (164.913 seconds)
Beeline version 2.3.7 by Apache Hive
Closing: 0: jdbc:hive2://hive-cluster-m:10000
Job [40336eaf490d4ff4bd64c30b0652eec0] finished successfully.
```

- проверил :+1: (~21.64 млн строк, ~0.3 сек)

```bash
$ gcloud dataproc jobs submit hive \
    --cluster hive-cluster \
    --region=${GCP_REGION} \
    --execute "SELECT COUNT(*) FROM chicago_taxi_trips_parquet;"
ob [157c3d9510c44f1a900ea2c9bc5d55fd] submitted.
Waiting for job output...
Connecting to jdbc:hive2://hive-cluster-m:10000
Connected to: Apache Hive (version 2.3.7)
Driver: Hive JDBC (version 2.3.7)
Transaction isolation: TRANSACTION_REPEATABLE_READ
+-----------+
|    _c0    |
+-----------+
| 21641935  |
+-----------+
1 row selected (0.261 seconds)
Beeline version 2.3.7 by Apache Hive
Closing: 0: jdbc:hive2://hive-cluster-m:10000
Job [157c3d9510c44f1a900ea2c9bc5d55fd] finished successfully.
done: true
...
```

- подключился по `ssh` к `hive-cluster-m`

```bash
$ gcloud compute ssh hive-cluster-m
```

- на этот раз использовал движок `presto` для sql-запросов

```bash
$ presto --catalog hive --schema default
presto:default> show tables;
           Table
----------------------------
 chicago_taxi_trips_csv
 chicago_taxi_trips_parquet
(2 rows)

Query 20210223_194654_00005_gbeek, FINISHED, 3 nodes
Splits: 36 total, 36 done (100.00%)
0:00 [2 rows, 82B] [4 rows/s, 177B/s]
```
