const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

app.use(helmet());

app.use(morgan("tiny"));
app.use(cors());

app.use(express.json());
app.use(express.static("./public"));
/* app.get("/", (req, res) => {
  res.json({
    message: "Helper for your hw",
  });
}); */
// get short Url by id
app.get("/url/:id", (req, res) => {
  res.json({
    message: "Helper for your hw",
  });
});
//redirect to url
app.get("/:id", (req, res) => {
  res.json({
    message: "Helper for your hw",
  });
});
// create a shory url
app.post("/url", (req, res) => {
  res.json({
    message: "Helper for your hw",
  });
});

const port = process.env.PORT || 1337;

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
