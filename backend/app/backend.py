from kafkautils.Communication import KafkaCommunicator
from fastapi import BackgroundTasks, FastAPI, HTTPException, WebSocket
import asyncio
from pydantic import BaseModel
import json
import time
import uvicorn
from typing import List
from sqlalchemy.orm import Session
import datetime
from backend.sql_script import User, Stock, OrderStatus,OrderDetails,Portfolio,SessionLocal
from contextlib import asynccontextmanager
import bcrypt
import jwt
from fastapi.middleware.cors import CORSMiddleware




comm = KafkaCommunicator()

SECRET_KEY= "Heycatty"
processor_queue=asyncio.Queue()
connected_clients = set()
event_id_we_got = {}

event_no=1
order_no=1

def get_event_id() -> int:
    global event_no
    to_ret=event_no
    event_no+=1
    return to_ret

def get_order_id() -> int:
    global order_no
    to_ret=order_no
    order_no+=1
    return to_ret
#lifespan management
@asynccontextmanager
async def lifespan(app):
    k={"event_type":"start"}
    message=json.dumps(k)
    print(message)
    comm.send_message(message)
    KafkaTask     =asyncio.create_task(MonitorKafka())
    ProcessorTask =asyncio.create_task(ProcessQueue())
    
    yield
    
    await processor_queue.join()
    comm.close()
    print("Shutdown successful")

app = FastAPI(lifespan=lifespan) 


origins = [
    "http://localhost:5173",
    "http://192.168.53.121:5173",
    "http://192.168.29.102:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # explicit list-no "*"
    allow_credentials=True,       # now safe to use
    allow_methods=["*"],
    allow_headers=["*"]
)

class OrderBookLevel(BaseModel):
    price: float
    total_quantity: int

class KafkaEvent(BaseModel):
    event_type: str # two types of events: notification, order book update
    event_id:int
    order_id:int
    user_id:int
    ticker:str
    order_status:str
    executed_quantity:int
    executed_price:float
    buy_order_book: List[OrderBookLevel] = []
    sell_order_book: List[OrderBookLevel] = []
    last_traded_price: float
    best_bid: float
    best_ask: float



#background process that continuously receives messages from Kafka
def to_sent_through_websocket(event) -> str:
    j={}
    if event.event_type == 'order_status':
        j['event_type'] = 'notification'
        j['user_id']=event.user_id
        j['order_id']=event.order_id
        j['ticker']=event.ticker
        j['order_status']=event.order_status
        j['executed_quantity']=event.executed_quantity
        j['executed_price']=event.executed_price
    if event.event_type == 'order_book_update':
        j['event_type'] = 'order_book_update'
        j['ticker']=event.ticker
        j['last_traded_price']=event.last_traded_price
        j['best_bid']=event.best_bid
        j['best_ask']=event.best_ask
        j['buy_order_book'] = [level.dict() for level in event.buy_order_book]
        j['sell_order_book'] = [level.dict() for level in event.sell_order_book]
    return json.dumps(j)
    

async def MonitorKafka():
    while True:
        message = await asyncio.get_event_loop().run_in_executor(None, comm.receive_message)
        event =  KafkaEvent.model_validate_json(message)
        if event.event_id not in event_id_we_got:
            event_id_we_got[event.event_id] = True
        else:
            continue
        to_be_sent = to_sent_through_websocket(event)
        await processor_queue.put(event)
        for ws in connected_clients:
            await ws.send_text(to_be_sent)
        await asyncio.sleep(0.001)
        

#background process that processes queue
def CRUDonDB(event: KafkaEvent):
    session: Session=SessionLocal()
    try:
        if event.event_type=="order_status":
            #setting current status in OrderStatus
            record=session.query(OrderStatus).filter(OrderStatus.order_id==event.order_id).first()
            record.status=event.order_status
            
            #set executed quantity in order details
            record=session.query(OrderDetails).filter(OrderDetails.order_id==event.order_id).first()
            order_mode=record.order_mode
            record.executed_quantity+=event.executed_quantity
            record.left_quantity=record.quantity-record.executed_quantity
            
            #set in portfolio
            record = session.query(Portfolio).filter(Portfolio.user_id == event.user_id, Portfolio.ticker == event.ticker).first()
            if record:
                
                if(order_mode=="buy"):
                    record.quantity=record.quantity+event.executed_quantity
                elif(order_mode=="sell"):
                    record.quantity=record.quantity-event.executed_quantity
            else:
                
                new_record = Portfolio(
                    user_id=event.user_id,
                    ticker=event.ticker,
                    quantity=0
                )
                if(order_mode=="buy"):
                    new_record.quantity=(event.executed_quantity)
                elif(order_mode=="sell"):
                    new_record.quantity=(-event.executed_quantity)
                session.add(new_record)
                
                
        elif event.event_type=="order_book_update":
            
            record=session.query(Stock).filter(Stock.ticker==event.ticker).first()
            record.last_traded_price= event.last_traded_price
            record.best_bid=event.best_bid
            record.best_ask=event.best_ask
            record.buy_order_book=json.dumps([lvl.model_dump() for lvl in event.buy_order_book])
            record.sell_order_book=json.dumps([lvl.model_dump() for lvl in event.sell_order_book])
            
    
        session.commit()
        print("CRUD operation successful for event_id:", event.event_id)
    except Exception as e:
        session.rollback()
        print("Error in CRUDonDB at event: ",event.event_id," follwing error: ",e)
    finally:
        session.close()
    
    

async def ProcessQueue():
    while True:
        event = await processor_queue.get()
        await asyncio.get_event_loop().run_in_executor(None, CRUDonDB, event)
        processor_queue.task_done()
        await asyncio.sleep(0.001)
        
#------------------------------Rest API -----------------------------------------------
#registering user:
class RegisterInfo(BaseModel):
    email_address : str
    password : str

@app.post("/register") # we return 
async def register_user(registerobj: RegisterInfo):
    # add error handling here
     session: Session=SessionLocal()
     print(registerobj.email_address)
     record=session.query(User).filter(User.email==registerobj.email_address).first()
     if record:
         return {"status":"Already registered with this mail"}
     hash = bcrypt.hashpw(registerobj.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
     new_record=User(email=registerobj.email_address,
                     password_hash=hash)
     session.add(new_record)
     session.commit()
     session.close()
     
     return {"status" : "Successfully Registered"}

#login :
class LoginInfo(BaseModel):
    email_address : str
    password : str

@app.post("/login")
async def login_user(loginobj: LoginInfo):
    session: Session=SessionLocal()
    record=session.query(User).filter(User.email==loginobj.email_address).first()
    if record:

        if bcrypt.checkpw(loginobj.password.encode('utf-8'), record.password_hash.encode('utf-8')):
            token_data = {"user_id": record.user_id, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)}
            token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
            return {"status" : "login successfull","user_id":record.user_id,"access_token":token,"token_type":"bearer"}
        else:
            return {"status" : "wrong password"}
    else:
        print("here",loginobj.email_address)
        return {"status" : "user not registered"}
    

#place order:
class OrderInfo(BaseModel):
    token : str
    user_id : int
    ticker : str
    order_mode : str
    order_type : str
    price : float
    quantity : int

class event_to_kafka(BaseModel):
    event_type :str =""
    event_id : int =0
    order_id : int =0
    user_id  : int =0
    order_mode : str =""
    order_type : str =""
    ticker : str = ""
    price : float  =0
    quantity : int =0

def update_order_in_db(OrderEvent : event_to_kafka):
    session : Session = SessionLocal()
    new_order = OrderDetails(
        order_id=OrderEvent.order_id,
        ticker = OrderEvent.ticker,
        order_mode=OrderEvent.order_mode,
        order_type=OrderEvent.order_type,
        price = OrderEvent.price,
        quantity=OrderEvent.quantity,
        left_quantity=OrderEvent.quantity
    )
    session.add(new_order)
    new_status = OrderStatus(
        user_id = OrderEvent.user_id,
        order_id = OrderEvent.order_id,
    )
    session.add(new_status)
    session.commit()
    session.close()
    
    

@app.post("/place_order")
async def place_order(orderobj : OrderInfo,background_tasks: BackgroundTasks):
    
    print("here",orderobj)
    try:
        payload = jwt.decode(orderobj.token, SECRET_KEY, algorithms=["HS256"])
        if(payload["user_id"]!=orderobj.user_id):
            return {"status" : "Access Denied, wrong user"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    event_id=get_event_id()
    order_id=get_order_id()
    
    event = event_to_kafka()
    event.event_type = "place"
    event.event_id = event_id
    event.order_id = order_id
    event.user_id = orderobj.user_id
    event.order_mode = orderobj.order_mode
    event.order_type=orderobj.order_type
    event.ticker = orderobj.ticker 
    event.price = orderobj.price
    event.quantity = orderobj.quantity
    
    message=json.dumps(event.model_dump())
    
    comm.send_message(message)
    
    background_tasks.add_task(update_order_in_db,event)
    
    return {"status" : "placed", "order_id" : order_id}
    
    
#cancel_order
class CancelInfo(BaseModel):
    token : str
    user_id : int
    order_id : int
    
def cancel_order_in_db(OrderEvent : event_to_kafka):
    order_id=OrderEvent.order_id
    session : Session = SessionLocal()
    record = session.query(OrderStatus).filter(OrderStatus.order_id==order_id).first()
    if record:
        record.status = "cancellation placed"
    session.commit()
    session.close()
    
    
@app.post("/cancel_order")
async def cancel_order(cancelobj : CancelInfo,background_tasks: BackgroundTasks):
    try:
        payload = jwt.decode(cancelobj.token, SECRET_KEY, algorithms=["HS256"])
        if(payload["user_id"]!=cancelobj.user_id):
            return {"status" : "Access Denied, wrong user"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    event = event_to_kafka()
    event_id = get_event_id()
    event.event_type="cancel"
    event.user_id=cancelobj.user_id
    event.order_id=cancelobj.order_id
    event.ticker=SessionLocal().query(OrderDetails).filter(OrderDetails.order_id==cancelobj.order_id).first().ticker
    event.event_id = event_id
    
    
    message=json.dumps(event.model_dump())
    comm.send_message(message)
    
    background_tasks.add_task(cancel_order_in_db,event)
    
    return {"status" : "cancellation place"}


#create ticker
class TickerInfo(BaseModel):
    token :str
    user_id : int 
    ticker : str 
    stock_name : str
    
@app.post("/create_ticker")
async def create_ticker(tickerobj : TickerInfo):
    try:
        payload = jwt.decode(tickerobj.token, SECRET_KEY, algorithms=["HS256"])
        if(payload["user_id"]!=tickerobj.user_id):
            return {"status" : "Access Denied, wrong user"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    event = event_to_kafka()
    event_id  = get_event_id()
    
    event.event_type = "create"
    event.ticker = tickerobj.ticker
    event.event_id = event_id
    event.user_id = tickerobj.user_id
    
    message=json.dumps(event.model_dump())
    comm.send_message(message)
    
    session : Session = SessionLocal()
    new_stock = Stock(
        ticker = event.ticker,
        stock_name = tickerobj.stock_name
    )
    session.add(new_stock)
    session.commit()
    session.close()
    
    return {"status" : "created ticker","ticker":tickerobj.ticker}

#get ticker_data
@app.get("/ticker_data")
async def send_ticker_data():
    session: Session = SessionLocal()
    stocks = session.query(Stock).all()
    result = []
    for stock in stocks:
        stock_data={
            "ticker" : stock.ticker,
            "stock_name" : stock.stock_name,
            "last_traded_price" : stock.last_traded_price,
            "best_bid" : stock.best_bid,
            "best_ask" : stock.best_ask,
        }
        result.append(stock_data)
    session.close()
    return result

#get order_book
@app.get("/get_order_book/{ticker}")
async def send_order_book(ticker : str):
    session: Session = SessionLocal()
    stock = session.query(Stock).filter(Stock.ticker==ticker).first()
    
    try:
        buy_order_book = json.loads(stock.buy_order_book) if stock.buy_order_book else []
    except Exception as e:
        buy_order_book = []
        print("Error parsing buy_order_book:", e)
            
    try:
        sell_order_book = json.loads(stock.sell_order_book) if stock.sell_order_book else []
    except Exception as e:
        sell_order_book = []
        print("Error parsing sell_order_book:", e)
        
    response={
        "buy_order_book" : buy_order_book,
        "sell_order_book" : sell_order_book
    }
    session.close()
    return response

#get order_history
class SecureInfo(BaseModel):
    token : str
    user_id : int 

@app.post("/get_order_history")
async def send_order_history(secureobj : SecureInfo):
    try:
        payload = jwt.decode(secureobj.token, SECRET_KEY, algorithms=["HS256"])
        if(payload["user_id"]!=secureobj.user_id):
            return {"status" : "Access Denied, wrong user"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    
    session : Session = SessionLocal()
    orders = session.query(OrderStatus).filter(OrderStatus.user_id==secureobj.user_id).all()
    response = []
    
    for order in orders:
        to_add={
            "order_id" : order.order_id,
            "status" : order.status
        }
        response.append(to_add)
    session.close()
    return response
    
           
#get_portfolio
@app.post("/get_portfolio")
async def send_portfolio(secureobj : SecureInfo):
    try:
        payload = jwt.decode(secureobj.token, SECRET_KEY, algorithms=["HS256"])
        if(payload["user_id"]!=secureobj.user_id):
            return {"status" : "Access Denied, wrong user"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    session : Session = SessionLocal()
    data = session.query(Portfolio).filter(Portfolio.user_id==secureobj.user_id).all()
    response = []
    for data_point in data:
        to_add={
            "ticker" : data_point.ticker,
            "quantity" : data_point.quantity
        }
        response.append(to_add)
    session.close()
    return response           
     



#----------------------------------------------------------------------------------------
        
#sockets intialization:
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print("Received from client:", data)
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        connected_clients.remove(websocket)
        

    
    
if __name__ == '__main__':
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,       # ← enable auto-reload
        log_level="info"
    )