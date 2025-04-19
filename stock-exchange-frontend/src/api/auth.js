import axios from 'axios'

const api = axios.create({
    baseURL : "http://0.0.0.0:8000",
    //withCredentials: true

})

export const authService ={
    login : async(credentials) =>{
        try{
            const response = await api.post('/login',
                {
                    email_address: credentials.email,
                    password : credentials.password
                }

            );
            return response.data;

        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
          }

    },

    register : async(credentials) => {
        try{
            const response = await api.post('/register',
                {
                    email_address: credentials.email,
                    password : credentials.password
                }

            );
            return response.data;

        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
          }
    }

}