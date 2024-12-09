import * as cheerio from "https://cdn.skypack.dev/cheerio";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";
import fetch from "https://cdn.skypack.dev/node-fetch";

console.log("Hello from Functions!");

const SUPABASE_URL = "https://segmbfxpvranvzxfzaao.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZ21iZnhwdnJhbnZ6eGZ6YWFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzE0NzA1MSwiZXhwIjoyMDIyNzIzMDUxfQ.F9ZwvH8GDbeJ6tVEar7z7xLbGY0hauDUe1pNLGaHyHM";
const KLBRDB = Deno.env.get("KLBRDB");

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  KLBRDB,
);

interface Event {
  title?: string;
  date?: string;
  link?: string;
  image?: string;
  id?: number;
  venue: string;
  linkToInfo?: string;
  joinedText: string;
}

async function fetchEventDetails(linkToInfo: string): Promise<string> {
  try {
    const descriptionResponse = await fetch(linkToInfo);
    if (!descriptionResponse.ok) throw new Error("Failed to fetch description");
    const descriptionHtml = await descriptionResponse.text();
    const $ = cheerio.load(descriptionHtml);
    return $(".et_pb_post_content p")
      .map((i, el) => $(el).text().trim())
      .get()
      .filter((text) =>
        text && !text.includes("Biljettpris") && !text.includes("Åldersgräns")
      )
      .join(" ");
  } catch (error) {
    console.error("Error fetching event details:", error);
    return "";
  }
}

async function main() {
  const response = await fetch("https://www.klbrlive.com/");
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);

  const eventElements = $(".et_pb_column.dem_column_grid_view").toArray();
  const eventData: Event[] = []; // Renamed this variable to avoid conflict

  console.log("Deleting old data...");
  const { error: deleteError } = await supabase.from("carddata").delete().neq(
    "id",
    -1,
  );
  if (deleteError) {
    throw new Error(`Error deleting data: ${deleteError.message}`);
  }

  console.log("Processing events...");
  const eventDetailsPromises = eventElements.map(async (element, i) => {
    const link = $(element).find('a:contains("Köp biljett")').attr("href") ||
      "";
    const image = $(element).find(".dem_image img").attr("src") || "";
    const date = $(element).find(".dem_grid_style2_event_date_time_venue span")
      .text().trim();
    const title = $(element).find(".et_pb_module_header.dem_grid_title a")
      .text().trim();
    const [, venue] =
      ($(element).find(".dem_grid_style2_event_date_time_venue").html() || "")
        .split("<br>")
        .map((part) => part.trim());

    const linkToInfo = $(element).find("a").attr("href");

    let joinedText = "";

    if (linkToInfo) {
      try {
        const descriptionResponse = await fetch(linkToInfo);
        if (!descriptionResponse.ok) {
          throw new Error(`HTTP error! status: ${descriptionResponse.status}`);
        }
        const descriptionHtml = await descriptionResponse.text();
        const description$ = cheerio.load(descriptionHtml);
        description$("strong").each(
          (index: number, element: CheerioElement) => {
            // Append a space after the element
            description$(element).after("  ");
          },
        );
        const content = description$(
          ".et_pb_column.et_pb_column_3_5.et_pb_column_1_tb_body.et_pb_css_mix_blend_mode_passthrough.et-last-child",
        );
        const extractedText: string[] = content
          .map((index: number, element: Element) => {
            const paragraphs = description$(element).find(
              ".et_pb_module.et_pb_post_content.et_pb_post_content_0_tb_body p",
            );

            const processedTextArray: string[] = paragraphs.map(
              (index: number, paragraph: Element) => {
                const text = description$(paragraph).text().trim();
                if (
                  text !== "" && !text.includes("Biljettpris") &&
                  !text.includes("Åldersgräns")
                ) {
                  return text.replace(/\{"description":/g, "").replace(/"/g, "")
                    .replace(/}/g, "").trim();
                } else {
                  return null;
                }
              },
            ).get().filter((text: string | null) => text !== null);

            return processedTextArray.join(" ");
          })
          .get();

        const formattedExtractedText = extractedText.join(" ");
        joinedText = formattedExtractedText;
      } catch (error) {
        console.error("Error fetching description for event", i, ":", error);
      }
    }
    return {
      id: i + 1,
      title,
      date,
      link,
      image,
      venue,
      joinedText,
    };
  });

  // Wait for all event details to be fetched in parallel
  const events = await Promise.all(eventDetailsPromises);

  console.log("Inserting events into Supabase...");
  const batchSize = 10;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const { error: insertError } = await supabase.from("carddata").insert(
      batch,
    );
    if (insertError) {
      console.error(`Error inserting batch ${i}:`, insertError.message);
    }
  }

  console.log("All events processed successfully.");
}

main().catch((error) => console.error(error));
