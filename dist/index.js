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
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const getDescrption_1 = require("./getDescrption");
const mongodb_1 = require("mongodb");
const app = (0, express_1.default)();
const port = 3000;
const uri = "mongodb+srv://emilAdmin:TzKPVGmLcElAvaKm@kaliberapp.xyuxg8k.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
function getInfoFromHtml(currentAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get('https://www.klbrlive.com/');
            const html = response.data;
            const $ = cheerio_1.default.load(html);
            const extractedEvents = $('.et_pb_column.dem_column_grid_view').slice(0, currentAmount).map((index, element) => __awaiter(this, void 0, void 0, function* () {
                const ticketLinkElement = $(element).find('a:contains("Köp biljett")');
                const link = ticketLinkElement.length > 0 ? ticketLinkElement.attr('href') || '' : '';
                const image = $(element).find('.dem_image img').attr('src');
                const date = $(element).find('.dem_grid_style2_event_date_time_venue span').text();
                const title = $(element).find('.et_pb_module_header.dem_grid_title a').text();
                const dateAndVenue = $(element).find('.dem_grid_style2_event_date_time_venue').html();
                const linkToInfo = $(element).find('a').attr('href');
                let joinedText = '';
                if (linkToInfo) {
                    joinedText = yield (0, getDescrption_1.getDescription)(linkToInfo);
                }
                const [, venue] = ((dateAndVenue === null || dateAndVenue === void 0 ? void 0 : dateAndVenue.split('<br>')) || ['', '']).map((part) => part.trim());
                return { title, date, link: link || '', image: image || '', venue, linkToInfo: linkToInfo || '', joinedText };
            })).get();
            const eventsData = yield Promise.all(extractedEvents);
            function run() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield client.connect();
                        const database = client.db('kaliberDB'); // Replace 'yourDatabaseName' with the actual database name
                        const collection = database.collection('carddata');
                        // Insert data into the 'carddata' collection
                        yield collection.insertMany(eventsData);
                        console.log("Data inserted into MongoDB collection 'carddata' successfully!");
                    }
                    finally {
                        yield client.close();
                    }
                });
            }
            run().catch(console.dir);
            console.log(eventsData);
            console.log('All data inserted into Supabase successfully.');
            return eventsData;
        }
        catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    });
}
getInfoFromHtml(100);
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
