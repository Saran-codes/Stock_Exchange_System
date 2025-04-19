import axios from 'axios'

const api = axios.create({
    baseURL : "http://0.0.0.0:8000"

})


export const exploreService = {

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



}