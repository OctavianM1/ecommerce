import express from 'express';
import dotenv from 'dotenv'
dotenv.config();

const app = express();

app.get('/', (req, res) => {
  console.log('here');
  res.send('Hello from products service 123 ' + process.env.NODE_ENV);
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
