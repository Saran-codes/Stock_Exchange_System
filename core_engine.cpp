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

// will see if below code is needed or not:
int event_no=1;
int get_event_id(){
    return event_no++;
}
//------------------Below are my custom ds----------------
struct order{
    string mode;
    int order_id;
    int user_id;
    ld price;
};
struct dll_order{
    ld price;
    int order_id;
    int quantity;
    dll_order* next;
    dll_order* prev;
};
struct order_queue{
    int total_quantity=0;
    dll_order* head=nullptr;
    dll_order* tail=nullptr;
    unordered_map<int,dll_order*> order_id_map;
};
struct OrderBookLevel {
    ld price;
    int total_quantity;
};
struct event_received{
    string event_type;// create, place, cancel
    int event_id;
    int order_id;
    int user_id;
    string order_mode;// buy sell
    string order_type;// limit market
    string ticker;//
    ld price;
    int quantity;

    
};
struct event_to_be_sent{
    string event_type;//order_status, order book update
    int event_id;
    int order_id;
    int user_id;
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
//---------------------------------------------------------
// below are essential global variables
queue<event_received> received_queue;
queue<event_to_be_sent> send_queue;
mutex rcvMutex,sendMutex;
condition_variable rcvCV,sendCV;
bool stopProcessing = false;
bool startProcessing = false;
unordered_map<int,int> event_got;

class KafkaCommunicator{
    // This class handles all kafka related things
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
        cout<<"Message Sent: "<<message<<endl;
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

class Stock{
    public:
    ld last_traded_price=1000.0;
    ld best_ask=last_traded_price;
    ld best_bid=last_traded_price;
    map<ld,order_queue> sell_order_book;
    map<ld,order_queue,greater<ld> > buy_order_book;
    unordered_map<int,order> order_details;
    string stock_ticker;

    void send_order_book(vector<OrderBookLevel> &buyorderbook,vector<OrderBookLevel> &sellorderbook){
        int cnt=0;
        for(auto it:buy_order_book){
            ld price=it.first;
            int total_quantity=it.second.total_quantity;
            OrderBookLevel obl={price,total_quantity};
            buyorderbook.push_back(obl);
            cnt++;
            if(cnt==10) break;
        }
        cnt=0;
        for(auto it:sell_order_book){
            ld price=it.first;
            int total_quantity=it.second.total_quantity;
            OrderBookLevel obl={price,total_quantity};
            sellorderbook.push_back(obl);
            cnt++;
            if(cnt==10) break;
        }
        
    }

    event_to_be_sent order_update_event(int order_id,string status,ld executed_price,int executed_quantity){
        int event_id=get_event_id();
        event_to_be_sent es;
        int user_id=order_details[order_id].user_id;
        cout<<"inside order_update_event: "<<user_id<<endl;
        vector<OrderBookLevel> buyorderbook,sellorderbook;
        es={"order_status",event_id,order_id,user_id,stock_ticker,status,executed_quantity,executed_price,buyorderbook,sellorderbook,0,0,0};
        return es;
    }
    event_to_be_sent order_book_update(){
        int event_id=get_event_id();
        event_to_be_sent  es;
        vector<OrderBookLevel> buyorderbook,sellorderbook;
        send_order_book(buyorderbook,sellorderbook);
        es={"order_book_update",event_id,0,0,stock_ticker,"",0,0,buyorderbook,sellorderbook,last_traded_price,best_bid,best_ask};
        return es;
    }

    void update_bests(){
        if(buy_order_book.size()>0){
            best_bid=buy_order_book.begin()->first;
        }
        else{
            best_bid=last_traded_price;
        }
        if(sell_order_book.size()>0){
            best_ask=sell_order_book.begin()->first;
        }
        else{
            best_ask=last_traded_price;
        }
    }
    void display_orderbook(){
        cout<<stock_ticker<<endl;
        cout<<"Sell Order Book:"<<endl;
        int cnt=0;
        for(auto it=sell_order_book.rbegin(); it!=sell_order_book.rend(); ++it){
            cout<<it->first<<" "<<it->second.total_quantity<<endl;
            cnt++;
            if(cnt==15) break;
        }
        cout<<"Buy Order Book: "<<endl;
        cnt=0;
        for(auto it:buy_order_book){
            cout<<it.first<<" "<<it.second.total_quantity<<endl;
        }
    }
    void match(){
        auto buy_it=buy_order_book.begin();
        auto sell_it=sell_order_book.begin();
        order_queue &buy_order_queue=buy_it->second;
        order_queue &sell_order_queue=sell_it->second;
        dll_order* buy_head=buy_order_queue.head;
        dll_order* sell_head=sell_order_queue.head;
        int buy_order_id=buy_head->order_id;
        int sell_order_id=sell_head->order_id;
        ld buy_price=buy_head->price;
        ld sell_price=sell_head->price;
        int buy_quantity=buy_head->quantity;
        int sell_quantity=sell_head->quantity;
        int executed_quantity=min(buy_quantity,sell_quantity);
        buy_head->quantity-=executed_quantity;
        sell_head->quantity-=executed_quantity;
        if(buy_order_id>sell_order_id){
            last_traded_price=sell_price;
        }
        else{
            last_traded_price=buy_price;
        }
        //cout<<"here"<<endl;
        buy_order_queue.total_quantity-=executed_quantity;
        sell_order_queue.total_quantity-=executed_quantity;

        event_to_be_sent es1,es2;


        if(buy_head->quantity==0){
            //here I need to output that order executed 
            es1=order_update_event(buy_order_id,"completed",last_traded_price,executed_quantity);

            buy_order_queue.head=buy_head->next;
            if(buy_order_queue.head!=nullptr){
                buy_order_queue.head->prev=nullptr;
            }
            delete(buy_head);
        }
        else{
            //here I need to output partial order status
            es1=order_update_event(buy_order_id,"partial",last_traded_price,executed_quantity);
        }
        if(sell_head->quantity==0){
            //here I need to output that order executed 
            es2=order_update_event(sell_order_id,"completed",last_traded_price,executed_quantity);

            sell_order_queue.head=sell_head->next;
            if(sell_order_queue.head!=nullptr){
                sell_order_queue.head->prev=nullptr;
            }
            delete(sell_head);
        }
        else{
            //here I need to output partial order status
            es2=order_update_event(sell_order_id,"partial",last_traded_price,executed_quantity);
        }
        if(buy_order_queue.head==nullptr){
            order_details.erase(buy_order_id);
            buy_order_book.erase(buy_it->first);
        }
        if(sell_order_queue.head==nullptr){
            order_details.erase(sell_order_id);
            sell_order_book.erase(sell_it->first);
        }

        //critical section
        {
            lock_guard<mutex> lock(sendMutex);
            send_queue.push(es1);
            send_queue.push(es2);
        }
        sendCV.notify_one();

    }
    void execute(){
        while(1){
            auto sell_it=sell_order_book.begin();
            auto buy_it=buy_order_book.begin();
            int best_bid=-1;
            int best_ask=1e09;
            if(buy_it!=buy_order_book.end()){
                best_bid=buy_it->first;
            }
            if(sell_it!=sell_order_book.end()){
                best_ask=sell_it->first;
            }
            if(best_bid<best_ask) break;
            match();
        }
        update_bests();
        // here order book update must be added
        event_to_be_sent es=order_book_update();
        //critical section
        {
            lock_guard<mutex> lock(sendMutex);
            send_queue.push(es);
        }
        sendCV.notify_one();
    }
    void add_order(string mode,ld price,int quantity,int order_id){
        // should include order grouping
        cout<<"here"<<endl;
        if(mode=="buy"){
            buy_order_book[price];
            buy_order_book[price].total_quantity+=quantity;
            order_queue &dll=buy_order_book[price];
            unordered_map<int,dll_order*> &order_id_map=dll.order_id_map;
            if(dll.head==nullptr){
                dll_order* new_order= new dll_order;
                dll.head=new_order;
                dll.head->price=price;
                dll.head->quantity=quantity;
                dll.head->order_id=order_id;
                dll.head->next=dll.head->prev=nullptr;
                dll.tail=dll.head;
            }
            else{
                dll_order* new_order= new dll_order;
                new_order->price=price;
                new_order->quantity=quantity;
                new_order->order_id=order_id;
                new_order->next=nullptr;
                new_order->prev=dll.tail;
                dll.tail->next=new_order;
                dll.tail=new_order;
            }
            order_id_map[order_id]=dll.tail;
        }
        if(mode=="sell"){
            sell_order_book[price];
            sell_order_book[price].total_quantity+=quantity;
            order_queue &dll=sell_order_book[price];
            unordered_map<int,dll_order*> &order_id_map=dll.order_id_map;
            if(dll.head==nullptr){
                dll_order* new_order= new dll_order;
                dll.head=new_order;
                dll.head->price=price;
                dll.head->quantity=quantity;
                dll.head->order_id=order_id;
                dll.head->next=dll.head->prev=nullptr;
                dll.tail=dll.head;
                
            }
            else{
                dll_order* new_order= new dll_order;
                new_order->price=price;
                new_order->quantity=quantity;
                new_order->order_id=order_id;
                new_order->next=nullptr;
                new_order->prev=dll.tail;
                dll.tail->next=new_order;
                dll.tail=new_order;
            }
            order_id_map[order_id]=dll.tail;
        }
        
        execute();
        display_orderbook();
        
    }
    void cancel_order(string mode,int order_id,ld price){
        if(mode=="buy"){
            if(buy_order_book.find(price)==buy_order_book.end()){
                cout<<"Order does not exist\n";
                return;
            }
            order_queue &dll=buy_order_book[price];
            unordered_map<int,dll_order*> &order_id_map=dll.order_id_map;
            if(order_id_map.find(order_id)==order_id_map.end()){
                cout<<"Order does not exist\n";
                return;
            }
            dll_order* order=order_id_map[order_id];
            dll.total_quantity-=order->quantity;
            if(order->next==nullptr&&order->prev==nullptr){
                dll.head=dll.tail=nullptr;
            }
            else if(order->prev==nullptr){
                dll.head=order->next;
                dll.head->prev=nullptr;

            }
            else if(order->next==nullptr){
                dll.tail=order->prev;
                dll.tail->next=nullptr;

            }
            else{
                dll_order* prev=order->prev;
                dll_order* next=order->next;
                prev->next=next;
                next->prev=prev;
            }
            delete(order);
            order_id_map.erase(order_id);
            if(dll.head==nullptr){
                buy_order_book.erase(price);
            }
        }
        if(mode=="sell"){
            if(sell_order_book.find(price)==sell_order_book.end()){
                cout<<"Order does not exist\n";
                return;
            }
            order_queue &dll=sell_order_book[price];
            unordered_map<int,dll_order*> &order_id_map=dll.order_id_map;
            if(order_id_map.find(order_id)==order_id_map.end()){
                cout<<"Order does not exist\n";
                return;
            }
            dll_order* order=order_id_map[order_id];
            dll.total_quantity-=order->quantity;
            if(order->next==nullptr&&order->prev==nullptr){
                dll.head=dll.tail=nullptr;
            }
            else if(order->prev==nullptr){
                dll.head=order->next;
                dll.head->prev=nullptr;

            }
            else if(order->next==nullptr){
                dll.tail=order->prev;
                dll.tail->next=nullptr;

            }
            else{
                dll_order* prev=order->prev;
                dll_order* next=order->next;
                prev->next=next;
                next->prev=prev;
            }
            delete(order);
            order_id_map.erase(order_id);
            if(dll.head==nullptr){
                sell_order_book.erase(price);
            }
        }
        order_details.erase(order_id);
        update_bests();
    }

};

class Executer{
    public:
    KafkaCommunicator *C;
    map<string,Stock*> Stocks_available;
    Executer(){
        C=new KafkaCommunicator();
    }
    event_received backend_parser(string jsonString){
        json j=json::parse(jsonString);
        string event_type=j["event_type"];
        int event_id=j["event_id"];
        int order_id=j["order_id"];
        int user_id=j["user_id"];
        string order_mode=j["order_mode"];
        string order_type=j["order_type"];
        string ticker=j["ticker"];
        ld price=j["price"];
        int quantity=j["quantity"];

        event_received er={event_type,event_id,order_id,user_id,order_mode,order_type,ticker,price,quantity};
        return er;
    }

    void process_order(event_received er){
        string event_type=er.event_type;
        int user_id=er.user_id;
        cout<<"user_id: "<<user_id<<endl;
        if(event_type=="create"){
            string ticker=er.ticker;
            Stock *S=new Stock();
            S->stock_ticker= ticker;
            Stocks_available[ticker]=S;
        }
        if(event_type=="place"){

            string ticker=er.ticker;
            int order_id=er.order_id;
            string mode=er.order_mode;
            string type=er.order_type;
            ld price=er.price;
            int quantity=er.quantity;
            Stock *S1=Stocks_available[ticker];
            ld order_price;
            if(type=="limit"){
                order o={mode,order_id,user_id,price};
                S1->order_details[order_id]=o;
                S1->add_order(mode,price,quantity,order_id);
            }
            if(type=="market"){
                if(mode=="buy") order_price=S1->best_ask*1.05;
                if(mode=="sell") order_price=S1->best_bid*0.95;
                order o={mode,order_id,user_id,order_price};
                S1->order_details[order_id]=o;
                S1->add_order(mode,order_price,quantity,order_id);
                
            }
        }
        if(event_type=="cancel"){
            string ticker=er.ticker;
            Stock *S1=Stocks_available[ticker];
            int order_id=er.order_id;
            if(S1->order_details.find(order_id)==S1->order_details.end()){
                //cout<<"Order does not exist\n";
                return;
            }
            if(S1->order_details[order_id].mode=="cancelled"){
                //cout<<"Order already cancelled\n";
                return;
            }
            S1->cancel_order(S1->order_details[order_id].mode,order_id,S1->order_details[order_id].price);
            S1->order_details[order_id].mode="cancelled";
        }
    }

    string event_to_be_sent_to_json(event_to_be_sent es) {
        json j;
        j["event_type"]=es.event_type;
        j["user_id"]=es.user_id; 
        j["event_id"]=es.event_id;
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
            json j=json::parse(jsonString);
            
            if(j["event_type"]=="start"){
                cout<<"started"<<endl;
                startProcessing=true;
                continue;
            }
            if(startProcessing==false) continue;
            event_received er=backend_parser(jsonString);
            if(er.event_type == "stop"){
                stopProcessing = true;
                rcvCV.notify_all();
                sendCV.notify_all();
                continue;
            }
            
            
            cout<<"Event added to processor queue ";cout<<er.event_type<<endl;

            int event_id=er.event_id;
            if(event_got[event_id]==1) continue;
            event_got[event_id]=1;

            //critical section:
            {
                lock_guard<mutex> lock(rcvMutex);
                received_queue.push(er);
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
                
                //Process order
            process_order(er);
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
