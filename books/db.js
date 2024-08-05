import pkg from 'pg';

const {Client} = pkg;


export default {
    query: async (query,callBack) => {
        const client = new Client({
            user: process.env.db_user,
            password: process.env.db_password,
            host: process.env.db_host,
            port: process.env.db_port, // default Postgres port
            database: process.env.db_database
        });
        //
        // console.log({
        //     user: process.env.db_user,
        //     password: process.env.db_password,
        //     host: process.env.db_host,
        //     port: process.env.db_port, // default Postgres port
        //     database: process.env.db_database
        // })

        console.log(query)
        let queryResult = undefined
        client.connect().then(() => {

            console.log('Connected to PostgreSQL database');

            // Execute SQL queries here

            client.query(query, (err, result) => {
                if (err) {
                    console.log('Error executing query', err);
                } else {
                    console.log('Query result:', result.rows);
                }
                client
                    .end()
                    .then(() => {
                        console.log('Connection to PostgreSQL closed');
                    })
                    .catch((err) => {
                        console.log('Error closing connection', err);
                    });
                callBack(result)
                // Close the connection when done
            });
        })
        return queryResult;
    }
};