import fs from "node:fs/promises";
import bodyParser from "body-parser";
import express from "express";
import db from "./books/db.js"
import {serve, setup} from "swagger-ui-express"
import swaggerDocument from './swagger.json' assert {type: 'json'};

const app = express();


app.use(express.static("images"));
app.use(bodyParser.json());
app.use('/api-docs', serve, setup(swaggerDocument));


// CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // allow all domains
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    next();
});

app.get("/books", async (req, res) => {
    try {
        db.query(`SELECT * FROM public.book_metadata ORDER BY id LIMIT 10 OFFSET ${10*req.query.page} ;`, (result) => {
            db.query("SELECT COUNT(id) FROM book_metadata;", (count) => {
                res.status(200).json({books: result.rows,current_page_number:req.query.page, pages: count.rows[0]});
            })
        })


    } catch (e) {
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
})

// app.get("/books", async (req, res) => {
//   await new Promise((resolve) => setTimeout(resolve, 3000));

//   const fileContent = await fs.readFile("./data/books.json");

//   const booksData = JSON.parse(fileContent);

//   res.status(200).json({ books: booksData });
// })


// app.post("/books", async (req, res) => {
//   await new Promise((resolve) => setTimeout(resolve, 3000));

//   // req.body.
//   const fileContent = await fs.readFile("./data/books.json");

//   const booksData = JSON.parse(fileContent);

//   res.status(200).json({ books: booksData });
// })

app.get("/places", async (req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const fileContent = await fs.readFile("./data/places.json");

    const placesData = JSON.parse(fileContent);

    res.status(200).json({places: placesData});
});

app.get("/user-places", async (req, res) => {
    const fileContent = await fs.readFile("./data/user-places.json");

    const places = JSON.parse(fileContent);

    res.status(200).json({places});
});

app.put("/user-places", async (req, res) => {
    const placeId = req.body.placeId;

    const fileContent = await fs.readFile("./data/places.json");
    const placesData = JSON.parse(fileContent);

    const place = placesData.find((place) => place.id === placeId);

    const userPlacesFileContent = await fs.readFile("./data/user-places.json");
    const userPlacesData = JSON.parse(userPlacesFileContent);

    let updatedUserPlaces = userPlacesData;

    if (!userPlacesData.some((p) => p.id === place.id)) {
        updatedUserPlaces = [...userPlacesData, place];
    }

    await fs.writeFile(
        "./data/user-places.json",
        JSON.stringify(updatedUserPlaces)
    );

    res.status(200).json({userPlaces: updatedUserPlaces});
});

app.delete("/user-places/:id", async (req, res) => {
    const placeId = req.params.id;

    const userPlacesFileContent = await fs.readFile("./data/user-places.json");
    const userPlacesData = JSON.parse(userPlacesFileContent);

    const placeIndex = userPlacesData.findIndex((place) => place.id === placeId);

    let updatedUserPlaces = userPlacesData;

    if (placeIndex >= 0) {
        updatedUserPlaces.splice(placeIndex, 1);
    }

    await fs.writeFile(
        "./data/user-places.json",
        JSON.stringify(updatedUserPlaces)
    );

    res.status(200).json({userPlaces: updatedUserPlaces});
});

// 404
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }
    res.status(404).json({message: "404 - Not Found"});
});

app.listen(3000);
