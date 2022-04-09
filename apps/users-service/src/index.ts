import express from 'express';
import dotenv from 'dotenv'
dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from users service');
});

const port = process.env.PORT || 3100;

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
