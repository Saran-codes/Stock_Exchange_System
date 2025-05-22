import random
import time
import requests
import sys
import termios
import tty
import select
import os

rate = int(os.getenv('RATE', 100))
interval = 1.0 / rate
# …

tickers = ["Apple", "Google", "Microsoft", "Amazon", "Tesla"]

class KeyPoller:
    def __enter__(self):
        self.fd = sys.stdin.fileno()
        self.old = termios.tcgetattr(self.fd)
        tty.setcbreak(self.fd)
        return self

    def __exit__(self, *args):
        termios.tcsetattr(self.fd, termios.TCSADRAIN, self.old)

    def poll(self):
        dr, _, _ = select.select([sys.stdin], [], [], 0)
        if dr:
            return sys.stdin.read(1)
        return None

def register():
    r = requests.post("http://localhost:8000/register",
                      json={"email_address":"saran@g.com","password":"123"})
    if r.status_code not in (201, 409):
        r.raise_for_status()
    print("REGISTER:", r.status_code, r.text)

def login():
    r = requests.post("http://localhost:8000/login",
                      json={"email_address":"saran@g.com","password":"123"})
    r.raise_for_status()
    data = r.json()
    print("LOGIN:", data)
    return data["access_token"], data["user_id"]

def create_tickers(token, user_id):
    for t in tickers:
        r = requests.post("http://localhost:8000/create_ticker", json={
            "token": token, "user_id": user_id,
            "ticker": t, "stock_name": t
        })
        r.raise_for_status()
    print("TICKERS CREATED:", tickers)

def place_order(token, user_id):
    payload = {
        "token":      token,
        "user_id":    user_id,
        "ticker":     random.choice(tickers),
        "order_mode": random.choice(["buy","sell"]),
        "order_type": "limit",
        "price":      random.randint(500,2000),
        "quantity":   random.randint(1,1000)
    }
    r = requests.post("http://localhost:8000/place_order", json=payload)
    r.raise_for_status()
    print("ORDER:", payload["order_mode"], payload["ticker"],
          "@", payload["price"], "×", payload["quantity"])

def main():
    register()
    token, user_id = login()
    create_tickers(token, user_id)

    print("Press 'x' to toggle pause/resume")
    paused = False

    with KeyPoller() as key_poller:
        while True:
            c = key_poller.poll()
            if c == "x":
                paused = not paused
                print("Paused" if paused else "Resumed")

            if not paused:
                place_order(token, user_id)

            # small sleep to prevent 100% CPU spin
            time.sleep(0.05)

if __name__ == "__main__":
    main()
