import React, { useState } from 'react'
import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Button
} from '@mui/material'
import { green, red, blue } from '@mui/material/colors'

export default function OrderForm({ onSubmit }){

    const [mode, setOrder_mode] = useState('buy')
    const [type, setOrder_type] = useState('limit')
    const [price, setPrice] = useState('')
    const [quantity, setQuantity] = useState('')

    const handleModeChange = (event,newMode) => {
        if(newMode !== null){
            setOrder_mode(newMode)
        }
    }

    const handleTypeChange = (event,newType) => {
        if(newType !== null){
            setOrder_type(newType)
        }
    }

    const handleSubmit = () => {
        if (!quantity || (type === 'limit' && !price)) return
        onSubmit({ mode, type, price, quantity })
      }

      const accentBg = mode === 'buy' 
    ? green[500]    // 10% opacity
    : red[500]   

    return (
        <Box
          sx={{
            backgroundColor: accentBg,
            borderRadius: 2,
            p: 3,
            opacity: 0.9,
            minWidth: 320
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" color="white">
              Place Order
            </Typography>
    
            {/* Order Mode */}
            <Box>
              <Typography variant="subtitle2" color="white" gutterBottom>
                Order Mode
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                aria-label="order mode"
                size="small"
              >
                <ToggleButton
                  value="buy"
                  sx={{
                    color: mode === 'buy' ? 'white' : 'lightgray',
                    bgcolor: mode === 'buy' ? green[600] : 'transparent',
                    
                    '&:hover': { bgcolor: green[700] }

                  }}
                >
                  Buy
                </ToggleButton>
                <ToggleButton
                  value="sell"
                  sx={{
                    color: mode === 'sell' ? 'white' : 'lightgray',
                    bgcolor: mode === 'sell' ? red[600] : 'transparent',
                    '&:hover': { bgcolor: red[700] }
                  }}
                >
                  Sell
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
    
            {/* Order Type */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="white" gutterBottom>
                Order Type
              </Typography>
              <ToggleButtonGroup
                value={type}
                exclusive
                onChange={handleTypeChange}
                aria-label="order type"
                size="small"
              >
                <ToggleButton
                  value="limit"
                  sx={{
                    color: type === 'limit' ? blue[50] : 'lightgray',
                    bgcolor: type === 'limit' ? blue[600] : 'transparent',
                    '&:hover': { bgcolor: blue[700] }
                  }}
                >
                  Limit
                </ToggleButton>
                <ToggleButton
                  value="market"
                  sx={{
                    color: type === 'market' ? blue[50] : 'lightgray',
                    bgcolor: type === 'market' ? blue[600] : 'transparent',
                    '&:hover': { bgcolor: blue[700] }
                  }}
                >
                  Market
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
    
            {/* Price (only for Limit) */}
            {type === 'limit' && (
              <TextField
                label="Price"
                variant="filled"
                value={price}
                onChange={e => setPrice(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: 'lightgray' } }}
                InputProps={{
                  sx: {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }
                }}
              />
            )}
    
            {/* Quantity */}
            <TextField
              label="Quantity"
              variant="filled"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              fullWidth
              InputLabelProps={{ sx: { color: 'lightgray' } }}
              InputProps={{
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                }
              }}
            />
    
            {/* Submit */}
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                backgroundColor: blue[500],
                color: 'white',
                '&:hover': { backgroundColor: blue[700] },
                textTransform: 'none'
              }}
            >
              Submit
            </Button>
          </Stack>
        </Box>
      )
    


}