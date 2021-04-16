<div align="right"><h4>Занятие 6, 7</br>Apache Spark. Домашнее задание</h4></div>

<div align="center"><h2>Собрать статистику по криминогенной обстановке</br> в разных районах Бостона</h2></div>

***

<div align="center"><table border="3">
  <tr>
    <td valign="center">
      <img src="https://user-images.githubusercontent.com/29423304/103760924-e079f380-5026-11eb-983b-633c07cfc054.png" width="100" /></td>
    <td valign="center">
      <img src="https://user-images.githubusercontent.com/29423304/103762236-fe485800-5028-11eb-817e-6cf7cc3c4170.png" width="120"></td>
  </tr>
</table></div>

<pre><details><summary>Описание домашнего задания</summary>
Домашнее задание

Введение в Spark + Гид по безопасному Бостону

Цель: В этом задании предлагается собрать статистику по криминогенной обстановке в разных районах Бостона,
      используя Apache Spark.

Подробную инструкцию по выполнению заданий смотрите в документах по ссылкам:

Гид по безопасному Бостону
https://docs.google.com/document/d/1elWInbWsLrIDqB4FMMgFTUMNEmiYev9HJUfg9LXxydE?usp=sharing
</details></pre>

- скачал датасет [Crimes in Boston](https://www.kaggle.com/AnalyzeBoston/crimes-in-boston/download "Ctrl+click->new tab"), поместил его в каталог `data`
- для работы со `Spark` буду использовать docker-контейнер из образа :link: [almondsh/almond:latest](https://hub.docker.com/r/almondsh/almond "Ctrl+click->new tab")

  - создал файл `docker-compose.yml`
  ```yaml
  version: "3.3"
  services:

    # Almond
    almond:
      image: almondsh/almond:latest
      ports:
        - 8888:8888
        - 4040:4040
      volumes:
        - ./notebooks:/home/jovyan/notebooks
  ```

- запустил контейнер командой `docker-compose up -d`
<pre><details><summary>$ docker logs spark_almond_1</summary>
Executing the command: jupyter notebook
[I 10:30:59.944 NotebookApp] Writing notebook server cookie secret to /home/jovyan/.local/share/jupyter/runtime/notebook_cookie_secret
[I 10:31:00.486 NotebookApp] JupyterLab extension loaded from /opt/conda/lib/python3.8/site-packages/jupyterlab
[I 10:31:00.486 NotebookApp] JupyterLab application directory is /opt/conda/share/jupyter/lab
[I 10:31:00.488 NotebookApp] Serving notebooks from local directory: /home/jovyan
[I 10:31:00.488 NotebookApp] Jupyter Notebook 6.1.4 is running at:
[I 10:31:00.488 NotebookApp] http://b02419477da3:8888/?token=4d46cb0d2818c34855896e462b0c281354cd3e2009187caf
[I 10:31:00.488 NotebookApp]  or http://127.0.0.1:8888/?token=4d46cb0d2818c34855896e462b0c281354cd3e2009187caf
[I 10:31:00.488 NotebookApp] Use Control-C to stop this server and shut down all kernels (twice to skip confirmation).
[C 10:31:00.491 NotebookApp]

    To access the notebook, open this file in a browser:
        file:///home/jovyan/.local/share/jupyter/runtime/nbserver-7-open.html
    Or copy and paste one of these URLs:
        http://b02419477da3:8888/?token=4d46cb0d2818c34855896e462b0c281354cd3e2009187caf
     or http://127.0.0.1:8888/?token=4d46cb0d2818c34855896e462b0c281354cd3e2009187caf
</details></pre>

- перешел по ссылке из лога
`http://127.0.0.1:8888/?token=4d46cb0d2818c34855896e462b0c281354cd3e2009187caf`
- :+1: открылся интерфейс [Jupyter Notebook](https://jupyter.org/ "Ctrl+click->new tab")

- для анализа датасета с применением [Spark SQL](https://spark.apache.org/docs/latest/api/sql/index.html "Ctrl+click->new tab") написал ноутбук boston -> [он здесь](https://github.com/radchenkoam/OTUS-de-2020-11/blob/dev/spark/notebooks/boston.ipynb "Ctrl+click->new tab")
