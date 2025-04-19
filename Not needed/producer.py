from kafkautils.Communication import KafkaCommunicator
import json
comm = KafkaCommunicator()

dummy_order = {
    "event_type": "create",  # Indicates an order placement event
    "event_id": 1,                  # Unique order identifier
    "order_id": 1,                  # Unique order identifi  er
    "order_mode": "buy",              # Order mode: "buy" or "sell"
    "order_type": "limit",            # Order type: "limit" or "market"
    "ticker": "AAPL",                 # Stock ticker symbol
    "price": 45,                    # Order price
    "quantity": 250                   # Number of shares
}

dummy_order_json_string=json.dumps(dummy_order)
print(f"Sending order placement message: {dummy_order_json_string}")
comm.send_message(dummy_order_json_string)


dummy_order = {
    "event_type": "place",  # Indicates an order placement event
    "event_id": 2,                  # Unique order identifier
    "order_id": 2,                  # Unique order identifi  er
    "order_mode": "buy",              # Order mode: "buy" or "sell"
    "order_type": "limit",            # Order type: "limit" or "market"
    "ticker": "AAPL",                 # Stock ticker symbol
    "price": 45,                    # Order price
    "quantity": 250                   # Number of shares
}
dummy_order_json_string=json.dumps(dummy_order)
print(f"Sending order placement message: {dummy_order_json_string}")
comm.send_message(dummy_order_json_string)


dummy_order = {
    "event_type": "place",  # Indicates an order placement event
    "event_id": 3,                  # Unique order identifier
    "order_id": 3,                  # Unique order identifi  er
    "order_mode": "sell",              # Order mode: "buy" or "sell"
    "order_type": "limit",            # Order type: "limit" or "market"
    "ticker": "AAPL",                 # Stock ticker symbol
    "price": 45,                    # Order price
    "quantity": 250                   # Number of shares
}
dummy_order_json_string=json.dumps(dummy_order)
print(f"Sending order placement message: {dummy_order_json_string}")
comm.send_message(dummy_order_json_string)

dummy_order = {
    "event_type": "place",  # Indicates an order placement event
    "event_id": 4,                  # Unique order identifier
    "order_id": 4,                  # Unique order identifi  er
    "order_mode": "sell",              # Order mode: "buy" or "sell"
    "order_type": "limit",            # Order type: "limit" or "market"
    "ticker": "AAPL",                 # Stock ticker symbol
    "price": 47,                    # Order price
    "quantity": 250                   # Number of shares
}
dummy_order_json_string=json.dumps(dummy_order)
print(f"Sending order placement message: {dummy_order_json_string}")
comm.send_message(dummy_order_json_string)

dummy_order = {
    "event_type": "place",  # Indicates an order placement event
    "event_id": 101,                  # Unique order identifier
    "order_id": 5,                  # Unique order identifi  er
    "order_mode": "sell",              # Order mode: "buy" or "sell"
    "order_type": "market",            # Order type: "limit" or "market"
    "ticker": "AAPL",                 # Stock ticker symbol
    "price": 45,                    # Order price
    "quantity": 120               # Number of shares
}
dummy_order_json_string=json.dumps(dummy_order)
print(f"Sending order placement message: {dummy_order_json_string}")
comm.send_message(dummy_order_json_string)

dummy_order = {
    "event_type": "stop",  # Indicates an order placement event
    "event_id": 79,                  # Unique order identifier
    "order_id": 6,                  # Unique order identifi  er
    "order_mode": "sell",              # Order mode: "buy" or "sell"
    "order_type": "limit",            # Order type: "limit" or "market"
    "ticker": "AAPL",                 # Stock ticker symbol
    "price": 45,                    # Order price
    "quantity": 250                   # Number of shares
}    

dummy_order_json_string=json.dumps(dummy_order)
print(f"Sending order placement message: {dummy_order_json_string}")
comm.send_message(dummy_order_json_string)

print(f"Listening for order updates on topic ')")

while True:
    message = comm.receive_message()
    print(f"Received message: {message}")
    
comm.close()
print("Done")


