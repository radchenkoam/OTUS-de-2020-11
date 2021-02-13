<div align="right"><h4>Занятие 15</br>Инструменты выгрузки данных из сторонних систем</br>
Домашнее задание</h4></div>

<div align="center"><h2>Настроить захват изменений из Postgres (CDC)</h2></div>

***
<h3><div align="center">1. Предыстория</div></h3>

***

<div align="right"><a href="https://github.com/Gorini4/debezium_cdc/">Описание домашнего задания</a></div>  


- из конфига оригинального репозитория выполнить задание мне не удалось, поэтому я решил его немного переделать
- заодно захотел разобраться с отправкой-получением сообщений в формате `avro`, у которого, согласно документации, есть некоторые преимущества по сравнению с форматом `json`
- я выбрал первый вариант согласно документации `Debezium`, в котором разворачивается отдельный контейнер для регистрации и работой со схемами `avro` - [APICURIO Registry](https://debezium.io/documentation/reference/1.4/configuration/avro.html#about-the-registry "Ctrl+click -> new tab")


***
<h3><div align="center">2. Настройка рабочего окружения</div></h3>

***

:link: Новая конфигурация развертывания сервисов: <https://github.com/radchenkoam/debezium_pg_cdc>

- подготовил контейнеры тестового стека на локальном компьютере:
``` bash
$ git clone git@github.com:radchenkoam/debezium_pg_cdc.git
$ cd debezium_pg_cdc
$ mkdir -pv ./streamsets/sdc-data
$ sudo chmod -R 777 ./streamsets/sdc-data
$ docker-compose -f docker-compose-apicurio.yml pull
$ docker-compose -f docker-compose-apicurio.yml build
$ docker-compose -f docker-compose-apicurio.yml up
$ make register-postgres-apicurio
```
- проверил: :+1:
``` bash
$ docker container ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
NAMES                          STATUS                   PORTS
debezium_pg_cdc_generator_1    Up 9 minutes             
debezium_pg_cdc_connect_1      Up 9 minutes             8778/tcp, 9092/tcp, 0.0.0.0:8083->8083/tcp, 9779/tcp
debezium_pg_cdc_kafka_1        Up 9 minutes             8778/tcp, 9779/tcp, 0.0.0.0:9092->9092/tcp
debezium_pg_cdc_apicurio_1     Up 9 minutes             8778/tcp, 0.0.0.0:8080->8080/tcp, 9779/tcp
debezium_pg_cdc_zookeeper_1    Up 9 minutes             0.0.0.0:2181->2181/tcp, 0.0.0.0:2888->2888/tcp, 8778/tcp, 0.0.0.0:3888->3888/tcp, 9779/tcp
debezium_pg_cdc_streamsets_1   Up 9 minutes             0.0.0.0:18630->18630/tcp
debezium_pg_cdc_namenode_1     Up 9 minutes (healthy)   0.0.0.0:9000->9000/tcp, 0.0.0.0:9870->9870/tcp
debezium_pg_cdc_postgres_1     Up 9 minutes             0.0.0.0:5432->5432/tcp
debezium_pg_cdc_datanode_1     Up 9 minutes (healthy)   9864/tcp
```

***
<h3><div align="center">3. Пайплайн StreamSets</div></h3>

***
<div align="center"><img src="https://user-images.githubusercontent.com/29423304/107863016-008ca600-6e62-11eb-89c7-49c6c085a35b.png" /></div>


- зашел в веб-интерфейс `StreamSets` - `localhost:18630` (я переписал разворачивание проекта с использованием новых версий сервисов, а новая версия `StreamSets` требует аутентификации с зарегистрированной учетной записью, при первом входе необходимо создать учетную запись, и в дальнейшем пользоваться ей)
- нажал `Create New Pipeline`, назвал пайплайн `pgcdc`, указал тип `Data Collector Pipeline`
- выбрал **`Origin`** (Источник) -> `Kafka Multitopic Consumer`, настроил:
    | Раздел | Вкладка | Свойство | Значение |
    |---------------|---------------|--------------:|---------------|
    | Configuration | General | **Name** | `inventory.customers cdc consumer` |
    | Configuration | General | **Stage Library** | `CDH 6.3.0` |
    | Configuration | Connection | **Broker URI** | `kafka:9092` |
    | Configuration | Connection | **Topic List** | `dbserver1.inventory.customers` |
    | Configuration | Data Format | **Data Format** | `Avro` |
    | Configuration | Data Format | **Avro Schema Location** | `Confluent Schema Registry` |
    | Configuration | Data Format | **Schema Registry URLs** | `http://apicurio:8080/api/ccompat` |
    | Configuration | Data Format | **Lookup Schema By** | `Subject` |
    | Configuration | Data Format | **Schema Subject** | `dbserver1.inventory.customers-value` |

    скриншоты:
    <pre><details><summary>Configuration.General</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107861533-66276500-6e57-11eb-9cf2-63e014178265.png" />
    </details></pre>
    <pre><details><summary>Configuration.Connection</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107861554-97a03080-6e57-11eb-9475-775cad6fd80a.png" />
    </details></pre>
    <pre><details><summary>Configuration.Data Format</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107861570-bc94a380-6e57-11eb-937e-d9d95cb70c82.png" />
    </details></pre>

- выбрал в качестве **`Destination`** (Назначение) -> `Hadoop FS`, настроил:
    | Раздел | Вкладка | Свойство | Значение |
    |---------------|---------------|--------------:|---------------|
    | Configuration | General | **Name** | `write to hdfs` |
    | Configuration | Connection | **File System URI** | `hdfs://namenode:9000` |
    | Configuration | Output Files | **Directory Template** | `/tmp/customers_cdc/${YYYY()}-${MM()}-${DD()}-${hh()}` |
    | Configuration | Data Format | **Data Format** | `Avro` |
    | Configuration | Data Format | **Avro Schema Location** | `Confluent Schema Registry` |
    | Configuration | Data Format | **Schema Registry URLs** | `http://apicurio:8080/api/ccompat` |
    | Configuration | Data Format | **Lookup Schema By** | `Subject` |
    | Configuration | Data Format | **Schema Subject** | `dbserver1.inventory.customers-value` |

    скриншоты:
    <pre><details><summary>Configuration.General</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107862573-87d81a80-6e5e-11eb-8940-8fbfbfe14d4b.png" />
    </details></pre>
    <pre><details><summary>Configuration.Connection</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107862582-a3dbbc00-6e5e-11eb-8f2e-d8cca98e6716.png" />
    </details></pre>
    <pre><details><summary>Configuration.Output Files</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107862603-d5ed1e00-6e5e-11eb-9524-9d701ec031ce.png" />
    </details></pre>
    <pre><details><summary>Configuration.Data Format</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107862617-f1f0bf80-6e5e-11eb-8871-cd9aab2089ed.png" />
    </details></pre>

- по условию ДЗ для обогащения выходного сообщения между **`Источником`** и **`Назначением`** добавил `Expression Evaluator`, настроил:
    | Раздел | Вкладка | Свойство | Значение |
    |---------------|---------------|--------------:|---------------|
    | Configuration | General | **Name** | `add is_defeted flag & act field` |
    | Configuration | Expressions | **Field Expressions** | **Output Field** `/is_deleted`</br>**Field Expression**: `${record:value('/op')=='d'?true:false}` |
    | Configuration | Expressions | **Field Expressions** | **Output Field** `/act`</br>**Field Expression**: `${record:value('/op')=='d'?'D':(record:value('/op')=='u'?'U':'I')}` |

    скриншоты:
    <pre><details><summary>Configuration.General</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107862907-367d5a80-6e61-11eb-9fbe-cfbbd9e8d24c.png" />
    </details></pre>
    <pre><details><summary>Configuration.Expressions</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107862927-57de4680-6e61-11eb-9c95-3cbce228b0ea.png" />
    </details></pre>

- запустил `Preview` с установленной опцией `Show Record/Field Header` для проверки работы пайплайна, всё выполнилось без ошибок :+1:
- на предпросмотре шага `write to hdfs` в разделе `Input Data` видно, что предыдущий шаг с обогащением сообщения отработал правильно, поле `is_deleted` и `act` присутствуют в выводе и корректно определяются их значения:

    скриншоты:
    <pre><details><summary>Prewiew Stage: write to hdfs.Input Data</summary>
    <img src="https://user-images.githubusercontent.com/29423304/107863576-9296ad80-6e66-11eb-9384-2989a44b28f5.png" />
    <img src="https://user-images.githubusercontent.com/29423304/107863604-bb1ea780-6e66-11eb-895a-f1110b51d726.png" />
    <img src="https://user-images.githubusercontent.com/29423304/107863654-0d5fc880-6e67-11eb-8bf7-bc5f0dc57fe4.png" />
    </details></pre>

***
<h3><div align="center">4. Итог</div></h3>

***

- запустил пайплайн нажатием кнопки `Start`, всё работает нормально :+1:
![image](https://user-images.githubusercontent.com/29423304/107863822-3c2a6e80-6e68-11eb-95b2-a6335b1f5424.png)

- для проверки записи файлов, зашел в веб-интерфейс `Hadoop` -> `http://localhost:9870/` -> `Utilities` -> `Browse the file system`, файл на указанном месте, всё хорошо :+1:
![image](https://user-images.githubusercontent.com/29423304/107863986-4a2cbf00-6e69-11eb-8a79-a10fdf8c9638.png)
