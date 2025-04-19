import React, { createContext, useContext, useEffect } from 'react';
import { webSocketHandler } from '../api/websocket';
import { useNotification } from './NotificationContext';


const WebSocketContext = createContext(null);

export const WebSocketProvider = ({children}) =>{
    const showNotification = useNotification();

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const userId= localStorage.getItem("user_id");

        // if (!token || !userId) {
        //     console.log('No token or user_id found. Skipping WebSocket connection.');
        //     return;
        //   }

        webSocketHandler.connect();

        const unsubscribe = webSocketHandler.subscribe((data)=>{

            if(data.event_type==='notification'){
                console.log(data);
                showNotification({
                    order_id: data.order_id,
                    order_status: data.order_status,
                    executed_price: data.executed_price,
                    executed_quantity: data.executed_quantity,

                },'info');
            }
            else if(data.event_type==="order_book_update"){
                console.log('Order Book Update:', data);


            }
            

        });
        return () => {
            unsubscribe();
           // webSocketHandler.socket?.close();
          };


    },[showNotification]);

    return <WebSocketContext.Provider value={webSocketHandler}>{children}</WebSocketContext.Provider>;
}
export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
      throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
  };
  

export default WebSocketProvider;