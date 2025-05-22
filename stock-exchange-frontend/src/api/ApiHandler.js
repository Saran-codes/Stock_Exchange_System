import axios from 'axios'
import { useNavigate } from 'react-router-dom';

const api = axios.create({
    baseURL : "http://192.168.137.121:8000"

})


export const exploreService = {
   // const navigate = useNavigate();
    

    fetchStocks: async() => {
        try{
            const response = await api.get('/ticker_data');
            //console.log(response.data);
            return response.data;
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch stocks');
          }
    },

    createTicker: async({ticker,stock_name}) => {
        const token = localStorage.getItem('access_token');
        const user_id =  localStorage.getItem('user_id');

        if(!token){
            console.log("Token not found");
        }
        if(!user_id){
            console.log("User ID not found");
        }

        if (!token || !user_id) {
            //navigate("/login")
            throw new Error('Missing authentication credentials')
        }

        const payload = {
            "token": token,
            "user_id" : user_id,
            "ticker" : ticker,
            "stock_name": stock_name
        }

        try{
            const response = await api.post('/create_ticker', payload)
            
            return response.data;
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create ticker');
        }
        
    },

    fetchOrderBook: async(ticker) => {
        try{
            const response = await api.get(`/get_order_book/${ticker}`)
            
            console.log("here",response.data)
            return response.data;

        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch order book');
          }
    },

    placeOrder: async({ticker,order_mode,order_type,quantity,price}) => {
        const token = localStorage.getItem('access_token');
        const user_id =  localStorage.getItem('user_id');

        if (!token || !user_id) {
           // navigate("/login")
            throw new Error('Missing authentication credentials')
        }

        const payload = {
            "token": token,
            "user_id" : user_id,
            "ticker" : ticker,
            "order_mode": order_mode,
            "order_type": order_type,
            "price": price,
            "quantity": quantity
        }

        try{
            const response = await api.post('/place_order', payload)
            
            return response.data;
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create ticker');
        }

    },

    fetchOrderHistory: async() => {
        const token = localStorage.getItem('access_token');
        const user_id =  localStorage.getItem('user_id');

        if (!token || !user_id) {
            //navigate("/login")
            throw new Error('Missing authentication credentials')
        }
        const payload = {
            "token": token,
            "user_id" : user_id
        }

        try{
            const response = await api.post('/get_order_history',payload)
            console.log("Order History:",response.data)
            return response.data;
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch order history');
          }
        

    },

    cancelOrder: async({order_id}) => {
        const token = localStorage.getItem('access_token');
        const user_id =  localStorage.getItem('user_id');

        if (!token || !user_id) {
            //navigate("/login")
            throw new Error('Missing authentication credentials')
        }

        const payload = {
            "token": token,
            "user_id" : user_id,
            "order_id" : order_id
            
        }

        try{
            const response = await api.post('/cancel_order',payload)
            console.log("Cancel Order:",response.data)
            return response.data;
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to cancel order');
          }
    },

    fetchPortfolio :async() => {
        const token = localStorage.getItem('access_token');
        const user_id =  localStorage.getItem('user_id');

        if (!token || !user_id) {
           // navigate("/login")
            throw new Error('Missing authentication credentials')
        }

        const payload = {
            "token": token,
            "user_id" : user_id,
           
            
        }
        try{
        const resp = await api.post('/get_portfolio',payload)
        console.log("Portfolio:",resp.data)
        return resp.data;
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch portfolio');
          }
    }





}