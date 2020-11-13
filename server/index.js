const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
let yup = require("yup");
const { nanoid } = require("nanoid");
const monk = require("monk");
const path = require("path");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

require("dotenv").config();

const db = monk(process.env.MONGO_URI);
const urls = db.get("urls");
urls.createIndex({ slug: 1 }, { unique: true });

const app = express();
app.enable("trust proxy");

app.use(helmet());

app.use(morgan("common"));
app.use(cors());

app.use(express.json());
app.use(express.static("./public"));

const notFoundPath = path.join(__dirname, "public/404.html");

//redirect to url
app.get("/:id", async (req, res) => {
  const { id: slug } = req.params;
  try {
    const url = await urls.findOne({ slug });
    if (url) {
      res.redirect(url.url);
    }
    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    return res.status(404).sendFile(notFoundPath);
  }
});

const linkSchema = yup.object().shape({
  slug: yup
    .string()
    .trim()
    .matches(/^[\w\-]+$/i),
  url: yup.string().trim().url(),
});

const slowerDownLimiter = slowDown({
  windowMs: 30 * 1000,
  delayAfter: 1,
  delayMs: 500,
});

const rateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1,
});

// create a shory url
app.post("/url", slowerDownLimiter, rateLimiter, async (req, res, next) => {
  let url = req.body.url;
  let slug = req.body.slug;

  try {
    await linkSchema.validate(slug, url);

    if (!slug) {
      slug = nanoid(5);
    } else {
      const existing = await urls.findOne({ slug });
      if (existing) {
        throw new Error("slug in use ");
      }
    }
    slug = slug.toLowerCase();
    const newUrl = {
      url,
      slug,
    };
    const created = await urls.insert(newUrl);
    res.json(created);
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  res.status(404).sendFile(notFoundPath);
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
  });
});

const port = process.env.PORT || 1337;

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
