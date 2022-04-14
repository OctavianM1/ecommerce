import express from 'express';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send(
    `Hello from customer bff ${os.hostname()} 
    basket: ${process.env.BASKET_SERVICE_URL} 
    ordering: ${process.env.ORDERING_SERVICE_URL} 
    products: ${process.env.PRODUCTS_SERVICE_URL} 
    users: ${process.env.USERS_SERVICE_URL}`
  );
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
