#include<bits/stdc++.h>
#include <librdkafka/rdkafkacpp.h> 
#include <nlohmann/json.hpp>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <chrono>

#define ld long double
using json = nlohmann::json;

using namespace std;

struct OrderBookLevel {
    ld price;
    int total_quantity;
};

struct event_received{
    string event_type;// create, place, cancel
    int order_id;
    string order_mode;// buy sell
    string order_type;// limit market
    string ticker;//
    ld price;
    int quantity;

    
};
struct event_to_be_sent{
    string event_type;//order_status, order book update
    int order_id;
    string ticker;
    string order_status;// partial, completed;
    int executed_quantity;
    ld executed_price;
    vector<OrderBookLevel> buy_order_book;
    vector<OrderBookLevel> sell_order_book;
    ld last_traded_price;
    ld best_bid;
    ld best_ask;
};

queue<event_received> received_queue;
queue<event_to_be_sent> send_queue;
mutex rcvMutex,sendMutex;
condition_variable rcvCV,sendCV;
bool stopProcessing = false;

class KafkaCommunicator{
    public:
    string broker = "127.0.0.1:9092";
    string topic_to_send="coreengine_to_backend";
    string topic_to_receive="backend_to_coreengine";
    string group_id="cpp_consumer_group";
    string offset="latest";
    string err;

    RdKafka::Conf *conf_consumer = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    RdKafka::Conf *conf_producer = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    RdKafka::KafkaConsumer *consumer;
    RdKafka::Producer *producer;
    vector<string> topics;

    KafkaCommunicator(){
        conf_consumer->set("metadata.broker.list", broker, err);
        conf_consumer->set("group.id", group_id, err);
        conf_consumer->set("auto.offset.reset",offset,err);
        conf_producer->set("bootstrap.servers", broker, err);

        consumer = RdKafka::KafkaConsumer::create(conf_consumer, err);
        producer = RdKafka::Producer::create(conf_producer, err);

        
        topics.push_back(topic_to_receive);
        consumer->subscribe(topics);
        delete conf_consumer;
        delete conf_producer;
    }
    ~KafkaCommunicator() {
        if (consumer) {
            consumer->close();
            delete consumer;
        }
        if (producer) {
            producer->flush(1000);
            delete producer;
        }
    }

    void send(string message) {
        while (true) {
            RdKafka::ErrorCode resp = producer->produce(
                topic_to_send,                         // Topic name.
                RdKafka::Topic::PARTITION_UA,          // Use default partition.
                RdKafka::Producer::RK_MSG_COPY,        // Copy the payload.
                const_cast<char*>(message.c_str()),    // Message payload.
                message.size(),                        // Message length.
                NULL,                                  // Optional key (NULL here).
                0,                                     // Key length (0 because key is NULL).
                0,                                     // Timestamp (0 if not used).
                NULL                                   // Optional opaque pointer.
            );
            cerr << RdKafka::err2str(resp) << endl;
            if (resp == RdKafka::ERR_NO_ERROR) {
                break; // Successfully sent the message.
            } 
        }
    }

    string receive(){
        string we_got;
        while(true){
            RdKafka::Message *msg=consumer->consume(1000);
            if(msg->err()){
                //cout << "Error: " << msg->errstr() << endl;
                delete msg;
                continue;
            }
            we_got =  static_cast<const char*>(msg->payload());
            cout << "Received message: " << we_got << endl;
            delete msg;
            break;
                       
    
        }
        return we_got;
    }
};

class Executer{
    public:
    KafkaCommunicator *C;
    Executer(){
        C=new KafkaCommunicator();
    }
    event_received backend_parser(string jsonString){
        json j=json::parse(jsonString);
        string event_type=j["event_type"];
        int order_id=j["order_id"];
        string order_mode=j["order_mode"];
        string order_type=j["order_type"];
        string ticker=j["ticker"];
        ld price=j["price"];
        int quantity=j["quantity"];

        event_received er={event_type,order_id,order_mode,order_type,ticker,price,quantity};
        return er;
    }

    event_to_be_sent fake_order_update_event(){
        event_to_be_sent es;
        vector<OrderBookLevel> buyorderbook,sellorderbook;
        es={"order_status",54,"AAPL","partial",30,55.6,buyorderbook,sellorderbook,0,0,0};
        return es;
    }

    event_to_be_sent fake_order_book_update(){
        event_to_be_sent  es;
        OrderBookLevel obl;
        obl.price=120;
        obl.total_quantity=130;
        vector<OrderBookLevel> buyorderbook,sellorderbook;
        buyorderbook.push_back(obl);
        sellorderbook.push_back(obl);
        es={"order_book_update",0,"","",0,0,buyorderbook,sellorderbook,90.0,90.0,92.0};
        return es;
    }

    string event_to_be_sent_to_json(event_to_be_sent es) {
        json j;
        j["event_type"]=es.event_type;
        j["order_id"] = es.order_id;
        j["ticker"] = es.ticker;
        j["order_status"] = es.order_status;
        j["executed_quantity"] = es.executed_quantity;
        j["executed_price"] = es.executed_price;

        vector<json> buy_order_book_json;
        for (const auto& level : es.buy_order_book) {
            json level_json;
            level_json["price"] = level.price;
            level_json["total_quantity"] = level.total_quantity;
            buy_order_book_json.push_back(level_json);
        }
        j["buy_order_book"] = buy_order_book_json;

        vector<json> sell_order_book_json;
        for (const auto& level : es.sell_order_book) {
            json level_json;
            level_json["price"] = level.price;
            level_json["total_quantity"] = level.total_quantity;
            sell_order_book_json.push_back(level_json);
        }
        j["sell_order_book"] = sell_order_book_json;

        j["last_traded_price"] = es.last_traded_price;
        j["best_bid"] = es.best_bid;
        j["best_ask"] = es.best_ask;

        return j.dump();
    }

    void get_from_backend_thread(){
        while(true){
            if(stopProcessing) break;
            string jsonString=C->receive();
            
            event_received er=backend_parser(jsonString);

            //critical section:
            {
                lock_guard<mutex> lock(rcvMutex);
                received_queue.push(er);
            }
            cout<<"Event added to processor queue"<<endl;
            if(er.event_type == "stop"){
              //stopProcessing = true;
               // break;
            }
            rcvCV.notify_one();
            
            
        }
        
    }

    void order_processor_thread(){
        while(true){
                
                unique_lock<mutex> lock(rcvMutex);
                rcvCV.wait(lock, []{ return !received_queue.empty() || stopProcessing; });

                if(received_queue.empty() && stopProcessing) break;

                event_received er=received_queue.front();
                received_queue.pop();

                lock.unlock();

                cout<<"Event being processed: ";
                cout<<er.event_type<<endl;
                this_thread::sleep_for(chrono::milliseconds(300));

                //below is just for testing purpose
                cout<<"Order Received"<<endl;

                //simulate an event generated by core engine , need to be sent to backend
                event_to_be_sent es1=fake_order_update_event();
                event_to_be_sent es2=fake_order_book_update();

                //critical section
                {
                    lock_guard<mutex> lock(sendMutex);
                    send_queue.push(es1);
                    send_queue.push(es2);
                }
                sendCV.notify_one();
            }



        
    }

    void send_to_backend_thread(){
        while(true){
            unique_lock<mutex> lock(sendMutex);
            sendCV.wait(lock, []{ return !send_queue.empty() || stopProcessing; });

            if(send_queue.empty() && stopProcessing) break;

            event_to_be_sent es=send_queue.front();
            send_queue.pop();

            lock.unlock();

            string to_be_sent= event_to_be_sent_to_json(es);
            cout<<"Sending to backend: ";
            cout<<es.event_type<<endl;
            C->send(to_be_sent);


        }
    }
};


int main(){

    Executer executer;

    thread receiverThread(&Executer::get_from_backend_thread,&executer);
    thread processorThread(&Executer::order_processor_thread,&executer);
    thread senderThread(&Executer::send_to_backend_thread,&executer);

    receiverThread.join();
    processorThread.join();
    senderThread.join();

    cout<<"Threads finished"<<endl;

    
    return 0;
}
