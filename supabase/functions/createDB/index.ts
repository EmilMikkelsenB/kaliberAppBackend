import * as cheerio from 'https://cdn.skypack.dev/cheerio';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import fetch from 'https://cdn.skypack.dev/node-fetch';

console.log("Hello from Functions!");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get('KLBRDB'));


interface Event {
    title: string;
    date: string;
    link: string;
    image?: string;
    venue: string;
    linkToInfo?: string;
    joinedText: string;
    id?: number;
}

async function main() {
    console.log("Deleting data");
    const { data: deleteData, error: deleteError } = await supabase
        .from('carddata')
        .delete()
        .neq('id', -1); // Delete all rows

    if (deleteError) {
        throw new Error(`Error deleting data: ${deleteError.message}`);
    }

    const response = await fetch('https://www.klbrlive.com/');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const eventElements = $('.et_pb_column.dem_column_grid_view').toArray();
    const events: Event[] = []; // Array to store events

    console.log("Processing Elements");

    // Process each event element sequentially
    for (let i = 0; i < eventElements.length; i++) {
        const element = eventElements[i];
        const ticketLinkElement = $(element).find('a:contains("Köp biljett")');
        const link = ticketLinkElement.length > 0 ? ticketLinkElement.attr('href') || '' : '';
        const image = $(element).find('.dem_image img').attr('src');
        const date = $(element).find('.dem_grid_style2_event_date_time_venue span').text();
        const title = $(element).find('.et_pb_module_header.dem_grid_title a').text();
        const dateAndVenue = $(element).find('.dem_grid_style2_event_date_time_venue').html();
        const linkToInfo = $(element).find('a').attr('href');
        let id = i + 1; // Generate a unique id for each event
        let joinedText = '';

        if (linkToInfo) {
            try {
                const descriptionResponse = await fetch(linkToInfo);
                if (!descriptionResponse.ok) {
                    throw new Error(`HTTP error! status: ${descriptionResponse.status}`);
                }
                const descriptionHtml = await descriptionResponse.text();
                const description$ = cheerio.load(descriptionHtml);
                description$('strong').each((index: number, element: CheerioElement) => {
                    // Append a space after the element
                    description$(element).after(' ');
                });
                const content = description$('.et_pb_column.et_pb_column_3_5.et_pb_column_1_tb_body.et_pb_css_mix_blend_mode_passthrough.et-last-child');
                const extractedText: string[] = content
                    .map((index: number, element: Element) => {
                        const paragraphs = description$(element).find(".et_pb_module.et_pb_post_content.et_pb_post_content_0_tb_body p");

                        const processedTextArray: string[] = paragraphs.map((index: number, paragraph: Element) => {
                            const text = description$(paragraph).text().trim();
                            if (text !== '' && !text.includes('Biljettpris') && !text.includes('Åldersgräns')) {
                                return text.replace(/\{"description":/g, '').replace(/"/g, '').replace(/}/g, '').trim();
                            } else {
                                return null;
                            }
                        }).get().filter((text: string | null) => text !== null);

                        return processedTextArray.join(' ');
                    })
                    .get();

                const formattedExtractedText = extractedText.join(' ');
                joinedText = formattedExtractedText; 

            } catch (error) {
                console.error('Error fetching description for event', i, ':', error);
            }
        }

        const [, venue] = (dateAndVenue?.split('<br>') || [' ', ' ']).map((part) => part.trim());

        // Insert event into Supabase
        console.log(`Processing event ${i + 1}`);
        
        const { error: insertError } = await supabase
            .from('carddata')
            .insert([{
                id, // Assign the generated unique id
                title,
                date,
                link: link || '',
                image: image || '',
                venue,
                joinedText
            }]);
        if (insertError) {
            throw new Error(`Error inserting event ${i + 1} into Supabase: ${insertError.message}`);
        }
        console.log(`Event ${i + 1} inserted into Supabase successfully.`);
    }

    console.log('All events processed and inserted into Supabase successfully.');
}

main().catch(error => console.error(error));
