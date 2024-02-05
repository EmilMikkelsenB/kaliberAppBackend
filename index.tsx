import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import { getDescription } from './getDescrption';
import { MongoClient, ServerApiVersion } from 'mongodb';


const app = express();
const port = 3000;

interface Event {
    title: string;
    date: string;
    link: string;
    image?: string;
    venue: string;
    linkToInfo?: string;
    joinedText: string;
}

const uri = "mongodb+srv://emilAdmin:TzKPVGmLcElAvaKm@kaliberapp.xyuxg8k.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function getInfoFromHtml(currentAmount: number): Promise<Event[]> {
    try {
        const response = await axios.get('https://www.klbrlive.com/');
        const html = response.data;
        const $ = cheerio.load(html);

        const extractedEvents: Promise<Event>[] = $('.et_pb_column.dem_column_grid_view').slice(0, currentAmount).map(async (index, element) => {
            const ticketLinkElement = $(element).find('a:contains("Köp biljett")');
            const link = ticketLinkElement.length > 0 ? ticketLinkElement.attr('href') || '' : '';
            const image = $(element).find('.dem_image img').attr('src');
            const date = $(element).find('.dem_grid_style2_event_date_time_venue span').text();
            const title = $(element).find('.et_pb_module_header.dem_grid_title a').text();
            const dateAndVenue = $(element).find('.dem_grid_style2_event_date_time_venue').html();
            const linkToInfo = $(element).find('a').attr('href');

            let joinedText = '';
            if (linkToInfo) {
                joinedText = await getDescription(linkToInfo);
            }

            const [, venue] = (dateAndVenue?.split('<br>') || ['', '']).map((part) => part.trim());
            return { title, date, link: link || '', image: image || '', venue, linkToInfo: linkToInfo || '', joinedText };
        }).get();

        const eventsData = await Promise.all(extractedEvents);

        async function run() {
            try {
                await client.connect();
                const database = client.db('kaliberDB'); // Replace 'yourDatabaseName' with the actual database name
                const collection = database.collection('carddata');

                // Insert data into the 'carddata' collection
                await collection.insertMany(eventsData);

                console.log("Data inserted into MongoDB collection 'carddata' successfully!");
            } finally {
                await client.close();
            }
        }
        run().catch(console.dir);

        console.log(eventsData)

        return eventsData;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}
getInfoFromHtml(100);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
