import React from 'react'
import { Container, TextField, Typography,FormControl, Button,Link, Alert } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';



const styles = {
    root : {
        minHeight: '100vh',
        border: '2px solid black',
        display : 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    registercontainer : {
       
            display: "flex",
            flexDirection: "column",
            padding: 2,
            width:'400px',
            height: '500px',
            borderRadius: '30px', 
            boxShadow: 6,
            alignItems:"center",
            justifyContent: "center",
            gap:3,
            backgroundColor: 'rgba(86, 122, 229, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
             border: '1px solid rgba(255, 255, 255, 0.2)'
    }

}

const Register = () => {
    
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('')
    const [isLoading,setIsLoading] = useState(false);
    const [error,setError] = useState('');
    const navigate = useNavigate();


    const handleSubmit = async (e) =>{
        e.preventDefault();
        console.log('Registration Attempt: ',{email,password});

        try{
            setIsLoading(true);
            const data = await authService.register({ email, password });
            console.log(data.status);
            if(data.status==="Already registered with this mail" || (
                data.status==="Successfully Registered"
            )){
                try{
                    const data_login= await authService.login({email,password});
                    localStorage.setItem('access_token', data_login.access_token);
                    localStorage.setItem('user_id',data_login.user_id);
                    navigate("/explore");
                }
                catch (error) {
                    throw new Error(error.response?.data?.message || 'Login after registration failed');
                  }
            }         
        }
        catch(err){
            setError(err.message);
        }
        finally{
            setIsLoading(false);
        }

    }



  return (
    <div
    style = {styles.root}
    >
        <Container maxWidth='sm'
        sx={styles.registercontainer}  
        >
            <Typography variant="h4"
            sx = {{
                color: "white",
                fontWeight: "bold",
                letterSpacing : 0.1,
                textAlign : "center",
                marginBottom: "24px",
                fontFamily : "serif",
                textShadow : '0px 2px 4px rgba(0,0,0,0.2)'


            }}
            >
                Create Account,
            </Typography>

            {error &&(
                <Alert
                severity='error'
                sx={{
                    color : "red",
                    width : "75%",
                    mb: 2
                }}
                > 
                {error}
                </Alert>

            )}
            <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{gap:2}}>
                <TextField
                
                label='Email' 
                type='email'
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                required
                 variant="outlined"
                sx={{backgroundColor : 'white',borderRadius: '10px'}}
                >

                </TextField>
                <TextField
                label='Password'
                type='password'
                value= {password}
                onChange={(e)=>setPassword(e.target.value)}
                required
                 variant="outlined"
                sx={{backgroundColor : 'white',borderRadius: '10px'}}
                >

                </TextField>
                <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                >
                    {isLoading ? "Registering" : "Register"}

                    
                </Button>
                <Typography
                variant = 'body2'
                sx={{

                    color: 'white', 
                    textAlign: 'center' 

                }
                }   
                >
                    Already have an account?{' '}
                    <Link to="/login"
                    component={RouterLink}
                        sx={{ 
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline'
                                    }}}
                    >
                    Login
                    </Link>
                </Typography>
            </FormControl>

            </form>
            
        </Container>

    </div>
  )
}

export default Register