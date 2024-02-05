// apiFetch.ts
import axios from 'axios';
import cheerio from 'cheerio';
import { getDescription } from './getDescription';

interface Event {
    title: string;
    date: string;
    link: string;
    image?: string;
    venue: string;
    linkToInfo?: string;
    joinedText: string;
}

export async function getInfoFromHtml(currentAmount: number): Promise<Event[]> {
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
            return { title, date, link: link || '', image: image || '', venue, joinedText };
        }).get();

        const eventsData = await Promise.all(extractedEvents);

        return eventsData;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

