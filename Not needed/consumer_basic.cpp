#include<bits/stdc++.h>
#include <librdkafka/rdkafkacpp.h> 

using namespace std;

int main(){
    string broker = "127.0.0.1:9092";
    string topic="backend_to_coreengine";
    string group_id="cpp_consumer_group";

    string err;

    RdKafka::Conf *conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    conf->set("metadata.broker.list", broker, err);
    conf->set("group.id", group_id, err);


    RdKafka::KafkaConsumer *consumer = RdKafka::KafkaConsumer::create(conf, err);

    delete conf;

    vector<string> topics;
    topics.push_back(topic);
    consumer->subscribe(topics);


    while(true){
        RdKafka::Message *msg=consumer->consume(1000);
        if(msg->err()){
            //cout << "Error: " << msg->errstr() << endl;
            delete msg;
            continue;
        }
        string we_got =  static_cast<const char*>(msg->payload());
        cout << "Received message: " << we_got << endl;
        delete msg;
        if(we_got=="stop") break;
                   

    }
    consumer->close();
    delete consumer;
    RdKafka::wait_destroyed(5000);  // Wait up to 5000ms for cleanup.
    return 0;
}
