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
    logincontainer : {
       
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

const Login = () => {
    
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError('')
        console.log('Login Attempt: ',{email,password});

        try{
            setIsLoading(true);
            const data = await authService.login({ email, password });
            console.log(data.status);
            if(data.status === "wrong password"){
                setError('Wrong password!');
                
            }
            else{
                if(data.status === "user not registered"){
                    setError('Not Registered');
                    navigate("/register");
    
                }
                else{// this else is necessary if not below code will run after navigate, its not
                    //like control go to some other page this function will execute untll it is complete
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('user_id',data.user_id);
                    navigate("/explore");
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
        sx={styles.logincontainer}  
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
                Welcome back,
            </Typography>
            {error && (
                <Alert
                severity='error'
                sx={{
                    mb: 2, width: '75%',
                    color:"red",
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
                   {isLoading?"Logging In" : "Login" }

                    
                </Button>
                <Typography
                variant = 'body2'
                sx={{

                    color: 'white', 
                    textAlign: 'center' 

                }
                }   
                >
                    Don't have an account?{' '}
                    <Link to="/register"
                    component={RouterLink}
                        sx={{ 
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline'
                                    }}}
                    >
                    Register
                    </Link>
                </Typography>
            </FormControl>

            </form>
            
        </Container>

    </div>
  )
}

export default Login