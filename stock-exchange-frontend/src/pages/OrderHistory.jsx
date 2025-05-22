import React, { use, useEffect, useState } from 'react'
import { AppBar,Toolbar, Typography,Link,Box ,Button, Container,Grid,Card,Stack, TextField,CardContent} from '@mui/material'
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { exploreService } from "../api/ApiHandler";


const OrderHistory = () => {

    const navigate = useNavigate();

    const [orderHistory, setOrderHistory] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try{
                const history = await exploreService.fetchOrderHistory();
                console.log(history)
                setOrderHistory(history);
            }
            catch (error) {
                console.error("Error fetching order history:", error);
            }

        };
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

      const handlesubmit = async(order_id) =>{

        try{
         await exploreService.cancelOrder({order_id});
        }
        catch (error) {
            console.error("Error fetching order history:", error);
        }
        fetchData();
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
            <Box>
            <Typography>
            <h1 style={{
                color : "yellow",
                marginTop : "100px",
                marginLeft : "50px"
            }}>
                Order History
            </h1>
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
              {orderHistory.map((order) => {

                return (
                    <Card>
                        <Box>
                        <CardContent>
                        <Typography>
                            <h2 style={{
                                color : "Black",
                                marginLeft : "50px"
                            }}>
                                order_id = {order.order_id}
                            </h2>
                        </Typography>
                        <Typography>
                            <h2 style={{
                                color : "Black",
                                marginLeft : "50px"
                            }}>
                                Order Status = {order.status}
                            </h2>
                        </Typography>
                        </CardContent>
                        </Box>
                        
                        {(order.status !== "completed" && order.status!=="cancellation placed") && (
                            <Box
                            key={order.order_id}
                            sx={{
                                display : "flex",
                                justifyContent : "right",
                                marginTop : "-110px",
                                marginBottom : "50px",
                                marginRight : "50px"
                            }}
                            >
                            
    
                            
                            <Button
                            onClick={() => handlesubmit(order.order_id)}
                            variant='contained'
                            sx={{
                                color :"White",
                                backgroundColor : "red",
                            }}
                            >
                                Cancel
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

export default OrderHistory