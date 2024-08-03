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
const filterable_fields = ["book_title", "book_author", "year_of_publication", 'publisher', "isbn"];

function isFilterable(queryParams) {
    console.log("queryyyyy param =>" + Object.keys(queryParams))
    for (const x of Object.keys(queryParams)) {
        if (filterable_fields.includes(x)) {
            return true;
        }
    }
    return false

}

function build_query(req) {
    if (!isFilterable(req.query)) {
        return `SELECT * FROM public.book_metadata ORDER BY id LIMIT 10 OFFSET ${10*req.query.page} ;`
    } else {
        const query = Object.keys(req.query).filter(x => filterable_fields.includes(x)).map(x => {
            return `${x} LIKE '%${req.query[x]}%'`;
        }).reduce((previousValue, currentValue) => {
            return previousValue + " AND " + currentValue;
        })
        return `SELECT * FROM public.book_metadata WHERE ${query} ORDER BY id LIMIT 10 OFFSET ${10*req.query.page} ;`
    }
}

app.get("/books", async (req, res) => {
    if (req.query.page == null) {
        res.status(422).json({error: "missing query string parameter 'page'"});
    }
    try {
        db.query(build_query(req), (result) => {
            db.query("SELECT COUNT(id) FROM book_metadata;", (count) => {
                res.status(200).json({books: result.rows, current_page_number: req.query.page, pages: count.rows[0]});
            })
        })

    } catch (e) {
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
})

// 404
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }
    res.status(404).json({message: "404 - Not Found"});
});

app.listen(3000);
