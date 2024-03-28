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
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
function getDescription(linkToDescription) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(linkToDescription);
            const html = response.data;
            const $ = cheerio_1.default.load(html);
            const content = $('.et_pb_column.et_pb_column_3_5.et_pb_column_1_tb_body.et_pb_css_mix_blend_mode_passthrough.et-last-child');
            const extractedText = content
                .map((index, element) => {
                const paragraphs = $(element).find(".et_pb_module.et_pb_post_content.et_pb_post_content_0_tb_body p").slice(0, 7);
                // Use filter to exclude paragraphs containing 'pris'
                const filteredParagraphs = paragraphs.filter((_, paragraph) => !$(paragraph).text().includes('Biljettpris'));
                // Convert the filtered paragraphs to an array
                const filteredParagraphsArray = filteredParagraphs.toArray();
                // Process the remaining paragraphs
                const processedTextArray = [];
                filteredParagraphsArray.forEach((paragraph) => {
                    const processedText = $(paragraph).text().replace(/\{"description":/g, '').replace(/"/g, '').replace(/}/g, '').trim();
                    processedTextArray.push(processedText);
                });
                if (processedTextArray.length >= 2) {
                    // Return the second processed paragraph
                    return processedTextArray[0];
                }
                else {
                    // Handle the case where there is no second paragraph
                    return "No second paragraph found.";
                }
            })
                .get();
            const joinedText = extractedText.join(' ');
            return joinedText;
        }
        catch (error) {
            console.error("Error:", error);
            return "Error";
        }
    });
}
