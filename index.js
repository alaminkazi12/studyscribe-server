const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r90hnej.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const studyscribeDb = client.db("studyscribe");
    const booksCollection = studyscribeDb.collection("books");
    const categories = studyscribeDb.collection("categories");
    const featuredBooks = studyscribeDb.collection("featuredbooks");
    const borrowedBooksCollection = studyscribeDb.collection("borrowedBooks");

    app.get("/books", async (req, res) => {
      const { page, size } = req.query;
      const result = await booksCollection
        .find()
        .skip(parseInt(page) * parseInt(size))
        .limit(parseInt(size))
        .toArray();

      res.send(result);
    });

    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    app.post("/borrow-book/:id", async (req, res) => {
      const bookId = req.params.id;

      const { returnDate, email, displayName, BorrowDate } =
        req.body.updatedInfo;
      console.log(returnDate, email, displayName, BorrowDate);

      try {
        const updateResult = await booksCollection.updateOne(
          { _id: new ObjectId(bookId), quantity: { $gt: 0 } },
          { $inc: { quantity: -1 } }
        );

        const result = await borrowedBooksCollection.insertOne({
          userEmail: email,
          bookId: new ObjectId(bookId),
          UserName: displayName,
          returnDate: returnDate,
          BorrowDate: BorrowDate,
        });

        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.put("/retun-book/:id", async (req, res) => {
      const bookId = req.params.id;
      await booksCollection.updateOne(
        { _id: new ObjectId(bookId) },
        { $inc: { quantity: 1 } }
      );

      // delte the returen book data
      const query = { bookId: new ObjectId(bookId) };
      const result = await borrowedBooksCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/borrow-book/", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await borrowedBooksCollection.find(query).toArray();
      res.send(result);
      console.log(email);
    });

    app.get("/featuredbooks", async (req, res) => {
      const cursor = featuredBooks.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/categories", async (req, res) => {
      const cursor = categories.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/category/:name", async (req, res) => {
      const name = req.params.name;
      const query = { category_name: name };
      const result = await categories.findOne(query);
      res.send(result);
    });

    app.get("/books/c/:name", async (req, res) => {
      const name = req.params.name;
      const query = { category: { $in: [name] } };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/bookscount", async (req, res) => {
      const count = await booksCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.post("/books", async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    });

    app.put("/book/:id", async (req, res) => {
      const id = req.params.id;
      const updatedBook = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const book = {
        $set: {
          image: updatedBook.image,
          name: updatedBook.name,
          category: updatedBook.category,
          author: updatedBook.author,
          rating: updatedBook.rating,
        },
      };

      const result = await booksCollection.updateOne(filter, book, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("studyscribe is on fire");
});

app.listen(port, () => {
  console.log(`studyscribe is on fire on the port ${port}`);
});
