import random
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

API_BASE       = 'http://localhost:8000'
EMAIL          = 'saran@g.com'
PASSWORD       = '123'
TICKERS        = ['Apple', 'Google', 'Microsoft', 'Amazon', 'Tesla']
TOTAL_ORDERS   = 10_000
WORKERS        = 200
PROGRESS_STEP  = 1_000

def register_user():
    url = f'{API_BASE}/register'
    payload = {'email_address': EMAIL, 'password': PASSWORD}
    r = requests.post(url, json=payload)
    # ignore “already exists”
    if r.status_code not in (201, 409):
        r.raise_for_status()

def login_user():
    url = f'{API_BASE}/login'
    payload = {'email_address': EMAIL, 'password': PASSWORD}
    r = requests.post(url, json=payload)
    r.raise_for_status()
    data = r.json()
    return data['access_token'], data['user_id']

def create_tickers(token, user_id):
    session = requests.Session()
    session.headers.update({
        'Authorization': f'Bearer {token}',
        'Content-Type':  'application/json'
    })
    for t in TICKERS:
        url = f'{API_BASE}/create_ticker'
        payload = {
            'user_id':    user_id,
            'ticker':     t,
            'stock_name': t
        }
        r = session.post(url, json=payload)
        r.raise_for_status()

def place_order(session, token, user_id):
    payload = {
        'token':      token,
        'user_id':    user_id,
        'ticker':     random.choice(TICKERS),
        'order_mode': random.choice(['buy', 'sell']),
        'order_type': 'limit',
        'price':      random.randint(500, 1500),
        'quantity':   random.randint(1, 1000),
    }
    url = f'{API_BASE}/place_order'
    r = session.post(url, json=payload)
    r.raise_for_status()

def main():
    # One-time setup
    register_user()
    token, user_id = login_user()
    print(f'🔑 Logged in as user_id={user_id}')
    create_tickers(token, user_id)
    print(f'➕ Created tickers: {TICKERS}')

    # Prepare a shared session with Bearer token
    session = requests.Session()
    session.headers.update({
        'Authorization': f'Bearer {token}',
        'Content-Type':  'application/json'
    })

    # Fire exactly TOTAL_ORDERS as fast as possible
    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = [
            executor.submit(place_order, session, token, user_id)
            for _ in range(TOTAL_ORDERS)
        ]
        for i, fut in enumerate(as_completed(futures), start=1):
            try:
                fut.result()
            except Exception as e:
                print(f'❗ Order {i} failed:', e)
            if i % PROGRESS_STEP == 0:
                print(f'📤 {i}/{TOTAL_ORDERS} orders placed')

    print('✅ Finished placing all orders')

if __name__ == '__main__':
    start = time.time()
    main()
    print(f'Elapsed time: {time.time() - start:.2f}s')
