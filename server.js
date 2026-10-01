const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "SANDBOX";

const CASHFREE_BASE_URL = CASHFREE_ENV === "PRODUCTION" 
  ? "https://api.cashfree.com/pg" 
  : "https://sandbox.cashfree.com/pg";

app.post('/api/create-cashfree-order', async (req, res) => {
  try {
    const { orderAmount, customerName, customerEmail, customerPhone } = req.body;
    const orderId = "ORD_" + Date.now();

    const payload = {
      order_id: orderId,
      order_amount: Number(orderAmount),
      order_currency: "INR",
      customer_details: {
        customer_id: "CUST_" + Date.now(),
        customer_name: customerName || "Customer",
        customer_email: customerEmail,
        customer_phone: customerPhone
      }
    };

    const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, payload, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    res.json({
      payment_session_id: response.data.payment_session_id,
      order_id: orderId,
      environment: CASHFREE_ENV.toLowerCase()
    });

  } catch (error) {
    console.error("Order Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Order create failed" });
  }
});

app.get('/api/verify-payment/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}/payments`, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01'
      }
    });
    const isSuccess = response.data.some(p => p.payment_status === "SUCCESS");
    res.json({ orderId, isSuccess });
  } catch (error) {
    res.status(500).json({ error: "Verify error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
