const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("studyscribe is on fire");
});

app.listen(port, () => {
  console.log(`studyscribe is on fire on the port ${port}`);
});
