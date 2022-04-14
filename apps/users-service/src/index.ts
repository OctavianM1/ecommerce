import express from 'express';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send(`Hello from users service ${os.hostname()}`);
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
