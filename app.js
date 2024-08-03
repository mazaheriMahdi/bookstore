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

const pageSizeQueryParamName = "page_size";
const pageCapacity = 10;

function build_query(req) {
    if (!isFilterable(req.query)) {
        return `SELECT * FROM public.book_metadata ORDER BY id LIMIT ${(req.query[pageSizeQueryParamName] || pageCapacity)} OFFSET ${(req.query[pageSizeQueryParamName] || pageCapacity)*req.query.page} ;`
    } else {
        const query = Object.keys(req.query).filter(x => filterable_fields.includes(x)).map(x => {
            return `${x} LIKE '%${req.query[x]}%'`;
        }).reduce((previousValue, currentValue) => {
            return previousValue + " AND " + currentValue;
        })
        return `SELECT * FROM public.book_metadata WHERE ${query} ORDER BY id LIMIT ${req.query[pageSizeQueryParamName] || pageCapacity} OFFSET ${(req.query[pageSizeQueryParamName] || pageCapacity)*req.query.page} ;`
    }
}

app.get("/books", async (req, res) => {
    if (req.query.page == null) {
        res.status(422).json({error: "missing query string parameter 'page'"});
    }
    try {
        await db.query(build_query(req), (result) => {
            db.query("SELECT COUNT(id) FROM book_metadata;", (count) => {
                res.status(200).json({
                    books: result.rows,
                    current_page_number: req.query.page,
                    pages: (count.rows[0].count) / (req.query[pageSizeQueryParamName] || pageCapacity)
                });
            })
        })

    } catch (e) {
        console.error(e);
        res.status(500).send('Internal Server Error');
    }

})


const bookFields = [
    "isbn",
    "book_title",
    "book_author",
    "year_of_publication",
    "publisher",
    "image_url_s",
    "image_url_m",
    "image_url_l"]
app.post("/books", async (req, res) => {
    if (req.body == null) {
        res.status(422).json({error: "missing body"});
    }

    const missingFields = bookFields.filter((x) => !req.body[x])
    if (missingFields.length > 0) {
        res.status(422).json({error: `missing fields ${missingFields.join(" ")}`});
    }

    await db.query(`INSERT INTO public.book_metadata(isbn, book_title, book_author, year_of_publication, publisher, image_url_s, image_url_m, image_url_l) VALUES (${bookFields.map(x=>req.body[x])});`, (x) => {
        res.status(200).json({error: "missing book_metadata", result: x});
    })
})

// 404
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }
    res.status(404).json({message: "404 - Not Found"});
});

app.listen(3000);
