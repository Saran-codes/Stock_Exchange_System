from confluent_kafka import Producer,Consumer
import json
import time

class KafkaCommunicator:
    def __init__(self,
                 bootstrap_servers='127.0.0.1:9092',
                 topic_to_receive='coreengine_to_backend',
                    topic_to_send='backend_to_coreengine',
                    offset="latest",
                    group_id='python_consumer_group'):
        self.bootstrap_servers = bootstrap_servers
        self.topic_to_receive = topic_to_receive
        self.topic_to_send = topic_to_send
        self.offset = offset
        self.group_id = group_id
        
        self.producer_conf = {'bootstrap.servers': self.bootstrap_servers}
        self.consumer_conf = {'bootstrap.servers': self.bootstrap_servers,
                              'group.id': self.group_id,
                              'auto.offset.reset' : self.offset
                              }
        
        self.producer=Producer(self.producer_conf)
        self.consumer=Consumer(self.consumer_conf)
        self.consumer.subscribe([self.topic_to_receive])
        
    def send_message(self,message):
        while True:
            try:
                self.producer.produce(self.topic_to_send,value=message)
                break
            except BufferError as e:
                print(f"Caught BufferError: {e}")
        print(f"Sent message: {message}")
        
    def receive_message(self):
        message = None
        
        while True:
            msg = self.consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                print("Consumer error: {}".format(msg.error()))
                continue
            else:
                message = msg.value().decode('utf-8')
                break
        print(f"Received message: {message}")
        return message
    
    def close(self):
        self.producer.flush()
        self.consumer.close()
        