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

<div align="center"><h3>Подготовка рабочего окружения</h3></div>

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
```

- проверил :+1:

```bash
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

- создал инстанс `MySQL` в `Cloud SQL` для `Hive Metastore`

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
  > `Google Cloud Dataproc` позволяет подготавливать кластеры `Apache Hadoop` и подключаться к базовым хранилищам аналитических данных.

<pre><details><summary>команда gcloud</summary>
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
</details></pre>

:exclamation: в конце значения параметра `--metadata "hive-metastore-instance=` указал имя инстанса `MySQL` из предыдущего шага

:memo: можно создавать кластер из одной или нескольких нод: для этого указать либо `--single-node` либо `--num-workers=${HMSC_NODE_NUM}`, где `${HMSC_NODE_NUM}` - требуемое количество `workers`.

---

<div align="center"><h3>Загрузка тестовых данных</h3></div>

---

- загрузил датасет `transactions`

```bash
$ gsutil cp gs://hive-solution/part-00000.parquet \
    gs://${GCP_PROJECT}-warehouse/datasets/transactions/part-00000.parquet
Copying gs://hive-solution/part-00000.parquet [Content-Type=application/octet-stream]...
- [1 files][  6.5 MiB/  6.5 MiB]
Operation completed over 1 objects/6.5 MiB.
```

- проверил (6.5 MiB) :+1:

```bash
$ gsutil ls -lr gs://${GCP_BUCKET_NAME}/datasets/
gs://de-2020-11-warehouse/datasets/:

gs://de-2020-11-warehouse/datasets/transactions/:
   6816776  2021-02-19T12:00:00Z  gs://de-2020-11-warehouse/datasets/transactions/part-00000.parquet
TOTAL: 1 objects, 6816776 bytes (6.5 MiB)
```

- выгрузил второй датасет из `BigQuery` - `chicago_taxi_trips`

```bash
$ bq --location=us extract --destination_format=CSV --field_delimiter=',' --print_header=false \
    "bigquery-public-data:chicago_taxi_trips.taxi_trips" \
    gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/csv/shard-*.csv
```

- проверил (72.83 GiB) :+1:

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

---

<div align="center"><h3>transactions</h3></div>

---

- создал внешнюю таблицу `transactions`

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
...
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

---

<div align="center"><h3>chicago_taxi_trips</h3></div>

---

- заглянул внутрь csv-файла для того, чтобы узнать формат дат -> `yyyy-MM-dd HH:mm:ss`

  ```bash
  $ gsutil cat -r 0-1000 gs://de-2020-11-warehouse/chicago_taxi_trips/csv/shard-000000000292.csv
  ```

  <pre><details><summary>вывод</summary>
  2b0196db58ec3e07314409cafa66411ba57fe3aa,cb8ce6a62c9c71e6f09795896fd6642dbb6be0250085fad80d9b9a68577c68a7715a3fab15b1d273e22c4a2d49940b3cad27de2b70c28d1f21e4a07473962f3f,2014-07-03 04:45:00 UTC,2014-07-03 04:45:00 UTC,60,0.1,,,,,3.45,0,0,0,3.45,Cash,,,,,,,
  7c239009cb05a9445cd1fed8286c3628db45b78b,cb8ce6a62c9c71e6f09795896fd6642dbb6be0250085fad80d9b9a68577c68a7715a3fab15b1d273e22c4a2d49940b3cad27de2b70c28d1f21e4a07473962f3f,2014-07-03 04:45:00 UTC,2014-07-03 04:45:00 UTC,600,5.8,,,,,14.25,2,0,0,16.25,Credit Card,,,,,,,
  fff5863fb35fcad12a3f46559787a9f57c789495,cb8ce6a62c9c71e6f09795896fd6642dbb6be0250085fad80d9b9a68577c68a7715a3fab15b1d273e22c4a2d49940b3cad27de2b70c28d1f21e4a07473962f3f,2014-07-02 19:45:00 UTC,2014-07-02 20:30:00 UTC,3060,24.2,,,,,47.25,0,0,2,49.25,Cash,,,,,,,
  66a62219c0eaf69a0f0c76c9868497a3a6e002f9,cb8ce6a62c9c71e6f09795896fd6642dbb6be0250085fad80d9b9a68577c68a7715a3fab15b1d273e22c4a2d49940b3cad27de2b70c28d1f21e4a07473962f3f,2014-07-02 04:00:00 UTC,2014-07-02 04:00:00
  </details></pre>

- создал внешнюю таблицу для формата `csv` -> `chicago_taxi_trips_csv`

  > _колонки trip_start_timestamp и trip_end_timestamp сделал типа **string**, с типом timestamp у меня ничего не получалось, потратил много времени на поиск решения, и ничего лучше этого варианта не придумал..._

  <pre><details><summary>create external table chicago_taxi_trips_csv</summary>
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
  </details></pre>

- проверил :+1: (~21.64 млн строк, ~30.5 сек)

  <pre><details><summary>select count(*) from chicago_taxi_trips_csv;</summary>
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
  </details></pre>

- создал таблицу для формата `parquet` -> `chicago_taxi_trips_parquet`

  <pre><details><summary>create external table chicago_taxi_trips_parquet</summary>
  $ gcloud dataproc jobs submit hive \
      --cluster hive-cluster \
      --region=${GCP_REGION} \
      --execute "CREATE EXTERNAL TABLE chicago_taxi_trips_parquet(
            unique_key STRING,
            taxi_id STRING,
            trip_start_timestamp TIMESTAMP,
            trip_end_timestamp TIMESTAMP,
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
          STORED AS PARQUET
          location 'gs://${GCP_BUCKET_NAME}/chicago_taxi_trips/parquet/';"
  </details></pre>

- записал данные в таблицу формата `parquet`

  <pre><details><summary>insert overwrite table chicago_taxi_trips_parquet</summary>
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
</details></pre>

- проверил :+1: (~21.64 млн строк, ~0.3 сек)

  <pre><details><summary>select count(*) from chicago_taxi_trips_parquet</summary>
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
  </details></pre>

- подключился по `ssh` к `hive-cluster-m`

  ```bash
  $ gcloud compute ssh hive-cluster-m
  ```

---

<div align="center"><h3>Запросы</h3></div>

---

```sql
1. csv: select count(*) from chicago_taxi_trips_csv where trip_miles > 50;
1. prq: select count(*) from chicago_taxi_trips_parquet where trip_miles > 50;
```

- `presto`
  <pre><details><summary>pq_csv#1</summary>
  presto:default> select count(*) from chicago_taxi_trips_csv where trip_miles > 50;
  _col0 
  +------
  28165 
  (1 row)
  
  Query 20210226_190609_00006_ukm5q, FINISHED, 2 nodes
  Splits: 253 total, 253 done (100.00%)
  0:19 [21.6M rows, 7.96GB] [1.12M rows/s, 424MB/s]
  </details></pre>

  <pre><details><summary>pq_prq#1</summary>
  presto:default> select count(*) from chicago_taxi_trips_parquet where trip_miles > 50;
  _col0 
  +------
  28165 
  (1 row)
  
  Query 20210226_191010_00009_ukm5q, FINISHED, 2 nodes
  Splits: 62 total, 62 done (100.00%)
  0:02 [21.6M rows, 60.7MB] [9.26M rows/s, 26MB/s]
  </details></pre>

- `hive`
  <pre><details><summary>hq_csv#1</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select count(*) from chicago_taxi_trips_csv where trip_miles > 50;
  +--------+
  |  _c0   |
  +--------+
  | 28165  |
  +--------+
  1 row selected (32.097 seconds) 
  </details></pre>

  <pre><details><summary>hq_prq#1</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select count(*) from chicago_taxi_trips_parquet where trip_miles > 50;
  +--------+
  |  _c0   |
  +--------+
  | 28165  |
  +--------+
  1 row selected (18.06 seconds)
  </details></pre>

```sql
2. csv: select distinct company, payment_type from chicago_taxi_trips_csv limit 10;
2. prq: select distinct company, payment_type from chicago_taxi_trips_parquet limit 10;
```

- `presto`
  <pre><details><summary>pq_csv#2</summary>
  presto:default> select distinct company, payment_type from chicago_taxi_trips_csv limit 10;
                company                | payment_type 
  -------------------------------------+--------------
  Taxi Affiliation Service Yellow      | Cash         
  Patriot Taxi Dba Peace Taxi Associat | Cash         
  Taxi Affiliation Service Yellow      | Credit Card  
  Sun Taxi                             | Credit Card  
  Sun Taxi                             | Cash         
  Medallion Leasin                     | Credit Card  
  City Service                         | Credit Card  
  City Service                         | Cash         
  Globe Taxi                           | Cash         
  24 Seven Taxi                        | Cash         
  (10 rows)
  
  Query 20210226_191658_00011_ukm5q, FINISHED, 2 nodes
  Splits: 217 total, 25 done (11.52%)
  0:01 [582K rows, 210MB] [402K rows/s, 145MB/s]
  </details></pre>

  <pre><details><summary>pq_prq#2</summary>
  presto:default> select distinct company, payment_type from chicago_taxi_trips_parquet limit 10;
                company                | payment_type 
  -------------------------------------+--------------
  Nova Taxi Affiliation Llc            | Credit Card  
  Taxi Affiliation Service Yellow      | Credit Card  
  Sun Taxi                             | Cash         
  Taxi Affiliation Service Yellow      | Mobile       
  City Service                         | Cash         
  Chicago Carriage Cab Corp            | Cash         
  Taxi Affiliation Service Yellow      | Cash         
  Medallion Leasin                     | Credit Card  
  Patriot Taxi Dba Peace Taxi Associat | Cash         
  Nova Taxi Affiliation Llc            | Cash         
  (10 rows)
  
  Query 20210226_192359_00012_ukm5q, FINISHED, 2 nodes
  Splits: 62 total, 49 done (79.03%)
  0:01 [101K rows, 3.71MB] [171K rows/s, 6.27MB/s]
  </details></pre>

- `hive`
  <pre><details><summary>hq_csv#2</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select distinct company, payment_type from chicago_taxi_trips_csv limit 10;
  +-------------------------------------------+---------------+
  |                  company                  | payment_type  |
  +-------------------------------------------+---------------+
  | 24 Seven Taxi                             | Cash          |
  | 3897 - Ilie Malec                         | Cash          |
  | Chicago Elite Cab Corp.                   | Cash          |
  | 6743 - Luhak Corp                         | Cash          |
  | Blue Diamond                              | Cash          |
  | Chicago Elite Cab Corp. (Chicago Carriag  | Cash          |
  | 1085 - N and W Cab Co                     | Cash          |
  | 5997 - AW Services Inc.                   | Cash          |
  | Checker Taxi Affiliation                  | Cash          |
  | Dispatch Taxi Affiliation                 | Cash          |
  +-------------------------------------------+---------------+
  10 rows selected (32.341 seconds)
  </details></pre>

  <pre><details><summary>hq_prq#2</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select distinct company, payment_type from chicago_taxi_trips_parquet limit 10;
  +-----------------------------+---------------+
  |           company           | payment_type  |
  +-----------------------------+---------------+
  |                             | Cash          |
  | "3721 - Santamaria Express  | Cash          |
  | "Taxicab Insurance Agency   | Cash          |
  | 1247 - Daniel Ayertey       | Cash          |
  | 1469 - 64126 Omar Jada      | Cash          |
  | 2192 - Zeymane Corp         | Cash          |
  | 24 Seven Taxi               | Cash          |
  | 2733 - 74600 Benny Jona     | Cash          |
  | 3385 - Eman Cab             | Cash          |
  | 3897 - Ilie Malec           | Cash          |
  +-----------------------------+---------------+
  10 rows selected (17.653 seconds)
  </details></pre>

```sql
3. csv: select company, payment_type, avg(fare) as fare_avg, count(tips) as tips_cnt, sum(trip_total) as trip_sum from chicago_taxi_trips_csv where trip_miles > 10 group by company, payment_type order by trip_sum desc limit 10;
3. prq: select company, payment_type, avg(fare) as fare_avg, count(tips) as tips_cnt, sum(trip_total) as trip_sum from chicago_taxi_trips_parquet where trip_miles > 10 group by company, payment_type order by trip_sum desc limit 10;
```

- `presto`
  <pre><details><summary>pq_csv#3</summary>
  presto:default> select 
               ->   company, payment_type, avg(fare) as fare_avg, 
               ->   count(tips) as tips_cnt, sum(trip_total) as trip_sum 
               -> from chicago_taxi_trips_csv 
               -> where trip_miles > 10 
               -> group by company, payment_type 
               -> order by trip_sum desc limit 10;
           company          | payment_type | fare_avg  | tips_cnt |  trip_sum   
  --------------------------+--------------+-----------+----------+-------------
                            | Credit Card  | 37.027275 |   521526 | 2.5134564E7 
  Flash Cab                 | Credit Card  | 41.990475 |   308982 |  1.688457E7 
                            | Cash         | 38.157295 |   372651 | 1.5162054E7 
  Flash Cab                 | Cash         | 41.503853 |   221317 |   9806576.0 
  Yellow Cab                | Credit Card  | 35.491512 |   201416 |   9182222.0 
  Chicago Carriage Cab Corp | Credit Card  |  42.40266 |    97859 |   5558971.0 
  Sun Taxi                  | Credit Card  | 42.962994 |    89793 |   5155943.5 
  Yellow Cab                | Cash         | 35.585518 |   124546 |   4743887.5 
  City Service              | Credit Card  | 42.799595 |    79357 |   4501295.0 
  Medallion Leasin          | Credit Card  | 42.188828 |    76977 |   4326827.0 
  (10 rows)
  
  Query 20210226_194236_00015_ukm5q, FINISHED, 2 nodes
  Splits: 314 total, 314 done (100.00%)
  0:15 [21.6M rows, 7.95GB] [1.42M rows/s, 533MB/s]
  </details></pre>

  <pre><details><summary>pq_prq#3</summary>
  presto:default> select 
               ->   company, payment_type, avg(fare) as fare_avg, 
               ->   count(tips) as tips_cnt, sum(trip_total) as trip_sum 
               -> from chicago_taxi_trips_parquet 
               -> where trip_miles > 10 
               -> group by company, payment_type 
               -> order by trip_sum desc limit 10;
           company          | payment_type | fare_avg  | tips_cnt |  trip_sum   
  --------------------------+--------------+-----------+----------+-------------
                            | Credit Card  | 37.027275 |   521526 | 2.5134564E7 
  Flash Cab                 | Credit Card  | 41.990475 |   308982 |  1.688457E7 
                            | Cash         | 38.157295 |   372651 | 1.5162054E7 
  Flash Cab                 | Cash         | 41.503853 |   221317 |   9806576.0 
  Yellow Cab                | Credit Card  | 35.491512 |   201416 |   9182222.0 
  Chicago Carriage Cab Corp | Credit Card  |  42.40266 |    97859 |   5558971.0 
  Sun Taxi                  | Credit Card  | 42.962994 |    89793 |   5155943.5 
  Yellow Cab                | Cash         | 35.585518 |   124546 |   4743887.5 
  City Service              | Credit Card  | 42.799595 |    79357 |   4501295.0 
  Medallion Leasin          | Credit Card  | 42.188828 |    76977 |   4326827.0 
  (10 rows)
  
  Query 20210226_195113_00016_ukm5q, FINISHED, 2 nodes
  Splits: 126 total, 126 done (100.00%)
  0:04 [21.6M rows, 155MB] [5.53M rows/s, 39.6MB/s]
  </details></pre>

- `hive`
  <pre><details><summary>hq_csv#3</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select 
  . . . . . . . . . . . . . . . . . . >   company, payment_type, avg(fare) as fare_avg, 
  . . . . . . . . . . . . . . . . . . >   count(tips) as tips_cnt, sum(trip_total) as trip_sum 
  . . . . . . . . . . . . . . . . . . > from chicago_taxi_trips_csv 
  . . . . . . . . . . . . . . . . . . > where trip_miles > 10 
  . . . . . . . . . . . . . . . . . . > group by company, payment_type 
  . . . . . . . . . . . . . . . . . . > order by trip_sum desc limit 10;
  +----------------------------+---------------+---------------------+-----------+-----------------------+
  |          company           | payment_type  |      fare_avg       | tips_cnt  |       trip_sum        |
  +----------------------------+---------------+---------------------+-----------+-----------------------+
  |                            | Credit Card   | 37.027273500806785  | 521526    | 2.5134563886876106E7  |
  | Flash Cab                  | Credit Card   | 41.99047601477241   | 308982    | 1.6884569577551126E7  |
  |                            | Cash          | 38.15729485945225   | 372651    | 1.5162053984136779E7  |
  | Flash Cab                  | Cash          | 41.50385456209039   | 221317    | 9806576.360176066     |
  | Yellow Cab                 | Credit Card   | 35.49151135112179   | 201416    | 9182222.00885582      |
  | Chicago Carriage Cab Corp  | Credit Card   | 42.40266097139762   | 97859     | 5558970.788137436     |
  | Sun Taxi                   | Credit Card   | 42.96299266089784   | 89793     | 5155943.359415054     |
  | Yellow Cab                 | Cash          | 35.585518042922885  | 124546    | 4743887.57028389      |
  | City Service               | Credit Card   | 42.79959499490314   | 79357     | 4501295.169416428     |
  | Medallion Leasin           | Credit Card   | 42.188825883055976  | 76977     | 4326826.978925705     |
  +----------------------------+---------------+---------------------+-----------+-----------------------+
  10 rows selected (42.777 seconds)
  </details></pre>

  <pre><details><summary>hq_prq#3</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select 
  . . . . . . . . . . . . . . . . . . >   company, payment_type, avg(fare) as fare_avg, 
  . . . . . . . . . . . . . . . . . . >   count(tips) as tips_cnt, sum(trip_total) as trip_sum 
  . . . . . . . . . . . . . . . . . . > from chicago_taxi_trips_parquet 
  . . . . . . . . . . . . . . . . . . > where trip_miles > 10 
  . . . . . . . . . . . . . . . . . . > group by company, payment_type 
  . . . . . . . . . . . . . . . . . . > order by trip_sum desc limit 10;
  +----------------------------+---------------+---------------------+-----------+-----------------------+
  |          company           | payment_type  |      fare_avg       | tips_cnt  |       trip_sum        |
  +----------------------------+---------------+---------------------+-----------+-----------------------+
  |                            | Credit Card   | 37.027273500806785  | 521526    | 2.5134563886876106E7  |
  | Flash Cab                  | Credit Card   | 41.99047601477241   | 308982    | 1.6884569577551126E7  |
  |                            | Cash          | 38.15729485945225   | 372651    | 1.5162053984136779E7  |
  | Flash Cab                  | Cash          | 41.50385456209039   | 221317    | 9806576.360176066     |
  | Yellow Cab                 | Credit Card   | 35.49151135112179   | 201416    | 9182222.00885582      |
  | Chicago Carriage Cab Corp  | Credit Card   | 42.40266097139762   | 97859     | 5558970.788137436     |
  | Sun Taxi                   | Credit Card   | 42.96299266089784   | 89793     | 5155943.359415054     |
  | Yellow Cab                 | Cash          | 35.585518042922885  | 124546    | 4743887.57028389      |
  | City Service               | Credit Card   | 42.79959499490314   | 79357     | 4501295.169416428     |
  | Medallion Leasin           | Credit Card   | 42.188825883055976  | 76977     | 4326826.978925705     |
  +----------------------------+---------------+---------------------+-----------+-----------------------+
  10 rows selected (28.431 seconds)
  </details></pre>

- результат

|                 |   csv#1   |   prq#1   |   csv#2   |   prq#2   |   csv#3   |   prq#3   |
| --------------: | :-------: | :-------: | :-------: | :-------: | :-------: | :-------: |
| **pq (presto)** |  19 sec   |   2 sec   |   1 sec   |   1 sec   |  15 sec   |   4 sec   |
|   **hq (hive)** | 32.01 sec | 18.06 sec | 32.34 sec | 17.65 sec | 42.78 sec | 28.43 sec |

❗`presto` тут всегда быстрее

---

<div align="center"><h3>Вопросы для домашнего задания</h3></div>

---

#### 1. Вывести динамику количества поездок помесячно

- `presto`

  ```sql
  4. csv:
    select
      year(cast(trip_start_timestamp as timestamp)) as year_num,
      month(cast(trip_start_timestamp as timestamp)) as month_num,
      count(*) as trip_total
    from chicago_taxi_trips_csv
    group by 1, 2
    order by 1, 2;

  4. prq:
    select
      year(cast(trip_start_timestamp as timestamp)) as year_num,
      month(cast(trip_start_timestamp as timestamp)) as month_num,
      count(*) as trip_total
    from chicago_taxi_trips_parquet
    group by 1, 2
    order by 1, 2;
  ```

    <pre><details><summary>pq_csv#4</summary>
    presto:default> select 
                 ->   year(cast(trip_start_timestamp as timestamp)) as year_num, 
                 ->   month(cast(trip_start_timestamp as timestamp)) as month_num, 
                 ->   count(*) as trip_total 
                 -> from chicago_taxi_trips_csv 
                 -> group by 1, 2
                 -> order by 1, 2;
    year_num | month_num | trip_total 
    ---------+-----------+------------
        2013 |         1 |     215935 
        2013 |         2 |     132409 
        2013 |         3 |      87160 
        2013 |         4 |     356653 
        2013 |         5 |     127890 
        2013 |         6 |     118216 
        2013 |         7 |      55782 
        2013 |         8 |      19816 
        2013 |         9 |      11780 
        2013 |        10 |      12005 
        2013 |        11 |       6120 
        2013 |        12 |      30358 
        2014 |         1 |     418870 
        2014 |         2 |     380450 
        2014 |         3 |     181850 
        2014 |         4 |      76651 
        2014 |         5 |      77415 
        2014 |         6 |      79741 
        2014 |         7 |     311233 
        2014 |         8 |     440997 
        2014 |         9 |     434875 
        2014 |        10 |     708129 
        2014 |        11 |     673618 
        2014 |        12 |     678707 
        2015 |         1 |     350553 
        2015 |         2 |     358134 
        2015 |         3 |     399913 
        2015 |         4 |     210063 
        2015 |         5 |     662593 
        2015 |         6 |     212830 
        2015 |         7 |     103778 
        2015 |         8 |     122721 
        2015 |         9 |      66106 
        2015 |        10 |        869 
        2015 |        11 |     150001 
        2015 |        12 |     248912 
        2016 |         1 |     138434 
        2016 |         2 |     480477 
        2016 |         3 |     567685 
        2016 |         4 |     651726 
        2016 |         5 |     360785 
        2016 |         6 |     122605 
        2016 |         7 |     529379 
        2016 |         8 |     371470 
        2016 |         9 |      71914 
        2016 |        10 |       8994 
        2016 |        11 |      11239 
        2016 |        12 |       2056 
        2017 |         1 |     613504 
        2017 |         2 |      35399 
        2017 |         3 |       5158 
        2017 |         4 |     279430 
        2017 |         5 |     320573 
        2017 |         6 |     256587 
        2017 |         7 |      59721 
        2017 |         8 |      17052 
        2017 |         9 |     209324 
        2017 |        10 |     572579 
        2017 |        11 |     849572 
        2017 |        12 |     713139 
        2018 |         1 |     411778 
        2018 |         2 |     242562 
        2018 |         3 |       9954 
        2018 |         4 |       5118 
        2018 |         5 |       2779 
        2018 |         6 |     601891 
        2018 |         7 |     131516 
        2018 |         8 |     288211 
        2018 |         9 |     268466 
        2018 |        10 |     266613 
        2018 |        11 |     119173 
        2018 |        12 |     133021 
        2019 |         1 |     115544 
        2019 |         2 |     435101 
        2019 |         3 |      16346 
        2019 |         4 |     239267 
        2019 |         5 |     845748 
        2019 |         6 |    1430430 
        2019 |         7 |      89140 
        2019 |         8 |     217336 
        2019 |         9 |          6 
    (81 rows)
  
    Query 20210226_205755_00038_ukm5q, FINISHED, 2 nodes
    Splits: 336 total, 336 done (100.00%)
    1:38 [21.6M rows, 7.96GB] [220K rows/s, 82.8MB/s]
    </details></pre>

    <pre><details><summary>pq_prq#4</summary>
    presto:default> select 
                 ->   year(cast(trip_start_timestamp as timestamp)) as year_num, 
                 ->   month(cast(trip_start_timestamp as timestamp)) as month_num, 
                 ->   count(*) as trip_total 
                 -> from chicago_taxi_trips_parquet 
                 -> group by 1, 2
                 -> order by 1, 2;
    year_num | month_num | trip_total 
    ---------+-----------+------------
        2013 |         1 |     215935 
        2013 |         2 |     132409 
        2013 |         3 |      87160 
        2013 |         4 |     356653 
        2013 |         5 |     127890 
        2013 |         6 |     118216 
        2013 |         7 |      55782 
        2013 |         8 |      19816 
        2013 |         9 |      11780 
        2013 |        10 |      12005 
        2013 |        11 |       6120 
        2013 |        12 |      30358 
        2014 |         1 |     418870 
        2014 |         2 |     380450 
        2014 |         3 |     181850 
        2014 |         4 |      76651 
        2014 |         5 |      77415 
        2014 |         6 |      79741 
        2014 |         7 |     311233 
        2014 |         8 |     440997 
        2014 |         9 |     434875 
        2014 |        10 |     708129 
        2014 |        11 |     673618 
        2014 |        12 |     678707 
        2015 |         1 |     350553 
        2015 |         2 |     358134 
        2015 |         3 |     399913 
        2015 |         4 |     210063 
        2015 |         5 |     662593 
        2015 |         6 |     212830 
        2015 |         7 |     103778 
        2015 |         8 |     122721 
        2015 |         9 |      66106 
        2015 |        10 |        869 
        2015 |        11 |     150001 
        2015 |        12 |     248912 
        2016 |         1 |     138434 
        2016 |         2 |     480477 
        2016 |         3 |     567685 
        2016 |         4 |     651726 
        2016 |         5 |     360785 
        2016 |         6 |     122605 
        2016 |         7 |     529379 
        2016 |         8 |     371470 
        2016 |         9 |      71914 
        2016 |        10 |       8994 
        2016 |        11 |      11239 
        2016 |        12 |       2056 
        2017 |         1 |     613504 
        2017 |         2 |      35399 
        2017 |         3 |       5158 
        2017 |         4 |     279430 
        2017 |         5 |     320573 
        2017 |         6 |     256587 
        2017 |         7 |      59721 
        2017 |         8 |      17052 
        2017 |         9 |     209324 
        2017 |        10 |     572579 
        2017 |        11 |     849572 
        2017 |        12 |     713139 
        2018 |         1 |     411778 
        2018 |         2 |     242562 
        2018 |         3 |       9954 
        2018 |         4 |       5118 
        2018 |         5 |       2779 
        2018 |         6 |     601891 
        2018 |         7 |     131516 
        2018 |         8 |     288211 
        2018 |         9 |     268466 
        2018 |        10 |     266613 
        2018 |        11 |     119173 
        2018 |        12 |     133021 
        2019 |         1 |     115544 
        2019 |         2 |     435101 
        2019 |         3 |      16346 
        2019 |         4 |     239267 
        2019 |         5 |     845748 
        2019 |         6 |    1430430 
        2019 |         7 |      89140 
        2019 |         8 |     217336 
        2019 |         9 |          6 
    (81 rows)
  
    Query 20210226_211640_00039_ukm5q, FINISHED, 2 nodes
    Splits: 144 total, 144 done (100.00%)
    0:09 [21.6M rows, 50.9MB] [2.3M rows/s, 5.4MB/s]
    </details></pre>

- `hive`

  ```sql
  4. csv:
    select
      year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as year_num,
      month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as month_num,
      count(*) as trip_total
    from chicago_taxi_trips_csv
    group by
      year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))),
      month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss')))
    order by year_num, month_num;

  4. prq:
    select
      year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as year_num,
      month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as month_num,
      count(*) as trip_total
    from chicago_taxi_trips_parquet
    group by
      year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))),
      month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss')))
    order by year_num, month_num;
  ```

  <pre><details><summary>hq_csv#4</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select 
  . . . . . . . . . . . . . . . . . . >   year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as year_num, 
  . . . . . . . . . . . . . . . . . . >   month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as month_num, 
  . . . . . . . . . . . . . . . . . . >   count(*) as trip_total 
  . . . . . . . . . . . . . . . . . . > from chicago_taxi_trips_csv 
  . . . . . . . . . . . . . . . . . . > group by 
  . . . . . . . . . . . . . . . . . . >   year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))), 
  . . . . . . . . . . . . . . . . . . >   month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss')))  
  . . . . . . . . . . . . . . . . . . > order by year_num, month_num;
  +-----------+------------+-------------+
  | year_num  | month_num  | trip_total  |
  +-----------+------------+-------------+
  | 2013      | 1          | 215935      |
  | 2013      | 2          | 132409      |
  | 2013      | 3          | 87160       |
  | 2013      | 4          | 356653      |
  | 2013      | 5          | 127890      |
  | 2013      | 6          | 118216      |
  | 2013      | 7          | 55782       |
  | 2013      | 8          | 19816       |
  | 2013      | 9          | 11780       |
  | 2013      | 10         | 12005       |
  | 2013      | 11         | 6120        |
  | 2013      | 12         | 30358       |
  | 2014      | 1          | 418870      |
  | 2014      | 2          | 380450      |
  | 2014      | 3          | 181850      |
  | 2014      | 4          | 76651       |
  | 2014      | 5          | 77415       |
  | 2014      | 6          | 79741       |
  | 2014      | 7          | 311233      |
  | 2014      | 8          | 440997      |
  | 2014      | 9          | 434875      |
  | 2014      | 10         | 708129      |
  | 2014      | 11         | 673618      |
  | 2014      | 12         | 678707      |
  | 2015      | 1          | 350553      |
  | 2015      | 2          | 358134      |
  | 2015      | 3          | 399913      |
  | 2015      | 4          | 210063      |
  | 2015      | 5          | 662593      |
  | 2015      | 6          | 212830      |
  | 2015      | 7          | 103778      |
  | 2015      | 8          | 122721      |
  | 2015      | 9          | 66106       |
  | 2015      | 10         | 869         |
  | 2015      | 11         | 150001      |
  | 2015      | 12         | 248912      |
  | 2016      | 1          | 138434      |
  | 2016      | 2          | 480477      |
  | 2016      | 3          | 567685      |
  | 2016      | 4          | 651726      |
  | 2016      | 5          | 360785      |
  | 2016      | 6          | 122605      |
  | 2016      | 7          | 529379      |
  | 2016      | 8          | 371470      |
  | 2016      | 9          | 71914       |
  | 2016      | 10         | 8994        |
  | 2016      | 11         | 11239       |
  | 2016      | 12         | 2056        |
  | 2017      | 1          | 613504      |
  | 2017      | 2          | 35399       |
  | 2017      | 3          | 5158        |
  | 2017      | 4          | 279430      |
  | 2017      | 5          | 320573      |
  | 2017      | 6          | 256587      |
  | 2017      | 7          | 59721       |
  | 2017      | 8          | 17052       |
  | 2017      | 9          | 209324      |
  | 2017      | 10         | 572579      |
  | 2017      | 11         | 849572      |
  | 2017      | 12         | 713139      |
  | 2018      | 1          | 411778      |
  | 2018      | 2          | 242562      |
  | 2018      | 3          | 9954        |
  | 2018      | 4          | 5118        |
  | 2018      | 5          | 2779        |
  | 2018      | 6          | 601891      |
  | 2018      | 7          | 131516      |
  | 2018      | 8          | 288211      |
  | 2018      | 9          | 268466      |
  | 2018      | 10         | 266613      |
  | 2018      | 11         | 119173      |
  | 2018      | 12         | 133021      |
  | 2019      | 1          | 115544      |
  | 2019      | 2          | 435101      |
  | 2019      | 3          | 16346       |
  | 2019      | 4          | 239267      |
  | 2019      | 5          | 845748      |
  | 2019      | 6          | 1430430     |
  | 2019      | 7          | 89140       |
  | 2019      | 8          | 217336      |
  | 2019      | 9          | 6           |
  +-----------+------------+-------------+
  81 rows selected (76.706 seconds)
  </details></pre>

  <pre><details><summary>hq_prq#4</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select 
  . . . . . . . . . . . . . . . . . . >   year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as year_num, 
  . . . . . . . . . . . . . . . . . . >   month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))) as month_num, 
  . . . . . . . . . . . . . . . . . . >   count(*) as trip_total 
  . . . . . . . . . . . . . . . . . . > from chicago_taxi_trips_parquet 
  . . . . . . . . . . . . . . . . . . > group by 
  . . . . . . . . . . . . . . . . . . >   year(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss'))), 
  . . . . . . . . . . . . . . . . . . >   month(from_unixtime(to_unix_timestamp(trip_start_timestamp, 'yyyy-MM-dd HH:mm:ss')))  
  . . . . . . . . . . . . . . . . . . > order by year_num, month_num;
  +-----------+------------+-------------+
  | year_num  | month_num  | trip_total  |
  +-----------+------------+-------------+
  | 2013      | 1          | 215935      |
  | 2013      | 2          | 132409      |
  | 2013      | 3          | 87160       |
  | 2013      | 4          | 356653      |
  | 2013      | 5          | 127890      |
  | 2013      | 6          | 118216      |
  | 2013      | 7          | 55782       |
  | 2013      | 8          | 19816       |
  | 2013      | 9          | 11780       |
  | 2013      | 10         | 12005       |
  | 2013      | 11         | 6120        |
  | 2013      | 12         | 30358       |
  | 2014      | 1          | 418870      |
  | 2014      | 2          | 380450      |
  | 2014      | 3          | 181850      |
  | 2014      | 4          | 76651       |
  | 2014      | 5          | 77415       |
  | 2014      | 6          | 79741       |
  | 2014      | 7          | 311233      |
  | 2014      | 8          | 440997      |
  | 2014      | 9          | 434875      |
  | 2014      | 10         | 708129      |
  | 2014      | 11         | 673618      |
  | 2014      | 12         | 678707      |
  | 2015      | 1          | 350553      |
  | 2015      | 2          | 358134      |
  | 2015      | 3          | 399913      |
  | 2015      | 4          | 210063      |
  | 2015      | 5          | 662593      |
  | 2015      | 6          | 212830      |
  | 2015      | 7          | 103778      |
  | 2015      | 8          | 122721      |
  | 2015      | 9          | 66106       |
  | 2015      | 10         | 869         |
  | 2015      | 11         | 150001      |
  | 2015      | 12         | 248912      |
  | 2016      | 1          | 138434      |
  | 2016      | 2          | 480477      |
  | 2016      | 3          | 567685      |
  | 2016      | 4          | 651726      |
  | 2016      | 5          | 360785      |
  | 2016      | 6          | 122605      |
  | 2016      | 7          | 529379      |
  | 2016      | 8          | 371470      |
  | 2016      | 9          | 71914       |
  | 2016      | 10         | 8994        |
  | 2016      | 11         | 11239       |
  | 2016      | 12         | 2056        |
  | 2017      | 1          | 613504      |
  | 2017      | 2          | 35399       |
  | 2017      | 3          | 5158        |
  | 2017      | 4          | 279430      |
  | 2017      | 5          | 320573      |
  | 2017      | 6          | 256587      |
  | 2017      | 7          | 59721       |
  | 2017      | 8          | 17052       |
  | 2017      | 9          | 209324      |
  | 2017      | 10         | 572579      |
  | 2017      | 11         | 849572      |
  | 2017      | 12         | 713139      |
  | 2018      | 1          | 411778      |
  | 2018      | 2          | 242562      |
  | 2018      | 3          | 9954        |
  | 2018      | 4          | 5118        |
  | 2018      | 5          | 2779        |
  | 2018      | 6          | 601891      |
  | 2018      | 7          | 131516      |
  | 2018      | 8          | 288211      |
  | 2018      | 9          | 268466      |
  | 2018      | 10         | 266613      |
  | 2018      | 11         | 119173      |
  | 2018      | 12         | 133021      |
  | 2019      | 1          | 115544      |
  | 2019      | 2          | 435101      |
  | 2019      | 3          | 16346       |
  | 2019      | 4          | 239267      |
  | 2019      | 5          | 845748      |
  | 2019      | 6          | 1430430     |
  | 2019      | 7          | 89140       |
  | 2019      | 8          | 217336      |
  | 2019      | 9          | 6           |
  +-----------+------------+-------------+
  81 rows selected (50.302 seconds)
  </details></pre>

#### 2. Вывести топ-10 компаний (company) по выручке (trip_total)

```sql
5. csv:
  select company, sum(fare) as fare_total
  from chicago_taxi_trips_csv
  group by company
  order by fare_total desc limit 10;

5. prq:
  select company, sum(fare) as fare_total
  from chicago_taxi_trips_parquet
  group by company
  order by fare_total desc limit 10;
```

- `presto`
  <pre><details><summary>pq_csv#5</summary>
  presto:default> select company, sum(fare) as fare_total 
               -> from chicago_taxi_trips_csv 
               -> group by company 
               -> order by fare_total desc limit 10;
              company             |  fare_total  
  --------------------------------+--------------
                                  | 1.00663136E8 
  Flash Cab                       |  5.2181236E7 
  Yellow Cab                      |  3.2698214E7 
  Chicago Carriage Cab Corp       |  1.4797446E7 
  Medallion Leasin                |  1.1755347E7 
  Sun Taxi                        |  1.1097099E7 
  City Service                    |  1.0881035E7 
  Taxi Affiliation Services       |    9673737.0 
  Taxi Affiliation Service Yellow |    8014125.0 
  Globe Taxi                      |    4668605.0 
  (10 rows)
  
  Query 20210226_212510_00042_ukm5q, FINISHED, 2 nodes
  Splits: 318 total, 318 done (100.00%)
  0:15 [21.6M rows, 7.96GB] [1.45M rows/s, 547MB/s]
  </details></pre>

  <pre><details><summary>pq_prq#5</summary>
  presto:default> select company, sum(fare) as fare_total 
              -> from chicago_taxi_trips_parquet 
              -> group by company 
              -> order by fare_total desc limit 10;
              company             |  fare_total  
  ---------------------------------+--------------
                                  | 1.00663136E8 
  Flash Cab                       |  5.2181236E7 
  Yellow Cab                      |  3.2698214E7 
  Chicago Carriage Cab Corp       |  1.4797446E7 
  Medallion Leasin                |  1.1755347E7 
  Sun Taxi                        |  1.1097099E7 
  City Service                    |  1.0881035E7 
  Taxi Affiliation Services       |    9673737.0 
  Taxi Affiliation Service Yellow |    8014125.0 
  Globe Taxi                      |    4668605.0 
  (10 rows)
  
  Query 20210226_214555_00045_ukm5q, FINISHED, 2 nodes
  Splits: 126 total, 126 done (100.00%)
  0:02 [21.6M rows, 32MB] [10.6M rows/s, 15.7MB/s]
  </details></pre>

- `hive`
  <pre><details><summary>hq_csv#5</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select company, sum(fare) as fare_total 
  . . . . . . . . . . . . . . . . . . > from chicago_taxi_trips_csv 
  . . . . . . . . . . . . . . . . . . > group by company 
  . . . . . . . . . . . . . . . . . . > order by fare_total desc limit 10;
  +----------------------------------+-----------------------+
  |             company              |      fare_total       |
  +----------------------------------+-----------------------+
  |                                  | 1.0066313469360045E8  |
  | Flash Cab                        | 5.218123457959385E7   |
  | Yellow Cab                       | 3.269821462575923E7   |
  | Chicago Carriage Cab Corp        | 1.4797446390641816E7  |
  | Medallion Leasin                 | 1.1755347040966257E7  |
  | Sun Taxi                         | 1.1097099269294046E7  |
  | City Service                     | 1.0881034790752165E7  |
  | Taxi Affiliation Services        | 9673736.819789397     |
  | Taxi Affiliation Service Yellow  | 8014124.872699812     |
  | Globe Taxi                       | 4668604.969657799     |
  +----------------------------------+-----------------------+
  10 rows selected (43.337 seconds)
  </details></pre>

  <pre><details><summary>hq_prq#5</summary>
  0: jdbc:hive2://hive-cluster-m:10000> select company, sum(fare) as fare_total 
  . . . . . . . . . . . . . . . . . . > from chicago_taxi_trips_parquet 
  . . . . . . . . . . . . . . . . . . > group by company 
  . . . . . . . . . . . . . . . . . . > order by fare_total desc limit 10;
  +----------------------------------+-----------------------+
  |             company              |      fare_total       |
  +----------------------------------+-----------------------+
  |                                  | 1.0066313469360045E8  |
  | Flash Cab                        | 5.218123457959385E7   |
  | Yellow Cab                       | 3.269821462575923E7   |
  | Chicago Carriage Cab Corp        | 1.4797446390641816E7  |
  | Medallion Leasin                 | 1.1755347040966257E7  |
  | Sun Taxi                         | 1.1097099269294046E7  |
  | City Service                     | 1.0881034790752165E7  |
  | Taxi Affiliation Services        | 9673736.819789397     |
  | Taxi Affiliation Service Yellow  | 8014124.872699812     |
  | Globe Taxi                       | 4668604.969657799     |
  +----------------------------------+-----------------------+
  10 rows selected (18.688 seconds)
  </details></pre>

#### 3. Подсчитать долю поездок <5, 5-15, 16-25, 26-100 миль

- `presto`

  ```sql
  6. csv:
    with cnt as (
    select
      count(*) as trips_all_cnt,
      sum(if(trip_miles >= 0 and trip_miles < 5, 1, 0)) as less_5_cnt,
      sum(if(trip_miles >= 5 and trip_miles < 16 , 1, 0)) as from_5_to_15_cnt,
      sum(if(trip_miles >= 16 and trip_miles < 26 , 1, 0)) as from_16_to_25_cnt,
      sum(if(trip_miles >= 26 and trip_miles < 100 , 1, 0)) as from_26_to_100_cnt,
      sum(if(trip_miles >= 100, 1, 0)) as more_100_cnt,
      sum(if(trip_miles <0 or trip_miles is null, 1, 0)) as no_category_cnt
    from chicago_taxi_trips_csv
    )
    select
      trips_all_cnt,
      less_5_cnt, cast(less_5_cnt as decimal(38, 4)) / trips_all_cnt * 100 as less_5_pct,
      from_5_to_15_cnt, cast(from_5_to_15_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_5_to_15_pct,
      from_16_to_25_cnt, cast(from_16_to_25_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_16_to_25_pct,
      from_26_to_100_cnt, cast(from_26_to_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_26_to_100_pct,
      more_100_cnt, cast(more_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as more_100_pct,
      no_category_cnt, cast(no_category_cnt as decimal(38, 4)) / trips_all_cnt * 100 as no_category_pct
    from cnt;

  6. prq:
    with cnt as (
    select
      count(*) as trips_all_cnt,
      sum(if(trip_miles >= 0 and trip_miles < 5, 1, 0)) as less_5_cnt,
      sum(if(trip_miles >= 5 and trip_miles < 16 , 1, 0)) as from_5_to_15_cnt,
      sum(if(trip_miles >= 16 and trip_miles < 26 , 1, 0)) as from_16_to_25_cnt,
      sum(if(trip_miles >= 26 and trip_miles < 100 , 1, 0)) as from_26_to_100_cnt,
      sum(if(trip_miles >= 100, 1, 0)) as more_100_cnt,
      sum(if(trip_miles <0 or trip_miles is null, 1, 0)) as no_category_cnt
    from chicago_taxi_trips_parquet
    )
    select
      trips_all_cnt,
      less_5_cnt, cast(less_5_cnt as decimal(38, 4)) / trips_all_cnt * 100 as less_5_pct,
      from_5_to_15_cnt, cast(from_5_to_15_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_5_to_15_pct,
      from_16_to_25_cnt, cast(from_16_to_25_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_16_to_25_pct,
      from_26_to_100_cnt, cast(from_26_to_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_26_to_100_pct,
      more_100_cnt, cast(more_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as more_100_pct,
      no_category_cnt, cast(no_category_cnt as decimal(38, 4)) / trips_all_cnt * 100 as no_category_pct
    from cnt;
  ```

    <pre><details><summary>pq_csv#6</summary>
    +----------------+-------------+-------------+-------------------+-------------------+--------------------+--------------------+---------------------+---------------------+---------------+---------------+------------------+------------------+
    | trips_all_cnt  | less_5_cnt  | less_5_pct  | from_5_to_15_cnt  | from_5_to_15_pct  | from_16_to_25_cnt  | from_16_to_25_pct  | from_26_to_100_cnt  | from_26_to_100_pct  | more_100_cnt  | more_100_pct  | no_category_cnt  | no_category_pct  |
    +----------------+-------------+-------------+-------------------+-------------------+--------------------+--------------------+---------------------+---------------------+---------------+---------------+------------------+------------------+
    | 21641935       | 17092947    | 78.980700   | 2906917           | 13.431900         | 1515054            | 7.000500           | 110425              | 0.510200            | 16254         | 0.075100      | 338              | 0.001600         |
    +----------------+-------------+-------------+-------------------+-------------------+--------------------+--------------------+---------------------+---------------------+---------------+---------------+------------------+------------------+
    1 row selected (49.657 seconds)
    </details></pre>

    <pre><details><summary>pq_prq#6</summary>
    +----------------+-------------+-------------+-------------------+-------------------+--------------------+--------------------+---------------------+---------------------+---------------+---------------+------------------+------------------+
    | trips_all_cnt  | less_5_cnt  | less_5_pct  | from_5_to_15_cnt  | from_5_to_15_pct  | from_16_to_25_cnt  | from_16_to_25_pct  | from_26_to_100_cnt  | from_26_to_100_pct  | more_100_cnt  | more_100_pct  | no_category_cnt  | no_category_pct  |
    +----------------+-------------+-------------+-------------------+-------------------+--------------------+--------------------+---------------------+---------------------+---------------+---------------+------------------+------------------+
    | 21641935       | 17092947    | 78.980700   | 2906917           | 13.431900         | 1515054            | 7.000500           | 110425              | 0.510200            | 16254         | 0.075100      | 338              | 0.001600         |
    +----------------+-------------+-------------+-------------------+-------------------+--------------------+--------------------+---------------------+---------------------+---------------+---------------+------------------+------------------+
    1 row selected (25.161 seconds)
    </details></pre>

- `hive`

  ```sql
  6. csv:
    with cnt as (
    select
      count(*) as trips_all_cnt,
      sum(if(trip_miles >= 0 and trip_miles < 5, 1, 0)) as less_5_cnt,
      sum(if(trip_miles >= 5 and trip_miles < 16 , 1, 0)) as from_5_to_15_cnt,
      sum(if(trip_miles >= 16 and trip_miles < 26 , 1, 0)) as from_16_to_25_cnt,
      sum(if(trip_miles >= 26 and trip_miles < 100 , 1, 0)) as from_26_to_100_cnt,
      sum(if(trip_miles >= 100 , 1, 0)) as more_100_cnt,
      sum(if(trip_miles <0 or trip_miles is null, 1, 0)) as no_category_cnt
    from chicago_taxi_trips_csv
    ), pct as (
    select
      trips_all_cnt,
      less_5_cnt, cast(less_5_cnt as decimal(38, 4)) / trips_all_cnt * 100 as less_5_pct,
      from_5_to_15_cnt, cast(from_5_to_15_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_5_to_15_pct,
      from_16_to_25_cnt, cast(from_16_to_25_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_16_to_25_pct,
      from_26_to_100_cnt, cast(from_26_to_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_26_to_100_pct,
      more_100_cnt, cast(more_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as more_100_pct,
      no_category_cnt, cast(no_category_cnt as decimal(38, 4)) / trips_all_cnt * 100 as no_category_pct
    from cnt
    )
    select
      lv.key as `расстояние поездки`,
      lv.agg_str.cnt as `количество`,
      lv.agg_str.pct as `доля`
    from pct
    lateral view explode (
      map(
        'все', named_struct('cnt', trips_all_cnt, 'pct', 100.0000),
        'от 0 до 5 миль', named_struct('cnt', less_5_cnt, 'pct', less_5_pct),
        'от 5 до 16 миль', named_struct('cnt', from_5_to_15_cnt, 'pct', from_5_to_15_pct),
        'от 16 до 26 миль', named_struct('cnt', from_16_to_25_cnt, 'pct', from_16_to_25_pct),
        'от 26 до 100 миль', named_struct('cnt', from_26_to_100_cnt, 'pct', from_26_to_100_pct),
        'свыше 100 миль', named_struct('cnt', more_100_cnt, 'pct', more_100_pct),
        'без нормального значения', named_struct('cnt', no_category_cnt, 'pct', no_category_pct)
      )) lv as key, agg_str;


  6. prq:
    with cnt as (
    select
      count(*) as trips_all_cnt,
      sum(if(trip_miles >= 0 and trip_miles < 5, 1, 0)) as less_5_cnt,
      sum(if(trip_miles >= 5 and trip_miles < 16 , 1, 0)) as from_5_to_15_cnt,
      sum(if(trip_miles >= 16 and trip_miles < 26 , 1, 0)) as from_16_to_25_cnt,
      sum(if(trip_miles >= 26 and trip_miles < 100 , 1, 0)) as from_26_to_100_cnt,
      sum(if(trip_miles >= 100 , 1, 0)) as more_100_cnt,
      sum(if(trip_miles <0 or trip_miles is null, 1, 0)) as no_category_cnt
    from chicago_taxi_trips_parquet
    ), pct as (
    select
      trips_all_cnt,
      less_5_cnt, cast(less_5_cnt as decimal(38, 4)) / trips_all_cnt * 100 as less_5_pct,
      from_5_to_15_cnt, cast(from_5_to_15_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_5_to_15_pct,
      from_16_to_25_cnt, cast(from_16_to_25_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_16_to_25_pct,
      from_26_to_100_cnt, cast(from_26_to_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as from_26_to_100_pct,
      more_100_cnt, cast(more_100_cnt as decimal(38, 4)) / trips_all_cnt * 100 as more_100_pct,
      no_category_cnt, cast(no_category_cnt as decimal(38, 4)) / trips_all_cnt * 100 as no_category_pct
    from cnt
    )
    select
      lv.key as `расстояние поездки`,
      lv.agg_str.cnt as `количество`,
      lv.agg_str.pct as `доля`
    from pct
    lateral view explode (
      map(
        'все', named_struct('cnt', trips_all_cnt, 'pct', 100.0000),
        'от 0 до 5 миль', named_struct('cnt', less_5_cnt, 'pct', less_5_pct),
        'от 5 до 16 миль', named_struct('cnt', from_5_to_15_cnt, 'pct', from_5_to_15_pct),
        'от 16 до 26 миль', named_struct('cnt', from_16_to_25_cnt, 'pct', from_16_to_25_pct),
        'от 26 до 100 миль', named_struct('cnt', from_26_to_100_cnt, 'pct', from_26_to_100_pct),
        'свыше 100 миль', named_struct('cnt', more_100_cnt, 'pct', more_100_pct),
        'без нормального значения', named_struct('cnt', no_category_cnt, 'pct', no_category_pct)
      )) lv as key, agg_str;
  ```

    <pre><details><summary>hq_csv#6</summary>
    +---------------------------+-------------+-------------+
    |    расстояние поездки     | количество  |    доля     |
    +---------------------------+-------------+-------------+
    | все                       | 21641935    | 100.000000  |
    | от 0 до 5 миль            | 17092947    | 78.980700   |
    | от 5 до 16 миль           | 2906917     | 13.431900   |
    | от 16 до 26 миль          | 1515054     | 7.000500    |
    | от 26 до 100 миль         | 110425      | 0.510200    |
    | свыше 100 миль            | 16254       | 0.075100    |
    | без нормального значения  | 338         | 0.001600    |
    +---------------------------+-------------+-------------+
    7 rows selected (46.849 seconds)
    </details></pre>

    <pre><details><summary>hq_prq#6</summary>
    +---------------------------+-------------+-------------+
    |    расстояние поездки     | количество  |    доля     |
    +---------------------------+-------------+-------------+
    | все                       | 21641935    | 100.000000  |
    | от 0 до 5 миль            | 17092947    | 78.980700   |
    | от 5 до 16 миль           | 2906917     | 13.431900   |
    | от 16 до 26 миль          | 1515054     | 7.000500    |
    | от 26 до 100 миль         | 110425      | 0.510200    |
    | свыше 100 миль            | 16254       | 0.075100    |
    | без нормального значения  | 338         | 0.001600    |
    +---------------------------+-------------+-------------+
    7 rows selected (20.918 seconds)
    </details></pre>

- результат

|                 |      csv#4       |   prq#4   |   csv#5    |   prq#5   |     csv#6     |     prq#6     |
| --------------: | :--------------: | :-------: | :--------: | :-------: | :-----------: | :-----------: |
| **pq (presto)** |   1 min 38 sec   | **9 sec** | **15 sec** | **2 sec** |   49.66 sec   |   25.16 sec   |
|   **hq (hive)** | **1 min 17 sec** | 50.3 sec  | 43.34 sec  | 18.69 sec | **46.85 sec** | **20.92 sec** |

❗в этих запросах и `presto` и `hive` показали одинаковый результат -> 3:3, но "победы" `presto` выглядят более убедительно.
