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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio = require("https://cdn.skypack.dev/cheerio");
var supabase_js_1 = require("https://cdn.skypack.dev/@supabase/supabase-js");
var node_fetch_1 = require("https://cdn.skypack.dev/node-fetch");
console.log("Hello from Functions!");
var SUPABASE_URL = "https://segmbfxpvranvzxfzaao.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZ21iZnhwdnJhbnZ6eGZ6YWFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzE0NzA1MSwiZXhwIjoyMDIyNzIzMDUxfQ.F9ZwvH8GDbeJ6tVEar7z7xLbGY0hauDUe1pNLGaHyHM";
var KLBRDB = Deno.env.get("KLBRDB");
var supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_KEY, KLBRDB);
function fetchEventDetails(linkToInfo) {
    return __awaiter(this, void 0, void 0, function () {
        var descriptionResponse, descriptionHtml, $_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, node_fetch_1.default)(linkToInfo)];
                case 1:
                    descriptionResponse = _a.sent();
                    if (!descriptionResponse.ok)
                        throw new Error("Failed to fetch description");
                    return [4 /*yield*/, descriptionResponse.text()];
                case 2:
                    descriptionHtml = _a.sent();
                    $_1 = cheerio.load(descriptionHtml);
                    return [2 /*return*/, $_1(".et_pb_post_content p")
                            .map(function (i, el) { return $_1(el).text().trim(); })
                            .get()
                            .filter(function (text) {
                            return text && !text.includes("Biljettpris") && !text.includes("Åldersgräns");
                        })
                            .join(" ")];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error fetching event details:", error_1);
                    return [2 /*return*/, ""];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var response, html, $, eventElements, eventData, deleteError, eventDetailsPromises, events, batchSize, i, batch, insertError;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, node_fetch_1.default)("https://www.klbrlive.com/")];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("HTTP error! status: ".concat(response.status));
                    return [4 /*yield*/, response.text()];
                case 2:
                    html = _a.sent();
                    $ = cheerio.load(html);
                    eventElements = $(".et_pb_column.dem_column_grid_view").toArray();
                    eventData = [];
                    console.log("Deleting old data...");
                    return [4 /*yield*/, supabase.from("carddata").delete().neq("id", -1)];
                case 3:
                    deleteError = (_a.sent()).error;
                    if (deleteError) {
                        throw new Error("Error deleting data: ".concat(deleteError.message));
                    }
                    console.log("Processing events...");
                    eventDetailsPromises = eventElements.map(function (element, i) { return __awaiter(_this, void 0, void 0, function () {
                        var link, image, date, title, _a, venue, linkToInfo, joinedText, descriptionResponse, descriptionHtml, description$_1, content, extractedText, formattedExtractedText, error_2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    link = $(element).find('a:contains("Köp biljett")').attr("href") ||
                                        "";
                                    image = $(element).find(".dem_image img").attr("src") || "";
                                    date = $(element).find(".dem_grid_style2_event_date_time_venue span")
                                        .text().trim();
                                    title = $(element).find(".et_pb_module_header.dem_grid_title a")
                                        .text().trim();
                                    _a = ($(element).find(".dem_grid_style2_event_date_time_venue").html() || "")
                                        .split("<br>")
                                        .map(function (part) { return part.trim(); }), venue = _a[1];
                                    linkToInfo = $(element).find("a").attr("href");
                                    joinedText = "";
                                    if (!linkToInfo) return [3 /*break*/, 5];
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 4, , 5]);
                                    return [4 /*yield*/, (0, node_fetch_1.default)(linkToInfo)];
                                case 2:
                                    descriptionResponse = _b.sent();
                                    if (!descriptionResponse.ok) {
                                        throw new Error("HTTP error! status: ".concat(descriptionResponse.status));
                                    }
                                    return [4 /*yield*/, descriptionResponse.text()];
                                case 3:
                                    descriptionHtml = _b.sent();
                                    description$_1 = cheerio.load(descriptionHtml);
                                    description$_1("strong").each(function (index, element) {
                                        // Append a space after the element
                                        description$_1(element).after("  ");
                                    });
                                    content = description$_1(".et_pb_column.et_pb_column_3_5.et_pb_column_1_tb_body.et_pb_css_mix_blend_mode_passthrough.et-last-child");
                                    extractedText = content
                                        .map(function (index, element) {
                                        var paragraphs = description$_1(element).find(".et_pb_module.et_pb_post_content.et_pb_post_content_0_tb_body p");
                                        var processedTextArray = paragraphs.map(function (index, paragraph) {
                                            var text = description$_1(paragraph).text().trim();
                                            if (text !== "" && !text.includes("Biljettpris") &&
                                                !text.includes("Åldersgräns")) {
                                                return text.replace(/\{"description":/g, "").replace(/"/g, "")
                                                    .replace(/}/g, "").trim();
                                            }
                                            else {
                                                return null;
                                            }
                                        }).get().filter(function (text) { return text !== null; });
                                        return processedTextArray.join(" ");
                                    })
                                        .get();
                                    formattedExtractedText = extractedText.join(" ");
                                    joinedText = formattedExtractedText;
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_2 = _b.sent();
                                    console.error("Error fetching description for event", i, ":", error_2);
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/, {
                                        id: i + 1,
                                        title: title,
                                        date: date,
                                        link: link,
                                        image: image,
                                        venue: venue,
                                        joinedText: joinedText,
                                    }];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(eventDetailsPromises)];
                case 4:
                    events = _a.sent();
                    console.log("Inserting events into Supabase...");
                    batchSize = 10;
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < events.length)) return [3 /*break*/, 8];
                    batch = events.slice(i, i + batchSize);
                    return [4 /*yield*/, supabase.from("carddata").insert(batch)];
                case 6:
                    insertError = (_a.sent()).error;
                    if (insertError) {
                        console.error("Error inserting batch ".concat(i, ":"), insertError.message);
                    }
                    _a.label = 7;
                case 7:
                    i += batchSize;
                    return [3 /*break*/, 5];
                case 8:
                    console.log("All events processed successfully.");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) { return console.error(error); });
