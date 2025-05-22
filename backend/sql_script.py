from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float,ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime


DATABASE_URL = "postgresql://jaladisaran:Saranjs555@localhost/stock_exchange"

engine = create_engine(DATABASE_URL)


Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    __tablename__ = 'users'
    user_id = Column(Integer, primary_key=True,autoincrement=True)
    email = Column(String)
    password_hash=Column(String)
    created_at = Column(DateTime, default=datetime.datetime.now)
    
class Stock(Base):
    __tablename__ = 'stocks'
    ticker = Column(String, primary_key=True)
    stock_name=Column(String)
    last_traded_price=Column(Float,default=1000)
    best_bid=Column(Float,default=1000)
    best_ask=Column(Float,default=1000)
    buy_order_book=Column(String,default="")
    sell_order_book=Column(String,default="")

class OrderStatus(Base):
    __tablename__ = 'order_status'
    user_id = Column(Integer,index=True)
    order_id = Column(Integer, primary_key=True)
    status=Column(String,default='open')
    
class OrderDetails(Base):
    __tablename__ = 'order_details'
    order_id = Column(Integer, primary_key=True)
    ticker = Column(String,ForeignKey('stocks.ticker'),index=True)
    order_mode = Column(String)
    order_type = Column(String)
    price = Column(Float,default=0)
    quantity = Column(Integer)
    executed_quantity = Column(Integer,default=0)
    left_quantity = Column(Integer)

class Portfolio(Base):
    __tablename__ = 'portfolio'
    p_id = Column(Integer, primary_key=True,autoincrement=True)
    user_id = Column(Integer,index=True)
    ticker = Column(String,index=True)
    quantity = Column(Integer)

    
    
    
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

    
    