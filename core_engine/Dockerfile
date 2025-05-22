FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      g++ \
      librdkafka-dev \
      nlohmann-json3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY src/ ./src


RUN g++ -std=c++17 \
      src/core_engine.cpp \
      -o matching_engine \
      -lrdkafka++ -lrdkafka -pthread

CMD ["./matching_engine", "--config", "config.yaml"]

COPY wait-for-it.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wait-for-it.sh

ENTRYPOINT ["wait-for-it.sh", "kafka:9092", "--", "./build/matching_engine", "--config", "config.yaml"]
