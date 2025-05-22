import React, { useEffect, useState } from 'react'
import { AppBar,Toolbar, Typography,Link,Box ,Button, Container,Grid,Card,Stack, TextField,CardContent} from '@mui/material'
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { exploreService } from "../api/ApiHandler";
import { useWebSocket } from '../contexts/WebSocketsContext';
import OrderForm from '../components/OrderForm'

const StockPage = () => {
    const navigate = useNavigate();

    const {ticker} = useParams();
    const [ltp,setLtp] =useState(1000);
    const [bb,setBb] = useState(1000);
    const [ba,setBa] = useState(1000); 
    
    const [books,setBooks] = useState({
        buy_order_book: [],
        sell_order_book : []
    })
    const webSocketHandler= useWebSocket();

    useEffect(() => {
        const fetchData = async () => {
            try{
                const tickerData =await exploreService.fetchStocks();
                let {buy_order_book,sell_order_book} = await exploreService.fetchOrderBook(ticker);
                const stock= tickerData.find(stock => stock.ticker === ticker);
                if(stock){
                    setLtp(stock.last_traded_price);
                    setBb(stock.best_bid);
                    setBa(stock.best_ask);
                }
                else{
                    console.error("Stock not found");   
                }
               // sell_order_book = [...(sell_order_book || [])].reverse()
                setBooks({ buy_order_book, sell_order_book })



            }
            catch (error) {
                console.error("Error fetching stock data:", error);
            }
        };
        
        fetchData();
    },[ticker]);

    useEffect(()=>{
        const handleOrderBookUpdate = (data) => {
            if(data.event_type == "order_book_update"&&data.ticker == ticker){
                console.log("Order Book Update:", data);
                setLtp(data.last_traded_price);
                setBb(data.best_bid);
                setBa(data.best_ask);
                //data.sell_order_book = [...(data.sell_order_book || [])].reverse()
                setBooks({
                    buy_order_book: data.buy_order_book,
                    sell_order_book: data.sell_order_book
                })
            }
        };
        const unsubscribe = webSocketHandler.subscribe(handleOrderBookUpdate);
        return () => {
            unsubscribe();
        };
    },[webSocketHandler,ticker]);

    
    const handlesubmit_orderhistory = () => {
        navigate("/order_history")
      }
      const handlesubmit_portfolio = () => {
        navigate("/portfolio")
      }
      const handlesubmit_profile = () => {
        navigate("/profile")
      }
      const handlesubmit_home = () => {
        navigate("/explore")
      }

      const handleOrderSubmit = async ({ mode, type, price, quantity }) => {
        const resp = await exploreService.placeOrder({
          ticker,
          order_mode: mode,
          order_type: type,
          quantity,
          price
          
        });
        console.log("Order Response:", resp);
      }



    return <div
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
          {/* OrderBook */}
      <Box
        sx={{
          mt: '170px',
          ml: '200px',
          border: '1px solid #555',
          minWidth: '300px',
          //minHeight: '370px',
          borderRadius: 2,
          p: 2,
          backgroundColor: 'rgba(0,0,0,0.6)'
        }}
      >
        {/* Sell Side */}
        <Typography variant="subtitle1" gutterBottom>
          Sell Order Book
        </Typography>
        
        <Grid container spacing={1}
        sx={{
            display: 'flex',
            minHeight
            : '150px',
        }}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const level = books.sell_order_book[i]
            return (
                
              <Grid item xs={2.4} key={`sell-${i}`}>
                <Card
                  sx={{
                    height: 80,
                    backgroundColor: level
                      ? 'rgba(255,100,100,0.2)'
                      : 'transparent'
                  }}
                >
                  {level && (
                    <CardContent sx={{ p: 1 }}>
                      <Typography color="salmon" variant="body2">
                        {level.price}
                      </Typography>
                      <Typography variant="body2">
                        {level.total_quantity}
                      </Typography>
                    </CardContent>
                  )}
                </Card>
              </Grid>
              
            )
          })}
        </Grid>
        

        {/* Buy Side */}
        <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
          Buy Order Book
        </Typography>
        <Grid container spacing={1}
        sx={{
            display: 'flex',
            minHeight
            : '150px',
        }}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const level = books.buy_order_book[i]
            return (
              <Grid item xs={2.4} key={`buy-${i}`}>
                <Card
                  sx={{
                    height: 80,
                    backgroundColor: level
                      ? 'rgba(100,255,100,0.2)'
                      : 'transparent'
                  }}
                >
                  {level && (
                    <CardContent sx={{ p: 1 }}>
                      <Typography color="lightgreen" variant="body2">
                        {level.price}
                      </Typography>
                      <Typography variant="body2">
                        {level.total_quantity}
                      </Typography>
                    </CardContent>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      <Card
      sx={{
        mt: '140px',
        ml: '550px',
        border: '1px solid #555',
        minWidth: '300px',
        minHeight: '50px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
      >
        <Typography variant='body2'
        color='white'
        >
        Ticker: {ticker}
        </Typography>
        <Typography variant='body2'
        color='white'
        >
        LTP: {ltp}
        </Typography>
      </Card>
      <Stack spacing={4}
      sx={{
        ml: '-350px',
        mt: '200px'

      }}
      >
        
        <OrderForm onSubmit={handleOrderSubmit} />
      </Stack>


      </div>
}

export default StockPage;