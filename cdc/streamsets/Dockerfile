FROM streamsets/datacollector:3.21.0

ARG SDC_LIBS
RUN "${SDC_DIST}/bin/streamsets" stagelibs -install="${SDC_LIBS}"
