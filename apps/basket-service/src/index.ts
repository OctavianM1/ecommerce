import express from 'express';
import dotenv from 'dotenv'
dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from basket service');
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
