import express from 'express';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send(`Hello from basket service1 ${os.hostname()}`);
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
