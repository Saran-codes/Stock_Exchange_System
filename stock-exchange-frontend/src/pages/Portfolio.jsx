import React, { use, useEffect, useState } from 'react'
import { AppBar,Toolbar, Typography,Link,Box ,Button, Container,Grid,Card,Stack, TextField,CardContent} from '@mui/material'
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { exploreService } from "../api/ApiHandler";


const Portfolio = () => {

    const navigate = useNavigate();

    const [portfolio,setPortfolio] = useState([]);

    useEffect(() => {
        const fetchData = async() =>{
            try{
                const portfolio = await exploreService.fetchPortfolio();
                setPortfolio(portfolio);
            }
            catch(error) {
                console.error("Error fetching portfolio:", error);
            }

        }
        fetchData();
    },[]);

    const handlesubmit_portfolio = () => {
        navigate("/portfolio")
      }
      const handlesubmit_profile = () => {
        navigate("/profile")
      }
      const handlesubmit_home = () => {
        navigate("/explore")
      }
      const handlesubmit_orderhistory=() =>{
        navigate("/order_history")
      }

      return<div
      style={{
        color : "whitesmoke",
        minHeight : "100vh",
        background : 'linear-gradient(120deg, #0f2027, #203a43, #2c5364)',
        
    
          display: 'flex',
          alignItems: "flex-start",
          justifyContent: "flex-start"
      
      }}
      >
        <AppBar
              position='fixed'
              component = 'nav'
              sx={{
                color:"aquamarine",
                backgroundColor:"rgb(27, 26, 36)"
              }}
              >
                <Toolbar
                variant='dense'
                sx={{
                  color: "GrayText",
                  display :"flex",
                  
                }
                }
                >
                  <Typography
                  variant='h5'
                  sx={{
                    flexGrow:1,
                    color: "white",
                    fontWeight: "bold"
                  }}
                  >
                    Stock Exchange
                  </Typography>

                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Button
                  onClick={handlesubmit_home}
                  sx={{
                    fontWeight: "bold",
                    '&:hover' : {
                      color : "yellow"
                    }
                  }}
                  >
                    Home
                  </Button>
        
                  </Box>

                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Button
                  onClick={handlesubmit_orderhistory}
                  sx={{
                    fontWeight: "bold",
                    '&:hover' : {
                      color : "yellow"
                    }
                  }}
                  >
                    Order History
                  </Button>
        
                  </Box>
        
                  
                  
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Button
                  onClick={handlesubmit_profile}
                  sx={{
                    fontWeight: "bold",
                    '&:hover' : {
                      color : "yellow"
                    }
                  }}
                  >
                    Profile
                  </Button>
        
                  </Box>
                </Toolbar>
        
              </AppBar>

              <Box
              sx={{
                mt: 10,
                ml: 5
                
            }}
              >
                <Typography
                color='yellow'

                variant='h3'
                >
                    Portfolio
                </Typography>
              </Box>
              

              <Box
                        sx={
                          {
                              marginTop : "150px",
                              marginLeft:"-100px",
                              minWidth:"1000px"
                          }
                        }
                        >
                          <Stack
                          spacing={1}
                          >
                            {portfolio.map((stock) => {
              
                              return (
                                  <Card>
                                      <Box>
                                      <CardContent>
                                      <Typography>
                                          <h2 style={{
                                              color : "Black",
                                              marginLeft : "50px"
                                          }}>
                                              Ticker = {stock.ticker}
                                          </h2>
                                      </Typography>
                                      <Typography>
                                          <h2 style={{
                                              color : "Black",
                                              marginLeft : "50px"
                                          }}>
                                              Quantity = {stock.quantity}
                                          </h2>
                                      </Typography>
                                      </CardContent>
                                      </Box>
                                      
                                      { (
                                          <Box
                                          key={stock.ticker}
                                          sx={{
                                              display : "flex",
                                              justifyContent : "right",
                                              marginTop : "-110px",
                                              marginBottom : "50px",
                                              marginRight : "50px"
                                          }}
                                          >
                                          
                  
                                          
                                          <Button
                                          onClick = {() => navigate(`/stock/${stock.ticker}`)}
                                          variant='contained'
                                          sx={{
                                              color :"White",
                                              backgroundColor : "blue",
                                          }}
                                          >
                                              Go to Stock page
                                          </Button>
                                          </Box>
                                      )}
              
                                      
                                     
                                  </Card>
                              )
                            })}
              
                          </Stack>
                        </Box>


      </div>
}

export default Portfolio;