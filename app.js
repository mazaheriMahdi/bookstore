import bodyParser from "body-parser";
import express from "express";
import db from "./books/db.js"
const app = express();
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
// Swagger set up
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Library API",
            version: "1.0.0",
            description: "API documentation for the Library system",
        },
        servers: [
            {
                url: "https://bookstore.abriment.com:3000",
            },
        ],
    },
    apis: ["./app.js"], // Files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static("images"));
app.use(bodyParser.json());


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
/**
 * @swagger
 * /books:
 *   get:
 *     summary: Retrieve a list of books
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: The page number
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *         required: false
 *         description: The number of items per page
 *       - in: query
 *         name: book_title
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by book title
 *       - in: query
 *         name: book_author
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by book author
 *       - in: query
 *         name: year_of_publication
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by year of publication
 *       - in: query
 *         name: publisher
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by publisher
 *       - in: query
 *         name: isbn
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by ISBN
 *     responses:
 *       200:
 *         description: A list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       isbn:
 *                         type: string
 *                       book_title:
 *                         type: string
 *                       book_author:
 *                         type: string
 *                       year_of_publication:
 *                         type: integer
 *                       publisher:
 *                         type: string
 *                       image_url_s:
 *                         type: string
 *                       image_url_m:
 *                         type: string
 *                       image_url_l:
 *                         type: string
 *                 current_page_number:
 *                   type: integer
 *                 pages:
 *                   type: number
 *       422:
 *         description: Missing query string parameter 'page'
 *       500:
 *         description: Internal Server Error
 */
app.get("/books", async (req, res) => {
    if (req.query.page == null) {
        res.status(422).json({error: "missing query string parameter 'page'"});
    }
    try {
        await db.query(build_query(req), (result) => {
            db.query("SELECT COUNT(id) FROM book_metadata;", (count) => {
                res.status(200).json({
                    books: result?.rows,
                    current_page_number: req?.query?.page,
                    pages: (count.rows[0].count) / (req.query[pageSizeQueryParamName] || pageCapacity)
                });
            })
        })

    } catch (e) {
        console.log(e);
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


/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isbn:
 *                 type: string
 *               book_title:
 *                 type: string
 *               book_author:
 *                 type: string
 *               year_of_publication:
 *                 type: integer
 *               publisher:
 *                 type: string
 *               image_url_s:
 *                 type: string
 *               image_url_m:
 *                 type: string
 *               image_url_l:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created book
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     isbn:
 *                       type: string
 *                     book_title:
 *                       type: string
 *                     book_author:
 *                       type: string
 *                     year_of_publication:
 *                       type: integer
 *                     publisher:
 *                       type: string
 *                     image_url_s:
 *                       type: string
 *                     image_url_m:
 *                       type: string
 *                     image_url_l:
 *                       type: string
 *       422:
 *         description: Missing body or fields
 *       500:
 *         description: Internal Server Error
 */
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
