.PHONY: start
start: ## Running a datascience-notebook docker-container
	docker run --rm --name pyspark-notebook -d -p 8888:8888 -e JUPYTER_ENABLE_LAB=yes \
		-v $(shell pwd)/workspace:/home/jovyan/work jupyter/pyspark-notebook:latest
