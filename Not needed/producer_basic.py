from confluent_kafka import Producer
import sys

conf = {'bootstrap.servers': '127.0.0.1:9092'}


producer = Producer(conf)
while True:
    print('Enter the message to send')
    message = input()
    producer.produce('test_topic',key='python',value=message)
    producer.flush()  
    if message=="stop" :
        break




