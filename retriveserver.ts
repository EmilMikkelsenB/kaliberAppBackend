import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors'; // Import the cors middleware
import { Request, Response } from 'express';

const app = express();
const port = 3001;

app.use(cors());

const pool = mysql.createPool({
    host: 'DESKTOP-FM59SPN',
    user: 'admin',
    password: 'klbr2024',
    database: 'kaliberapp'
});

app.get('/events', async (_: Request, res: Response) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM carddata');
        connection.release();

        res.json(rows);
    } catch (error) {
        console.error('Error fetching data from MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
