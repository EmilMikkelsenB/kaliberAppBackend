"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = __importStar(require("https://cdn.skypack.dev/cheerio"));
const supabase_js_1 = require("https://cdn.skypack.dev/@supabase/supabase-js");
console.log("Hello from Functions!");
const supabase = (0, supabase_js_1.createClient)(Deno.env.get("SUPABASE_URL"), Deno.env.get('KLBRDB'));
try {
    const response = await fetch('https://www.klbrlive.com/');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const eventElements = $('.et_pb_column.dem_column_grid_view').toArray();
    const events = []; // Array to store events
    const { data: deleteData, error: deleteError } = await supabase
        .from('carddata')
        .delete()
        .gt('title', 0);
    // Process each event element
    for (let i = 0; i < eventElements.length; i++) {
        const element = eventElements[i];
        const ticketLinkElement = $(element).find('a:contains("Köp biljett")');
        const link = ticketLinkElement.length > 0 ? ticketLinkElement.attr('href') || '' : '';
        const image = $(element).find('.dem_image img').attr('src');
        const date = $(element).find('.dem_grid_style2_event_date_time_venue span').text();
        const title = $(element).find('.et_pb_module_header.dem_grid_title a').text();
        const dateAndVenue = $(element).find('.dem_grid_style2_event_date_time_venue').html();
        const linkToInfo = $(element).find('a').attr('href');
        let joinedText = '';
        if (linkToInfo) {
            try {
                const descriptionResponse = await fetch(linkToInfo);
                if (!descriptionResponse.ok) {
                    throw new Error(`HTTP error! status: ${descriptionResponse.status}`);
                }
                const descriptionHtml = await descriptionResponse.text();
                const description$ = cheerio.load(descriptionHtml);
                const content = description$('.et_pb_column.et_pb_column_3_5.et_pb_column_1_tb_body.et_pb_css_mix_blend_mode_passthrough.et-last-child');
                const extractedText = content
                    .map((index, element) => {
                        const paragraphs = description$(element).find(".et_pb_module.et_pb_post_content.et_pb_post_content_0_tb_body p");
                        const filteredParagraphs = paragraphs.filter((_, paragraph) => {
                            const text = description$(paragraph).text().trim();
                            return text !== '' && !text.includes('Biljettpris') || !text.includes('Åldersgräns');
                        });
                        const filteredParagraphsArray = filteredParagraphs.toArray();
                        const processedTextArray = [];
                        filteredParagraphsArray.forEach((paragraph) => {
                            const processedText = description$(paragraph).text().replace(/\{"description":/g, '').replace(/"/g, '').replace(/}/g, '').trim();
                            processedTextArray.push(processedText);
                        });
                        if (processedTextArray.length >= 2) {
                            return processedTextArray[0];
                        }
                        else {
                            return "Ingen beskrivning";
                        }
                    })
                    .get();
                joinedText = extractedText.join(' ');
            }
            catch (error) {
                console.error('Error fetching description for event', i, ':', error);
            }
        }
        const [, venue] = ((dateAndVenue === null || dateAndVenue === void 0 ? void 0 : dateAndVenue.split('<br>')) || ['', '']).map((part) => part.trim());
        // Push event to the array
        events.push({ title, date, link: link || '', image: image || '', venue, linkToInfo: linkToInfo || '', joinedText });
    }
    console.log(`Total events found: ${events.length}`);
    // Insert events into Supabase sequentially
    for (let i = 0; i < events.length; i++) {
        try {
            const event = events[i];
            // Insert event into Supabase
            const { error: insertError } = await supabase
                .from('carddata')
                .insert([{
                    title: event.title,
                    date: event.date,
                    link: event.link,
                    image: event.image,
                    venue: event.venue,
                    joinedText: event.joinedText
                }]);
            if (insertError) {
                throw new Error(`Error inserting event ${i + 1} into Supabase ${insertError.message}`);
            }
            console.log(`Event ${i + 1} inserted into Supabase successfully.`);
        }
        catch (error) {
            console.error(error);
        }
    }
    console.log('All events processed and inserted into Supabase successfully.');
}
catch (error) {
    console.error('Error fetching data:', error);
}
