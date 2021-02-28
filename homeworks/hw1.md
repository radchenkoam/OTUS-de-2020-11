<div align="right"><h4>Занятие 1</br>Инженер Данных. Задачи, навыки, инструменты, потребности на рынке</br>
Домашнее задание</h4></div>

<div align="center"><h2>Исследование рынка труда в Российской Федерации</br>по специальности "Инженер Данных" на сайте hh.ru</h2></div>

***
<h3><div align="center">1. Настройка рабочего окружения</div></h3>

***

<p align="right"><img src="https://user-images.githubusercontent.com/29423304/101603876-3d2ac400-3a11-11eb-936c-7bb069c47f89.png" /></p>
<h4><div align="center">Виртуальная машина в Google Cloud Platform</div></h4>

- в проекте **DE-2020-11** создал [виртуальную машину](https://console.cloud.google.com/compute/instances?project=de-2020-11&instancessize=50 "Ctrl+click->new tab") `postgresql-12` командой 
    <pre><details><summary>gcloud</summary>
    $ gcloud beta compute --project=de-2020-11 instances create postrgesql-12 \
          --zone=europe-north1-c \
          --machine-type=e2-medium \
          --subnet=default \
          --network-tier=PREMIUM \
          --maintenance-policy=MIGRATE \
          --service-account=313591580200-compute@developer.gserviceaccount.com \
          --scopes=https://www.googleapis.com/auth/cloud-platform \
          --image=ubuntu-1804-bionic-v20201111 \
          --image-project=ubuntu-os-cloud \
          --boot-disk-size=10GB \
          --boot-disk-type=pd-ssd \
          --boot-disk-device-name=postrgesql-12 \
          --no-shielded-secure-boot \
          --shielded-vtpm \
          --shielded-integrity-monitoring \
          --reservation-affinity=any
    </details></pre>

***
<p align="right"><img src="https://user-images.githubusercontent.com/29423304/101607362-9694f200-3a15-11eb-9aa7-ee85561dbe22.png" /></p>
<h4><div align="center">Установка и настройка сервера баз данных</div></h4>

- подключился к ВМ по `ssh`, установил PostgreSQL 12-й версии
    ```bash
    $ wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    $ echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" | sudo tee  /etc/apt/sources.list.d/pgdg.list
    $ sudo apt -y update && sudo apt -y install postgresql-12 postgresql-client-12
    ```

- немного настроил по рекомендациям [PGTune](https://pgtune.leopard.in.ua/#/ "Ctrl+click->new tab") :fire: 
    ```bash
    $ sudo nano /etc/postgresql/12/main/postgresql.conf
    $ sudo pg_ctlcluster 12 main restart
    ```
    <pre><details><summary>postgresql.conf</summary>
    # DB Version: 12
    # OS Type: linux
    # DB Type: oltp
    # Total Memory (RAM): 4 GB
    # CPUs num: 2
    # Connections num: 20
    # Data Storage: ssd
    
    max_connections = 100
    shared_buffers = 1GB
    effective_cache_size = 3GB
    maintenance_work_mem = 256MB
    checkpoint_completion_target = 0.9
    wal_buffers = 16MB
    default_statistics_target = 100
    random_page_cost = 1.1
    effective_io_concurrency = 200
    work_mem = 52428kB
    min_wal_size = 2GB
    max_wal_size = 8GB
    max_worker_processes = 2
    max_parallel_workers_per_gather = 1
    max_parallel_workers = 2
    max_parallel_maintenance_workers = 1
    </details></pre>

- проверил, что всё ок :+1: 
    ```bash
    $ sudo -u postgres pg_lsclusters
    Ver Cluster Port Status Owner    Data directory              Log file
    12  main    5432 online postgres /var/lib/postgresql/12/main /var/log/postgresql/postgresql-12-main.log
   ```

- подключился к серверу PostgreSQL через клиент `psql`
    ```bash
    $ sudo su postgres
    $ psql
    ```

- создал БД `hw1`
    ```bash
    postgres=# create database hw1;
    CREATE DATABASE
    ```

- создал пользователя `appuser` и дал ему полные разрешения на БД `hw1`
    ```bash
    postgres=# \c hw1
    You are now connected to database "hw1" as user "postgres".
    hw1=# create user appuser with password 'ktw$399S04G5';
    CREATE ROLE
    hw1=# grant all privileges on database hw1 to appuser;
    GRANT
    ```

- прокинул порт 5432 через `ssh` на свой локальный компьютер
   ```bash
   $ gcloud compute ssh postrgesql-12 \
        --project de-2020-11 \
        --zone europe-north1-c \
        -- -L 5432:localhost:5432
    ```

- подключился к PostgreSQL с использованием нового логина-пароля :+1: 
    ```bash
    $ psql -h 127.0.0.1 -p 5432 -d hw1 -U appuser -W
    Password: ktw$399S04G5
    psql (12.4 (Ubuntu 12.4-0ubuntu0.20.04.1), server 12.5 (Ubuntu 12.5-1.pgdg18.04+1))
    SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
    Type "help" for help.
    
    hw1=> 
    ```

- создал таблицы в БД `hw1`
    - вакансии
    <pre><details><summary>public.vacancies</summary>
    create table if not exists public.vacancies (
      id integer not null,
      "name" text not null,
      "area" jsonb null,
      salary jsonb null,
      "type" jsonb null,
      experience jsonb null,
      schedule jsonb null,
      employment jsonb null,
      "description" text null, 
      key_skills jsonb null,
      employer jsonb null,
      published_at timestamptz not null,
      created_at timestamptz not null default current_timestamp,
      constraint vacancies_pk primary key (id)
    );</details></pre>

    - витрина
    <pre><details><summary>public.clusters</summary>
    create table if not exists public.clusters (
      id serial, -- идентификатор кластера
      "name" text not null default 'noname'::text, -- имя
      "type" text not null default 'notype'::text, -- тип
      url text null, -- url
      cnt int4 not null default 0, -- количество
      constraint clusters_pk primary key (id)
    );</details></pre>

***
<p align="right"><img src="https://user-images.githubusercontent.com/29423304/101608416-bb3d9980-3a16-11eb-976e-7f802e8cfcf1.png" /></p>
<h4><div align="center">Установка и настройка платформы аналитики</div></h4>

- установил на виртуальной машине ```postgresql-12``` Grafana :link: [Grafana docs](https://grafana.com/docs/grafana/latest/installation/debian/ "Ctrl+click->new tab")
    ```bash
    $ sudo apt-get install -y apt-transport-https
    $ sudo apt-get install -y software-properties-common wget
    $ wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
    $ echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
    $ sudo apt-get update
    $ sudo apt-get install grafana
    ```

- запустил
    ```bash
    $ sudo systemctl daemon-reload
    $ sudo systemctl start grafana-server
    $ sudo systemctl status grafana-server
    $ sudo systemctl enable grafana-server.service
    ```

- установил плагин [Pie Chart](https://grafana.com/grafana/plugins/grafana-piechart-panel "Ctrl+click->new tab")
    ```bash
    $ grafana-cli plugins install grafana-piechart-panel
    ```

- прокинул 3000-й порт (по умолчанию) на локальный компьютер
    ```bash
    $ gcloud compute ssh postrgesql-12 \
         --project de-2020-11 \
         --zone europe-north1-c \
         -- -L 3000:localhost:3000
    ```
- открыл web-интерфейс ```http://localhost:3000/```, ввел логин-пароль по умолчанию ```admin-admin```

- Grafana готова к работе :+1: 

***
<h3><div align="center">2. Получение данных</div></h3>

***

<h4><div align="center">Загрузка исходных данных</div></h4>

- написал на [Node.js](https://nodejs.org/en/ "Ctrl+click->new tab") простое [приложение](https://github.com/radchenkoam/OTUS-de-2020-11/tree/dev/nodejs/hhru "Ctrl+click->new tab") 

- с его помощью достал данные о вакансиях через API сайта [hh.ru](https://hh.ru/) и записал их в базу данных

<h4><div align="center">Трансформация данных</div></h4>

- через API есть возможность получить некоторые статистические данные, но для более подробного анализа надо получить и обработать тексты вакансий целиком, это и сделано в приложении

- после получения данных я выполнил небольшие скрипты для дальнейшего формирования витрины
    - по ключевым навыкам
    ```sql
    insert into public.clusters ("name", "type", cnt)
    select  upper(jsonb_array_elements(key_skills) #>> '{name}') as "name",
            'Ключевые навыки' as "type",
            count(*) as cnt
    from public.vacancies
    where key_skills <> '{}'::jsonb
    group by upper(jsonb_array_elements(key_skills) #>> '{name}');
    ```
    - по наименованию компаний
    ```sql
    insert into public.clusters ("name", "type", cnt)
    select  upper((employer ->> 'name')::text) as "name",
            'Компания' as "type",
            count(*) as cnt
    from public.vacancies
    group by upper((employer ->> 'name')::text);
    ```
    - с помощью полнотекстового поиска провел простой анализ описаний вакансий, искал вхождение ключевых слов в тексте (слова для поиска взял из набора Ключевых навыков)
    ```sql
    create index idx_gin_description
    on public.vacancies  
    using gin (to_tsvector('english', "description"));
    
    insert into public.clusters ("name", "type", cnt)
    select c."name", 'Упоминание' as "type", count(*) as cnt 
    from public.vacancies as v
          cross join public.clusters as c 
    where c."type" = 'Ключевые навыки' and
          to_tsvector(v.description) @@ plainto_tsquery(c."name")
    group by c."name";
    ```

    ***
<h3><div align="center">3. Анализ данных</div></h3>

***

<h4><div align="center">Grafana-dashboard</div></h4>

Сделал дашборд на Графане:

- общая информация и анализ по компаниям
![image](https://user-images.githubusercontent.com/29423304/101540273-d4abfa80-39b0-11eb-851d-4b4691f4a722.png)
- распределение вакансий по регионам
![image](https://user-images.githubusercontent.com/29423304/101540414-06bd5c80-39b1-11eb-8faa-d699bd6ea393.png)
- ключевые навыки в вакансиях и анализ упоминаний ключевых слов в описаниях вакансий
![image](https://user-images.githubusercontent.com/29423304/101540481-20f73a80-39b1-11eb-9912-2b6657635e62.png)

<pre><details><summary>JSON модель дашборда</summary>
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "description": "За последний месяц",
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "collapsed": false,
      "datasource": null,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 0
      },
      "id": 21,
      "panels": [],
      "title": "Общее",
      "type": "row"
    },
    {
      "datasource": "PostgreSQL",
      "description": "",
      "fieldConfig": {
        "defaults": {
          "custom": {},
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 400
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 4,
        "x": 0,
        "y": 1
      },
      "id": 9,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "mean"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "value"
      },
      "pluginVersion": "7.3.4",
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "none",
          "rawQuery": false,
          "rawSql": "SELECT\n  now() AS \"time\",\n  count(*)\nFROM vacancies\nORDER BY 1",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "count(*)"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "vacancies",
          "timeColumn": "now()",
          "timeColumnType": "timestamptz",
          "where": []
        }
      ],
      "timeFrom": null,
      "timeShift": null,
      "title": "Общее количество вакансий",
      "type": "stat"
    },
    {
      "cacheTimeout": null,
      "datasource": "PostgreSQL",
      "description": "Заработная плата",
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": null,
            "filterable": false
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 24
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 7,
        "x": 4,
        "y": 1
      },
      "id": 10,
      "interval": null,
      "links": [],
      "options": {
        "displayMode": "lcd",
        "orientation": "horizontal",
        "reduceOptions": {
          "calcs": [
            "mean"
          ],
          "fields": "",
          "values": false
        },
        "showUnfilled": true
      },
      "pluginVersion": "7.3.4",
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "name",
          "rawQuery": true,
          "rawSql": "SELECT\n  now() AS \"time\",\n  name AS metric,\n  cnt\nFROM clusters\nWHERE\n  type = 'Зарплата'\nORDER BY 3 desc",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "cnt"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "clusters",
          "timeColumn": "now()",
          "timeColumnType": "int4",
          "where": [
            {
              "datatype": "text",
              "name": "",
              "params": [
                "type",
                "=",
                "'Регион'"
              ],
              "type": "expression"
            }
          ]
        }
      ],
      "timeFrom": null,
      "timeShift": null,
      "title": "Зарплата",
      "type": "bargauge"
    },
    {
      "cacheTimeout": null,
      "datasource": "PostgreSQL",
      "description": "График работы",
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": null,
            "filterable": false
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 131
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 7,
        "x": 11,
        "y": 1
      },
      "id": 12,
      "interval": null,
      "links": [],
      "options": {
        "displayMode": "lcd",
        "orientation": "horizontal",
        "reduceOptions": {
          "calcs": [
            "mean"
          ],
          "fields": "",
          "values": false
        },
        "showUnfilled": true
      },
      "pluginVersion": "7.3.4",
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "name",
          "rawQuery": true,
          "rawSql": "SELECT\n  now() AS \"time\",\n  name AS metric,\n  cnt\nFROM clusters\nWHERE\n  type = 'График работы'\nORDER BY 3 desc",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "cnt"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "clusters",
          "timeColumn": "now()",
          "timeColumnType": "int4",
          "where": [
            {
              "datatype": "text",
              "name": "",
              "params": [
                "type",
                "=",
                "'Регион'"
              ],
              "type": "expression"
            }
          ]
        }
      ],
      "timeFrom": null,
      "timeShift": null,
      "title": "График работы",
      "type": "bargauge"
    },
    {
      "cacheTimeout": null,
      "datasource": "PostgreSQL",
      "description": "Опыт работы",
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": null,
            "filterable": false
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 99
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 6,
        "x": 18,
        "y": 1
      },
      "id": 13,
      "interval": null,
      "links": [],
      "options": {
        "displayMode": "lcd",
        "orientation": "horizontal",
        "reduceOptions": {
          "calcs": [
            "mean"
          ],
          "fields": "",
          "values": false
        },
        "showUnfilled": true
      },
      "pluginVersion": "7.3.4",
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "name",
          "rawQuery": true,
          "rawSql": "SELECT\n  now() AS \"time\",\n  name AS metric,\n  cnt\nFROM clusters\nWHERE\n  type = 'Опыт работы'\nORDER BY 3 desc",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "cnt"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "clusters",
          "timeColumn": "now()",
          "timeColumnType": "int4",
          "where": [
            {
              "datatype": "text",
              "name": "",
              "params": [
                "type",
                "=",
                "'Регион'"
              ],
              "type": "expression"
            }
          ]
        }
      ],
      "timeFrom": null,
      "timeShift": null,
      "title": "Опыт работы",
      "type": "bargauge"
    },
    {
      "collapsed": false,
      "datasource": null,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 6
      },
      "id": 19,
      "panels": [],
      "title": "Компании",
      "type": "row"
    },
    {
      "aliasColors": {},
      "breakPoint": "50%",
      "cacheTimeout": null,
      "combine": {
        "label": "Другие компании",
        "threshold": "0.01"
      },
      "datasource": "PostgreSQL",
      "decimals": null,
      "description": "Регионы с вакансиями",
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": null,
            "filterable": false
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "fontSize": "80%",
      "format": "short",
      "gridPos": {
        "h": 17,
        "w": 11,
        "x": 0,
        "y": 7
      },
      "id": 11,
      "interval": null,
      "legend": {
        "header": "Количество вакансий",
        "percentage": true,
        "show": true,
        "values": true
      },
      "legendType": "Right side",
      "links": [],
      "nullPointMode": "connected",
      "pieType": "donut",
      "pluginVersion": "7.3.4",
      "strokeWidth": "0.1",
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "name",
          "rawQuery": true,
          "rawSql": "SELECT\n  now() AS \"time\",\n  name AS metric,\n  cnt\nFROM clusters\nWHERE\n  type = 'Компания'\nORDER BY 3 desc",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "cnt"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "clusters",
          "timeColumn": "now()",
          "timeColumnType": "int4",
          "where": [
            {
              "datatype": "text",
              "name": "",
              "params": [
                "type",
                "=",
                "'Регион'"
              ],
              "type": "expression"
            }
          ]
        }
      ],
      "timeFrom": null,
      "timeShift": null,
      "title": "Компании",
      "type": "grafana-piechart-panel",
      "valueName": "current"
    },
    {
      "aliasColors": {},
      "breakPoint": "50%",
      "cacheTimeout": null,
      "combine": {
        "label": "Другие отрасли",
        "threshold": ""
      },
      "datasource": "PostgreSQL",
      "decimals": null,
      "description": "Отрасли в которых представлены компании, подавшие вакансии",
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": null,
            "filterable": false
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "fontSize": "80%",
      "format": "short",
      "gridPos": {
        "h": 17,
        "w": 13,
        "x": 11,
        "y": 7
      },
      "id": 7,
      "interval": null,
      "legend": {
        "header": "Количество вакансий",
        "percentage": true,
        "show": true,
        "values": true
      },
      "legendType": "Right side",
      "links": [],
      "nullPointMode": "connected",
      "pieType": "donut",
      "pluginVersion": "7.3.4",
      "strokeWidth": "0.1",
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "name",
          "rawQuery": true,
          "rawSql": "SELECT\n  now() AS \"time\",\n  name AS metric,\n  cnt\nFROM clusters\nWHERE\n  type = 'Отрасль компании'\nORDER BY 3 desc",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "cnt"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "clusters",
          "timeColumn": "now()",
          "timeColumnType": "int4",
          "where": [
            {
              "datatype": "text",
              "name": "",
              "params": [
                "type",
                "=",
                "'Регион'"
              ],
              "type": "expression"
            }
          ]
        }
      ],
      "timeFrom": null,
      "timeShift": null,
      "title": "Распределение компаний по отраслям",
      "type": "grafana-piechart-panel",
      "valueName": "current"
    },
    {
      "collapsed": true,
      "datasource": null,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 24
      },
      "id": 17,
      "panels": [
        {
          "aliasColors": {},
          "breakPoint": "50%",
          "cacheTimeout": null,
          "combine": {
            "label": "Другие регионы",
            "threshold": ""
          },
          "datasource": "PostgreSQL",
          "decimals": null,
          "description": "Регионы с вакансиями",
          "fieldConfig": {
            "defaults": {
              "custom": {
                "align": null,
                "filterable": false
              },
              "mappings": [],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": null
                  },
                  {
                    "color": "red",
                    "value": 80
                  }
                ]
              }
            },
            "overrides": []
          },
          "fontSize": "80%",
          "format": "short",
          "gridPos": {
            "h": 16,
            "w": 11,
            "x": 0,
            "y": 3
          },
          "id": 6,
          "interval": null,
          "legend": {
            "header": "Количество вакансий",
            "percentage": true,
            "show": true,
            "values": true
          },
          "legendType": "Right side",
          "links": [],
          "nullPointMode": "connected",
          "pieType": "donut",
          "pluginVersion": "7.3.4",
          "strokeWidth": "0.1",
          "targets": [
            {
              "format": "time_series",
              "group": [],
              "metricColumn": "name",
              "rawQuery": true,
              "rawSql": "SELECT\n  now() AS \"time\",\n  name AS metric,\n  cnt\nFROM clusters\nWHERE\n  type = 'Регион'\nORDER BY 3 desc",
              "refId": "A",
              "select": [
                [
                  {
                    "params": [
                      "cnt"
                    ],
                    "type": "column"
                  }
                ]
              ],
              "table": "clusters",
              "timeColumn": "now()",
              "timeColumnType": "int4",
              "where": [
                {
                  "datatype": "text",
                  "name": "",
                  "params": [
                    "type",
                    "=",
                    "'Регион'"
                  ],
                  "type": "expression"
                }
              ]
            }
          ],
          "timeFrom": null,
          "timeShift": null,
          "title": "Регионы вакансий",
          "type": "grafana-piechart-panel",
          "valueName": "current"
        }
      ],
      "title": "География",
      "type": "row"
    },
    {
      "collapsed": true,
      "datasource": null,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 25
      },
      "id": 15,
      "panels": [
        {
          "aliasColors": {},
          "breakPoint": "50%",
          "cacheTimeout": null,
          "combine": {
            "label": "Другие навыки",
            "threshold": "0.0065"
          },
          "datasource": "PostgreSQL",
          "decimals": null,
          "description": "Ключевые навыки, указанные в вакансиях",
          "fieldConfig": {
            "defaults": {
              "custom": {
                "align": null,
                "filterable": false
              },
              "mappings": [
                {
                  "from": "",
                  "id": 1,
                  "text": "name",
                  "to": "",
                  "type": 1,
                  "value": "cnt"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": null
                  }
                ]
              },
              "unit": "none"
            },
            "overrides": []
          },
          "fontSize": "100%",
          "format": "short",
          "gridPos": {
            "h": 19,
            "w": 11,
            "x": 0,
            "y": 9
          },
          "id": 4,
          "interval": null,
          "legend": {
            "header": "Количество вакансий",
            "percentage": true,
            "show": true,
            "sideWidth": null,
            "values": true
          },
          "legendType": "Right side",
          "links": [],
          "nullPointMode": "connected",
          "pieType": "donut",
          "pluginVersion": "7.3.4",
          "strokeWidth": "0.01",
          "targets": [
            {
              "format": "time_series",
              "group": [],
              "metricColumn": "none",
              "rawQuery": true,
              "rawSql": "select now() as time, \"name\" as metric, cnt as value from public.clusters where type = 'Ключевые навыки' order by cnt desc;\n",
              "refId": "B",
              "select": [
                [
                  {
                    "params": [
                      "value"
                    ],
                    "type": "column"
                  }
                ]
              ],
              "timeColumn": "time",
              "where": [
                {
                  "name": "$__timeFilter",
                  "params": [],
                  "type": "macro"
                }
              ]
            }
          ],
          "timeFrom": null,
          "timeShift": null,
          "title": "Ключевые навыки",
          "transformations": [],
          "type": "grafana-piechart-panel",
          "valueName": "current"
        },
        {
          "datasource": "PostgreSQL",
          "description": "Частота упоминания ключевых слов в описании вакансии",
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "palette-classic"
              },
              "custom": {
                "align": null,
                "displayMode": "auto",
                "filterable": false,
                "width": 0
              },
              "mappings": [],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": null
                  }
                ]
              }
            },
            "overrides": [
              {
                "matcher": {
                  "id": "byName",
                  "options": "metric"
                },
                "properties": [
                  {
                    "id": "displayName",
                    "value": "Ключевое слово"
                  },
                  {
                    "id": "custom.displayMode",
                    "value": "color-text"
                  },
                  {
                    "id": "custom.align",
                    "value": "right"
                  }
                ]
              },
              {
                "matcher": {
                  "id": "byName",
                  "options": "cnt"
                },
                "properties": [
                  {
                    "id": "displayName",
                    "value": "Количество"
                  },
                  {
                    "id": "custom.displayMode",
                    "value": "basic"
                  }
                ]
              },
              {
                "matcher": {
                  "id": "byName",
                  "options": "time"
                },
                "properties": [
                  {
                    "id": "displayName",
                    "value": "."
                  },
                  {
                    "id": "custom.width",
                    "value": 50
                  }
                ]
              }
            ]
          },
          "gridPos": {
            "h": 19,
            "w": 13,
            "x": 11,
            "y": 9
          },
          "id": 23,
          "options": {
            "showHeader": true,
            "sortBy": [
              {
                "desc": true,
                "displayName": "Количество"
              }
            ]
          },
          "pluginVersion": "7.3.4",
          "targets": [
            {
              "format": "table",
              "group": [],
              "metricColumn": "name",
              "rawQuery": true,
              "rawSql": "SELECT\n  null AS \"time\",\n  name AS metric,\n  cnt\nFROM clusters\nWHERE\n  type = 'Упоминание'\nORDER BY 3 desc",
              "refId": "A",
              "select": [
                [
                  {
                    "params": [
                      "cnt"
                    ],
                    "type": "column"
                  }
                ]
              ],
              "table": "clusters",
              "timeColumn": "null",
              "timeColumnType": "int4",
              "where": [
                {
                  "datatype": "text",
                  "name": "",
                  "params": [
                    "type",
                    "=",
                    "'Упоминание'"
                  ],
                  "type": "expression"
                }
              ]
            }
          ],
          "timeFrom": null,
          "timeShift": null,
          "title": "Частота упоминания ключевых слов в описании вакансии",
          "type": "table"
        }
      ],
      "title": "Навыки",
      "type": "row"
    }
  ],
  "schemaVersion": 26,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Анализ вакансий \"Инженер данных\" сайта hh.ru (HeadHunter)",
  "uid": "bvq7ZG1Gz",
  "version": 43
}
</details></pre>

***
<h3><div align="center">4. Выводы</div></h3>

***

Из этого анализа ясно видно, какие технологии и языки сегодня лидируют в отрасли управления данными. 

На сегодняшний день Инженеру данных необходимо более чем уверенное знание языка запросов SQL, умение работать и с классическими реляционными базами данных (MSSQL, PostgreSQL, Oracle и др.), и с NoSQL решениями, и с колоночными СУБД.

Необходимо дополнительно знать еще хотя бы один язык программирования, многие работодатели хотят, чтобы соискатель хорошо знал Python, но можно Java или SCALA.

Наиболее востребованным на сегодня является знание и умение работать в стеке Hadoop/Spark/Hive, владение инструментами ETL/ELT, знание систем очередей сообщений, систем потоковой обработки данных.

Обязательным является знание Linux, неплохо знать системы контейнеризации (Docker), оркестрации (Kubernetes), уметь работать с GIT.

:exclamation: Для себя я сделал вывод развиваться в этом направлении -> 
- PostgreSQL/Greenplum/MongoDB/ClickHouse
- Hadoop/Spark/Hive/Scala/Kafka (Confluent)
- Python/Javascript
- по ETL/ELT я еще не определился, не владею достаточной информацией, чтобы сделать осознанный выбор

<pre><details><summary>Полная таблица поиска по ключевым словам</summary>
SQL | 293
PYTHON | 275
DATA ENGINEER | 217
DATA ENGINEERING | 217
ETL | 177
SPARK | 174
HADOOP | 165
РАЗРАБОТКА ПО | 118
AIRFLOW | 110
HIVE | 103
KAFKA | 103
DATA SCIENCE | 98
SCALA | 97
JAVA | 93
BIG DATA | 91
LINUX | 85
GIT | 85
DOCKER | 84
ORACLE | 79
BI | 79
DEVOPS | 78
ML | 75
POSTGRESQL | 73
АНАЛИЗ ДАННЫХ | 72
CLICKHOUSE | 70
DATA SCIENTIST | 70
РАБОТА В КОМАНДЕ | 63
API | 62
DWH | 58
СУБД | 58
TEAM MANAGEMENT | 56
APACHE SPARK | 55
NOSQL | 50
PANDAS | 50
ПРОЕКТИРОВАНИЕ | 49
KUBERNETES | 49
CI/CD | 47
BUSINESS DEVELOPMENT | 44
PROJECT MANAGEMENT | 44
JIRA | 43
HDFS | 43
MACHINE LEARNING | 42
TABLEAU | 42
ХРАНИЛИЩЕ ДАННЫХ | 41
R | 40
APACHE KAFKA | 40
HBASE | 39
DATA STREAMING | 39
MYSQL | 39
NUMPY | 37
CONFLUENCE | 37
DATA ANALYST | 37
GREENPLUM | 35
SPARK STREAMING | 35
APACHE HIVE | 35
AWS | 34
ANALYTICAL SKILLS | 34
ВИТРИНЫ ДАННЫХ | 34
ОБУЧЕНИЕ И РАЗВИТИЕ | 33
C# | 32
BASH | 32
C++ | 32
DATABASES | 32
TERADATA | 32
ETL DEVELOPER | 30
OLAP | 29
JENKINS | 29
NIFI | 29
BUSINESS SCIENCE | 28
VERTICA | 28
GITLAB | 28
ELASTICSEARCH | 28
ANSIBLE | 27
БАЗЫ ДАННЫХ | 27
INFORMATICA | 27
POWER BI | 26
DEEP LEARNING | 25
GOOGLE CLOUD | 25
ANALYSIS | 23
DATA ANALYSIS | 23
CASSANDRA | 23
SSIS | 22
YARN | 22
РАБОТА С БАЗАМИ ДАННЫХ | 22
UNIX | 22
PYSPARK | 21
SAS | 21
ОПТИМИЗАЦИЯ ЗАПРОСОВ | 21
QUERY | 21
KAFKA - ORACLE | 20
BIGQUERY | 20
АНГЛИЙСКИЙ ЯЗЫК | 20
FLINK | 20
REST | 20
ACCESS | 20
PRODUCT MANAGEMENT | 20
MONGODB | 19
JAVASCRIPT | 19
SCRUM | 19
OOZIE | 19
GRAFANA | 18
BUSINESS ANALYSIS | 18
TENSORFLOW | 17
IMPALA | 17
WINDOWS | 17
GOOGLE BIGQUERY | 16
DATA COLLECTION | 16
PYTORCH | 16
DASHBOARDS | 16
RABBITMQ | 16
POWERBI | 14
GOOGLE ANALYTICS | 14
DATA GOVERNANCE | 13
ELT | 13
ПРОГНОЗИРОВАНИЕ | 13
NLP | 13
PENTAHO | 12
KINESIS | 12
SSRS | 12
ALGORITHMS | 12
GCP | 12
MDX | 11
COGNOS | 11
PL/SQL | 11
AGILE PROJECT MANAGEMENT | 11
REDIS | 11
FLASK | 11
RDBMS | 11
УПРАВЛЕНИЕ КОМАНДОЙ | 10
ORACLE PL/SQL | 10
УМЕНИЕ ПРИНИМАТЬ РЕШЕНИЯ | 10
OPENSHIFT | 10
SAP | 10
DATA MINING | 10
СТАТИСТИКА | 9
QLIK | 9
MS SQL SERVER | 9
PARQUET | 9
POWER PIVOT | 9
POWERMAP | 9
ACTIVEMQ | 8
DWH, DATA LAKE, | 8
ИНФОРМАЦИОННЫЕ ТЕХНОЛОГИИ | 7
AMAZON WEB SERVICES | 7
REACT | 7
ALGORITHMS AND DATA STRUCTURES | 7
DAX | 7
ООП | 7
ВИЗУАЛИЗАЦИЯ ДАННЫХ | 7
УПРАВЛЕНИЕ КАЧЕСТВОМ | 6
AWS SQS | 6
OKTA | 6
ELK | 6
TALEND | 6
JUPYTER | 6
MS SSIS | 6
GRAPH | 6
NEO4J | 6
ADMINISTRATION | 6
AWS COGNITO | 6
PL/PGSQL | 6
GOLANG | 6
СТРУКТУРЫ ДАННЫХ И АЛГОРИТМЫ | 5
УПРАВЛЕНИЕ ПРОЕКТАМИ | 5
AWS NEPTUNE | 5
CYPHER | 5
GO | 5
GREMLIN | 5
GROOVY | 5
LEADERSHIP SKILLS | 5
MS OFFICE | 5
NODE.JS | 5
PREGEL | 5
SHELL SCRIPTING | 5
SPARQL | 5
TINKERPOP | 5
ZABBIX | 5
АДМИНИСТРИРОВАНИЕ СЕРВЕРОВ LINUX | 5
ПОСТАНОВКА ЗАДАЧ РАЗРАБОТЧИКАМ | 5
ORGANIZATION SKILLS | 4
UX | 4
FINAGLE | 4
SPRING FRAMEWORK | 4
NER | 4
KOTLIN | 4
DATA STUDIO | 4
ADOBE ACROBAT | 4
ADH | 4
SQOOP | 4
CSS | 4
ГРАМОТНАЯ РЕЧЬ | 4
АНАЛИТИЧЕСКИЕ ИССЛЕДОВАНИЯ | 4
SAP BI | 4
DEVOPS METHODOLOGY | 4
UNIX SHELL | 4
ВАЛИДАЦИЯ МОДЕЛЕЙ | 3
OLTP | 3
POWERSHELL | 3
MS EXCEL | 3
HTML | 3
</details></pre>