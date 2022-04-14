import express from 'express';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send(
    `Hello from customer bff ${os.hostname()} \n
    basket: ${process.env.BASKET_SERVICE_URL} \n
    ordering: ${process.env.ORDERING_SERVICE_URL} \n
    products: ${process.env.PRODUCTS_SERVICE_URL} \n
    users: ${process.env.USERS_SERVICE_URL}`
  );
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
