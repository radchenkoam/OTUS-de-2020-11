.DEFAULT_GOAL:=help

DBT_USER :=	$(shell cat ./dbt/.env | sed -n "s/DBT_USER=//p")
DBT_PROFILES_DIR := $(shell cat ./dbt/.env | sed -n "s/DBT_PROFILES_DIR=//p")

.PHONY: conn-reg
conn-reg: ## Register connector
	curl -i -X POST -H "Accept:application/json" -H  "Content-Type:application/json" http://localhost:8083/connectors/ -d @register-postgres-apicurio.json

.PHONY: conn-ls
conn-ls: ## Connectors list
	curl -H "Accept:application/json" localhost:8083/connectors/

.PHONY: conn-del
conn-del: ## Delete connector
	curl -X DELETE http://localhost:8083/connectors/boston-crimes-connector

.PHONY: conn-tasks
conn-tasks: ## Connector tasks
	curl -i -X GET -H "Accept:application/json" localhost:8083/connectors/boston-crimes-connector

.PHONY: dbt-dev
dbt-dev: ## Running a DBT docker-container for dev
	docker run --rm -it radchenkoam/dbt-postgresql:latest bash

.PHONY: dbt-build
dbt-build: ## Building a DBT docker-container
	docker build --no-cache -t radchenkoam/dbt-postgresql \
		--network dbt-net \
	  --build-arg DBT_USER=$(DBT_USER) \
	  --build-arg DBT_PROFILES_DIR=$(DBT_PROFILES_DIR) ./dbt

.PHONY: dbt-start
dbt-start: ## Running a DBT docker-container
	docker run --name dbt-postgresql --rm -it \
		--network dbt-net \
		--entrypoint /bin/bash \
		-v $(shell pwd)/dbt/crimes_in_boston:$(DBT_PROFILES_DIR) \
	  -t radchenkoam/dbt-postgresql:latest

.PHONY: dbt-version
dbt-version: ## Show DBT version in docker-container
	docker run --rm -it radchenkoam/dbt-postgresql:latest dbt --version

.PHONY: dbt-postgresql-remove
dbt-postgresql-remove: ## Stop docker-containers, remove image
	docker stop dbt-postgresql
	docker rmi radchenkoam/dbt-postgresql

dbt-args:
	@echo DBT_USER=$(DBT_USER)
	@echo DBT_PROFILES_DIR=$(DBT_PROFILES_DIR)


groups-list:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-consumer-groups.sh --bootstrap-server kafka:9092 --list

groups-status:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-consumer-groups.sh \
		--bootstrap-server kafka:9092 --all-groups --describe

topics-list:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-topics.sh --list \
		--zookeeper zookeeper:2181

crime-all:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-console-consumer.sh \
    --bootstrap-server kafka:9092 \
    --from-beginning \
    --topic dbserver1.boston_crimes.dbt.crime

crime-last:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-console-consumer.sh \
    --bootstrap-server kafka:9092 \
		--partition 0 \
		--offset latest 1 \
    --topic dbserver1.boston_crimes.dbt.crime

crime-key-all:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-console-consumer.sh \
    --bootstrap-server kafka:9092 \
    --from-beginning \
    --property print.key=true \
		--property print.value=false \
    --topic dbserver1.boston_crimes.dbt.crime

crime-key-last:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-console-consumer.sh \
    --bootstrap-server kafka:9092 \
		--partition 0 \
		--offset latest 1 \
    --property print.key=true \
		--property print.value=false \
    --topic dbserver1.boston_crimes.dbt.crime

crime-key-all-avro:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-avro-console-consumer.sh \
    --bootstrap-server kafka:9092 \
    --from-beginning \
    --property print.key=true \
		--property print.value=false \
    --topic dbserver1.boston_crimes.dbt.crime

crime-key-last-avro:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-avro-console-consumer.sh \
    --bootstrap-server kafka:9092 \
		--partition 0 \
		--offset latest 1 \
    --property print.key=true \
		--property print.value=false \
    --topic dbserver1.boston_crimes.dbt.crime

errors-all:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-console-consumer.sh \
    --bootstrap-server kafka:9092 \
    --from-beginning \
    --topic errors

errors-last:
	docker-compose -f docker-compose.yml exec kafka /kafka/bin/kafka-console-consumer.sh \
		--bootstrap-server kafka:9092 \
		--partition 0 \
		--offset latest 1 \
		--topic errors


.PHONY: help
help: ## Show this help message.
	@echo 'postgresql version dbt'
	@echo
	@echo 'usage: make [target]'
	@echo
	@echo 'targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo
