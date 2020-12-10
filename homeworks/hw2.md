<div align="right"><h4>Занятие 3</br>Облачные платформы. Дистрибутивы Cloudera и Hortonworks</br>
Домашнее задание</h4></div>

<div align="center"><h2>Развернуть дистрибутив Cloudera</h2></div>

***
<h3><div align="center">1. Настройка рабочего окружения</div></h3>

***

<p align="right"><img src="https://user-images.githubusercontent.com/29423304/101603876-3d2ac400-3a11-11eb-936c-7bb069c47f89.png" /></p>
<h4><div align="center">Виртуальная машина в Google Cloud Platform</div></h4>

- в проекте **DE-2020-11** создал [виртуальную машину](https://console.cloud.google.com/compute/instances?project=de-2020-11&instancessize=50 "Ctrl+click->new tab") `cdh-cloudera2` командами **gcloud**
    <pre><details><summary>создание виртуальной машины</summary>
    $ gcloud beta compute --project=de-2020-11 instances create cdh \
       --zone=us-central1-a \
       --machine-type=n1-standard-4 \
       --subnet=default --network-tier=PREMIUM \
       --maintenance-policy=MIGRATE \
       --service-account=313591580200-compute@developer.gserviceaccount.com \
       --scopes=https://www.googleapis.com/auth/cloud-platform \
       --tags=http-server,https-server \
       --image=ubuntu-1804-bionic-v20201201 \
       --image-project=ubuntu-os-cloud \
       --boot-disk-size=30GB \
       --boot-disk-type=pd-standard \
       --boot-disk-device-name=cdh-cloudera2 \
       --no-shielded-secure-boot \
       --shielded-vtpm \
       --shielded-integrity-monitoring \
       --reservation-affinity=any
    </details></pre>

    <pre><details><summary>создание правил брандмауэра для трафика http, https</summary>
    $ gcloud compute --project=de-2020-11 firewall-rules create default-allow-http \
       --direction=INGRESS \
	   --priority=1000 \
	   --network=default \
	   --action=ALLOW \
	   --rules=tcp:80 \
	   --source-ranges=0.0.0.0/0 \
	   --target-tags=http-server

    $ gcloud compute --project=de-2020-11 firewall-rules create default-allow-https \
	   --direction=INGRESS \
	   --priority=1000 \
	   --network=default \
	   --action=ALLOW \
	   --rules=tcp:443 \
	   --source-ranges=0.0.0.0/0 \
	   --target-tags=https-server
    </details></pre>

- зашел через `ssh`, установил [Docker](https://docs.docker.com/engine/install/ubuntu/ "Ctrl+click->new tab") с помощью скрипта установки
    ```bash
    $ curl -fsSL https://get.docker.com -o get-docker.sh
    $ sudo sh get-docker.sh
    ```
***
<p align="right"><img src="https://user-images.githubusercontent.com/29423304/101666531-62deba00-3a5f-11eb-960a-cabf24b60015.png" /></p>
<h4><div align="center">Cloudera Quickstart VM</div></h4>

***

- скачал, распаковал, импортировал докер-образ [Cloudera Quickstart VM](https://docs.cloudera.com/documentation/enterprise/5-14-x/topics/cloudera_quickstart_vm.html "Ctrl+click->new tab")
    ```bash
    $ sudo wget https://downloads.cloudera.com/demo_vm/docker/cloudera-quickstart-vm-5.13.0-0-beta-docker.tar.gz
    $ tar xzf cloudera-quickstart-vm-*-docker.tar.gz
    $ rm -f cloudera-quickstart-vm-5.13.0-0-beta-docker.tar.gz
    $ sudo docker import cloudera-quickstart-vm-5.13.0-0-beta-docker/cloudera-quickstart-vm-5.13.0-0-beta-docker.tar cloudera-quickstart:latest
    ```
- проверил, образ загружен :+1: 
    ```bash
    $ sudo docker images
    REPOSITORY            TAG       IMAGE ID       CREATED          SIZE
    cloudera-quickstart   latest    19db21962945   48 seconds ago   7GB
    ```
- :+1: запустил контейнер
    ```bash
    $ sudo docker run --hostname=quickstart.cloudera --privileged=true -t -i -p 8888:8888 -p 7180:7180 -p 80:80 cloudera-quickstart:latest /usr/bin/docker-quickstart
    ```
- после появления командной строки контейнера запустил [Cloudera Manager](https://docs.cloudera.com/documentation/enterprise/5-14-x/topics/cloudera_manager.html "Ctrl+click->new tab")
    ```bash
    [root@quickstart /]# /home/cloudera/cloudera-manager --express --force
    ...
    [QuickStart] Enabling Cloudera Manager daemons on boot...
    ________________________________________________________________________________
    
    Success! You can now log into Cloudera Manager from the QuickStart VM's browser:
    
        http://quickstart.cloudera:7180
    
        Username: cloudera
        Password: cloudera
    ```
- создал правило брандмауэра, разрешающее доступ к виртуальной машине по внешнему IP-адресу
    ```bash
    $ gcloud compute --project=de-2020-11 firewall-rules create cdh \
       --direction=INGRESS \
       --priority=1000 \
       --network=default \
       --action=ALLOW \
       --rules=all \
       --source-ranges=0.0.0.0/0
    ```
***
<p align="right"><img src="https://user-images.githubusercontent.com/29423304/101672413-e2bc5280-3a66-11eb-85da-66546bb79f76.png" /></p>
<h4><div align="center">Cloudera Manager</div></h4>

***
- зашел через браузер на веб-интерфейс _Cloudera Manager_ указав вместо имени `quickstart.cloudera:7180` внешний IP-адрес `34.69.59.252:7180`, залогинился `cloudera-cloudera`
- переименовал кластер `cdh` и запустил через меню вручную :+1: 
![image](https://user-images.githubusercontent.com/29423304/101833941-b974f280-3b4a-11eb-80b1-41840bbc9199.png)

- через _HUE_ загрузил [файл](https://storage.googleapis.com/otus_sample_data/athlete.snappy.parquet "Ctrl+click->new tab") в папку `/user/cloudera/athlete`
- в HIVE создал внешнюю таблицу
```sql
CREATE EXTERNAL TABLE athlete (
    ID INT,
    Name STRING,
    Sex STRING,
    Age INT,
    Height INT,
    Weight INT,
    Team STRING,
    NOC STRING,
    Games STRING,
    `Year` INT,
    Season STRING,
    City STRING,
    Sport STRING,
    Event STRING,
    Medal STRING 
)
STORED AS PARQUET
LOCATION '/user/cloudera/athlete'
```
- выполнил запрос `SELECT * FROM athlete;`
![image](https://user-images.githubusercontent.com/29423304/101834708-c0e8cb80-3b4b-11eb-9de2-bd884f7f10e0.png)

