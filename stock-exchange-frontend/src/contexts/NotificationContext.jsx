import React, { createContext, useState, useCallback, useContext } from 'react';

import {  Snackbar,Alert,Stack,Typography} from '@mui/material';

const NotificationContext = createContext(null);

const NotificationProvider = ({children}) => {
    const [notifications,setNotifications] = useState([]);


    const showNotification = useCallback((message, severity='info') => {
        console.log(message);
        const id= Date.now()
        setNotifications(prev => [...prev,{id,message,severity}]);

    },[]);

    const handleClose = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      },[]);

    return (
        <NotificationContext.Provider value={showNotification}>
            {children}
            <Stack
        spacing={1}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 9999,
          maxWidth: '400px'
        }}
      >
        {notifications.map((notification) => (
          <Snackbar
            key={notification.id}
            open={true}
            autoHideDuration={1000}
            onClose={() => handleClose(notification.id)}
            sx={{ position: 'static' }} // Disables default positioning
          >
            <Alert 
              severity={notification.severity}
              onClose={() => handleClose(notification.id)}
              sx={{ width: '100%' }}
            >
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">
                  Order #{notification.message.order_id} - {notification.message.order_status}
                </Typography>
                <Typography variant="body2">
                  Price: {notification.message.executed_price}
                </Typography>
                <Typography variant="body2">
                  Quantity: {notification.message.executed_quantity}
                </Typography>
              </Stack>
            </Alert>
          </Snackbar>
        ))}
      </Stack>
        </NotificationContext.Provider>
    );


};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
      throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
  };
  
export default NotificationProvider;