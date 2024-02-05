import axios from 'axios';
import cheerio from 'cheerio';
import { Element } from 'cheerio';

interface Event {
    description: string;
    descriptionFinished: string;

}

export async function getDescription(linkToDescription: string): Promise<string> {
    try {
        const response = await axios.get(linkToDescription);
        const html = response.data;
        const $ = cheerio.load(html);

        const content = $('.et_pb_column.et_pb_column_3_5.et_pb_column_1_tb_body.et_pb_css_mix_blend_mode_passthrough.et-last-child');
        const extractedText: string[] = content
            .map((index: number, element: Element) => {
                const paragraphs = $(element).find(".et_pb_module.et_pb_post_content.et_pb_post_content_0_tb_body p").slice(0, 7);

                // Use filter to exclude paragraphs containing 'pris'
                const filteredParagraphs = paragraphs.filter((_, paragraph) => !$(paragraph).text().includes('Biljettpris'));

                // Convert the filtered paragraphs to an array
                const filteredParagraphsArray = filteredParagraphs.toArray();

                // Process the remaining paragraphs
                const processedTextArray: string[] = [];
                filteredParagraphsArray.forEach((paragraph) => {
                    const processedText = $(paragraph).text().replace(/\{"description":/g, '').replace(/"/g, '').replace(/}/g, '').trim();
                    processedTextArray.push(processedText);
                });

                if (processedTextArray.length >= 2) {
                    // Return the second processed paragraph
                    return processedTextArray[0];
                } else {
                    // Handle the case where there is no second paragraph
                    return "No second paragraph found.";
                }
            })
            .get();

        const joinedText: string = extractedText.join(' ');

        return joinedText;
    } catch (error) {
        console.error("Error:", error);
        return "Error";

    }
}