#include<bits/stdc++.h>

using namespace std;
int last_traded_price=200;
void clean(map<int,int> &mp){
    vector<int> to_delete;
    for(auto it:mp){
        if(it.second==0){
            to_delete.push_back(it.first);

        }
    }
    for(auto it:to_delete){
        mp.erase(it);
    }
}
void clean(map<int,int,greater<int> > &mp){
    vector<int> to_delete;
    for(auto it:mp){
        if(it.second==0){
            to_delete.push_back(it.first);

        }
    }
    for(auto it:to_delete){
        mp.erase(it);
    }
}
void display(map<int,int> &sell_order_book,map<int,int,greater<int> > &buy_order_book){
    cout<<"SELL:\n";
    for(auto it:sell_order_book){
        cout<<it.first<<" "<<it.second<<"\n";
    }
    cout<<"BUY:\n";
    for(auto it:buy_order_book){
        cout<<it.first<<" "<<it.second<<"\n";
    }
}
void buy_execute(map<int,int> &sell_order_book,map<int,int,greater<int> > &buy_order_book,int price,int qt){
    for(auto &it:sell_order_book){
        int curr_price=it.first;
        int curr_qt=it.second;
        if(curr_price<=price){
            last_traded_price=curr_price;
            if(curr_qt<=qt){
                qt-=curr_qt;
                it.second=0;
            }
            else{
                it.second-=qt;
                qt=0;
             }
        }
        else break;
        if(qt==0) break;
    
    }
    buy_order_book[price]+=qt;
    clean(buy_order_book);
    clean(sell_order_book);
}    

void sell_execute(map<int,int> &sell_order_book,map<int,int,greater<int> > &buy_order_book,int price,int qt){
    for(auto &it:buy_order_book){
        int curr_price=it.first;
        int curr_qt=it.second;
        if(curr_price>=price){
            last_traded_price=curr_price;
            if(curr_qt<=qt){
                qt-=curr_qt;
                it.second=0;
            }
            else{
                it.second-=qt;
                qt=0;
            }
        }
        else break;
        if(qt==0) break;
        }
    
    sell_order_book[price]+=qt;
    clean(buy_order_book);
    clean(sell_order_book);

}

int main(){
    map<int,int> sell_order_book;
    map<int,int,greater<int> > buy_order_book;


    string key;
    while(1){
        cin>>key;
        if(key=="stop") break;
        if(key=="display"){
            display(sell_order_book,buy_order_book);
            continue;
        }
        if(key!="execute"){
            cout<<"Invalid command\n";
            continue;
        }
        int price,qt;
        string tg,order_type;cin>>tg;
       
        cin>>order_type;
        
        

        if(tg=="buy"){
            if(order_type=="limit"){
                cin>>price>>qt;
                buy_execute(sell_order_book,buy_order_book,price,qt);
            }
            else if (order_type=="market"){
                cin>>qt;
                buy_execute(sell_order_book,buy_order_book,last_traded_price*1.05,qt);
            }
            else{
                cout<<"Invalid order type\n";
            }
        }
        else{
            if(order_type=="limit"){
                cin>>price>>qt;
                sell_execute(sell_order_book,buy_order_book,price,qt);
            }
            else if(order_type=="market"){
                cin>>qt;
                sell_execute(sell_order_book,buy_order_book,last_traded_price*0.95,qt);
            }
            else{
                cout<<"Invalid order type\n";
            }
        }
    }
    return 0;
}