import { AppBar,Toolbar, Typography,Link,Box ,Button, Container,Grid,Card,Stack} from '@mui/material'
import React, { useEffect, useState } from 'react'
import {  Link as RouterLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import { exploreService } from "../api/ApiHandler";
import { useWebSocket } from '../contexts/WebSocketsContext';

const Explore = () => {
  const navigate = useNavigate();
  const [ticker,setTickers] = useState([]);
  const [stockValues,setStockValues] = useState(new Map());

  const webSocketHandler= useWebSocket();
  const userId = localStorage.getItem("user_id");

  useEffect(()=> {
    const fetchStockData = async() =>{
      try{
        const stocks = await exploreService.fetchStocks();
      
        const newTickers = stocks.map(stock => stock.ticker);
        console.log(newTickers)
        const newStockValues = new Map();
        
        stocks.forEach(stock => {
          newStockValues.set(stock.ticker,{
            LTP: stock.last_traded_price,
            bestBid: stock.best_bid,
            bestAsk : stock.best_ask
          });
        });
        console.log(newStockValues)
        setTickers(newTickers);
        setStockValues(newStockValues);

      }
      catch (error) {
        console.error("Error fetching stocks:", error);
      }
    };
    fetchStockData();
  },[]);

  useEffect(() => {
    const handleOrderBookUpdate = (data) => {
      if (data.event_type === 'order_book_update') {
        setStockValues(prev => {
          // Create a new map to update immutably
          const updated = new Map(prev);
          updated.set(data.ticker, {
            LTP: data.last_traded_price,
            bestBid: data.best_bid,
            bestAsk: data.best_ask
          });
          return updated;
        });

        // Add new ticker to the list if it doesn't exist
        if (!ticker.includes(data.ticker)) {
          setTickers(prev => [...prev, data.ticker]);
        }
      }
    };

    // Subscribe to WebSocket updates
    const unsubscribe = webSocketHandler.subscribe(handleOrderBookUpdate);
    return unsubscribe;
  }, [webSocketHandler, userId, ticker]);

  const handlesubmit_orderhistory = () => {
    navigate("/order_history")
  }
  const handlesubmit_portfolio = () => {
    navigate("/portfolio")
  }
  const handlesubmit_profile = () => {
    navigate("/profile")
  }

  

  return (
    <div
    style={{
      color : "whitesmoke",
      minHeight : "100vh",
      background : 'linear-gradient(to right,rgb(44, 27, 29),rgb(19, 35, 21))',
      
  
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
          onClick={handlesubmit_portfolio}
          sx={{
            fontWeight: "bold",
            '&:hover' : {
              color : "yellow"
            }
          }}
          >
            Portfolio
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
        marginTop : "125px",
        marginLeft:"50px",
        minWidth:"750px"
      }}
      >
      <Container   
      
      > 
 
          <Stack 
          spacing={1}
            sx={{
              
            }}
          >
          <Card 
          sx={{
            
            minHeight : "10px",
            p:2,
            backgroundColor :"transparent",
            '&:hover':{
              backgroundColor: "blue"
            }
          }}
          >
            <Box
            sx={{
              flexGrow : 1,
              display : "flex",
              justifyContent: 'space-between',
               alignItems: 'center'
            }}
            > 
              <Typography
              color='white'
              >
                Stock_ticker
              </Typography>

              <Box
              sx={{
                flexGrow: 0.5,
               display : "flex",
               justifyContent: 'space-between',
                alignItems: 'center'
              }}
              >
                <Box>
                <Typography
                  color = "white"
                >
                LTP

                </Typography>
                </Box>
              
                <Box>
                <Typography
                  color = "white"
                >
                Best Bid

                </Typography>
                </Box>
                <Box>
                <Typography
                  color = "white"
                >
                Best Ask

                </Typography>
                </Box>
            </Box>
            </Box>

            
          </Card >
            {ticker.map((t) => {
            const stock = stockValues.get(t);

            return (
            <Card 
              key = {t}
              sx={{
                
                minHeight : "10px",
                p:2,
                backgroundColor :"transparent",
                '&:hover':{
                  backgroundColor: "blue"
                }
              }}
              >
                <Box
                sx={{
                  flexGrow : 1,
                  display : "flex",
                  justifyContent: 'space-between',
                   alignItems: 'center'
                }}
                > 
                  <Typography
                  color='white'
                  >
                    {t}
                  </Typography>
    
                  <Box
                  sx={{
                    flexGrow: 0.5,
                   display : "flex",
                   justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  >
                    <Box>
                    <Typography
                      color = "white"
                    >
                    {stock.LTP}
    
                    </Typography>
                    </Box>
                  
                    <Box>
                    <Typography
                      color = "white"
                    >
                    {stock.bestBid}
    
                    </Typography>
                    </Box>
                    <Box>
                    <Typography
                      color = "white"
                    >
                    {stock.bestAsk}
    
                    </Typography>
                    </Box>
                </Box>
                </Box>
    
                
              </Card >
            );})}

          </Stack>

      </Container>
      </Box>

    </div>
  )
}

export default Explore