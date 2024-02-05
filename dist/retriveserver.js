"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promise_1 = __importDefault(require("mysql2/promise"));
const cors_1 = __importDefault(require("cors")); // Import the cors middleware
const app = (0, express_1.default)();
const port = 3001;
app.use((0, cors_1.default)());
const pool = promise_1.default.createPool({
    host: 'DESKTOP-FM59SPN',
    user: 'admin',
    password: 'klbr2024',
    database: 'kaliberapp'
});
app.get('/events', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield pool.getConnection();
        const [rows] = yield connection.query('SELECT * FROM carddata');
        connection.release();
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching data from MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
