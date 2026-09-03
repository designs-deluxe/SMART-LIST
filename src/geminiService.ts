import { GoogleGenAI } from "@google/genai";
import { OrderData, OrderItem } from "./types.ts";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function parseOrderImage(base64ImageOrImages: string | string[]): Promise<Partial<OrderData>> {
  try {
    const images = Array.isArray(base64ImageOrImages) ? base64ImageOrImages : [base64ImageOrImages];
    if (images.length === 0) throw new Error("No images provided for parsing.");

    const parts: any[] = images.map((base64Img) => {
      const mimeMatch = base64Img.match(/^data:(image\/[a-z0-9-+]+|application\/pdf);base64,/i);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const data = base64Img.includes(",") ? base64Img.split(",")[1] : base64Img;
      return {
        inlineData: {
          data,
          mimeType,
        },
      };
    });

    const isMultiPage = images.length > 1;

    const prompt = `Extract all information from ${isMultiPage ? `these ${images.length} order form images/pages` : "this order form image"} and return it as a SINGLE structured JSON object representing one unified order form. 
              
    CRITICAL INSTRUCTIONS:
    1. MULTI-PAGE / MULTI-DOCUMENT UNIFICATION: ${isMultiPage ? "The item list is broken across these uploaded pages/documents. You MUST extract and concatenate ALL items/rows from every page into a single unified 'items' array in exact sequential order. Do not miss any line items from page 2, 3, etc." : "Extract all items into the 'items' array."}
    2. HEADER REPLICATION: Detect the columns in the main items table. Return them in the 'columns' array in the exact order they appear (from left to right). Keep column structure consistent.
    3. COLUMN MAPPING: For each detected column, create a unique 'id' (camelCase). If a column is for item description/name, map its ID to 'description'. If it is for SKU/code, map to 'sku'. If it is for quantity, map to 'quantity'. If it is for unit price/rate, map to 'unitPrice'. If it is for row total/amount, map to 'total'. For any other custom columns, use appropriate camelCase IDs.
    4. DATA EXTRACTION: Map every row across ALL pages into the 'items' array. Each item object must use the 'id's from the columns you defined in step 3 as keys. Make sure numeric and price values are returned as numbers, not strings.
    5. TOTALS: Capture the overall subtotal, vat/tax, discount, and grand total from the document(s) (usually at the bottom of the final page or summary section). Ensure these are returned as numbers.
    6. BRANDING & METADATA: Consolidate supplier/brand name (brandName), cabinet style and color (cabinetStyleColor), project name/order number (orderNumber), orderDate, deliveryDate, billing info (customerDetails), shipping address/info (shippingAddress), paymentMethod, shippingMethod, and termsAndConditions across all pages.
    7. RELIABILITY: If a field is clearly visible, extract it. If missing or unreadable, use "" for strings or 0 for numbers.
    
    Return the data in this exact JSON structure:
    {
      "brandName": "...",
      "cabinetStyleColor": "...",
      "orderNumber": "...",
      "orderDate": "...",
      "deliveryDate": "...",
      "customerDetails": { "name": "...", "phone": "...", "email": "..." },
      "shippingAddress": { "addressLine1": "...", "recipientName": "...", "city": "...", "zip": "...", "state": "..." },
      "columns": [ { "id": "...", "label": "...", "type": "text|number|price" }, ... ],
      "items": [ { "colId1": "...", "colId2": ... }, ... ],
      "paymentMethod": "...",
      "shippingMethod": "...",
      "subTotal": 0,
      "vatTax": 0,
      "discount": 0,
      "grandTotal": 0,
      "termsAndConditions": "..."
    }`;

    parts.push({ text: prompt });

    // Using the models interface as available in this specialized SDK
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          parts,
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = JSON.parse(text);
    console.log("AI parsed result:", parsed);
    return parsed;
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
}

export async function rearrangeCabinetryItemsWithAI(
  items: OrderItem[],
  instruction: string,
  customPrefixes?: Record<string, string[]>
): Promise<{ items: OrderItem[]; summary: string }> {
  try {
    if (!items || items.length <= 1) {
      return { items: items || [], summary: "List has 1 or fewer items; no re-ordering needed." };
    }

    let customPrefixesSection = "";
    if (customPrefixes && Object.keys(customPrefixes).length > 0) {
      const formatted = Object.entries(customPrefixes)
        .filter(([_, list]) => Array.isArray(list) && list.length > 0)
        .map(([cat, list]) => `- ${cat.toUpperCase()}: ${list.join(', ')}`)
        .join('\n');
      if (formatted) {
        customPrefixesSection = `\nUSER CONFIGURED & SAVED CUSTOM PREFIXES (CRITICAL PRIORITY):\nThe user has customized standard cabinet prefixes. You MUST classify items starting with or matching these prefixes into their respective categories:\n${formatted}\n`;
      }
    }

    const prompt = `You are a master cabinetry engineering & millwork scheduling specialist adhering to NKBA and industry cabinet notation standards.

USER INSTRUCTION FOR RE-ARRANGING:
"${instruction}"

CURRENT ITEMS TO RE-ARRANGE (${items.length} items):
${JSON.stringify(items, null, 2)}
${customPrefixesSection}
CABINETRY NOTATION STANDARDS REFERENCE:
1. Base Cabinets: Codes typically start with 'B', 'DB' (Drawer Base), 'SB' (Sink Base), 'BBC' (Blind Base Corner), 'LS' (Lazy Susan), 'FSB' (Farm Sink Base), 'CB' (Corner Base), or items described as base/under-counter units.
2. Wall / Upper Cabinets: Codes typically start with 'W' (e.g., W3030, W3618), 'DCW' (Diagonal Corner Wall), 'MC' (Microwave Wall), 'WDC', or described as upper/wall mounted units.
3. Tall / Pantry / Utility / Oven Cabinets: Codes starting with 'U' (Utility), 'T' (Tall), 'PC' (Pantry Cabinet), 'OC' / 'POC' (Oven Cabinet), or described as full-height pantry/tall units (typically 84", 90", 96" tall).
4. Vanity Cabinets: Codes starting with 'V', 'VS', 'VDB' (bathroom vanity units).
5. Fillers & Moldings / Trim: Codes like 'BF' (Base Filler), 'WF' (Wall Filler), 'TF' (Tall Filler), 'CM' (Crown Molding), 'SM' (Scribe), 'BM' (Base Molding), 'TK' / 'TKM' (Toe Kick), 'LRM' (Light Rail).
6. Panels & Skins: Codes like 'REP' (Refrigerator End Panel), 'BEP' (Base End Panel), 'WEP' (Wall End Panel), 'TEP' (Tall End Panel), 'DWP' (Dishwasher Return Panel), Island Backs, Wainscots, or skins.
7. Accessories & Hardware: Codes like 'ROT' (Roll-out tray), Cutlery dividers, Trash pull-outs, Touch-up kits, Hinges, Knobs, Handles.

TASK:
1. Parse every item in the provided list. Determine its cabinetry category and characteristics (width, type) using its SKU, description, and user configured custom prefixes.
2. Re-order the entire array of items to STRICTLY SATISFY the user's instruction (e.g. if they requested Base -> Wall -> Tall -> Fillers -> Panels, or vice versa, or Wall first, etc.).
3. Retain ALL original item objects and their exact fields ('id', 'sku', 'description', 'quantity', 'unitPrice', 'total', etc.). Do not remove or alter the item data, only rearrange the order of the items in the array.
4. Provide a concise 1-2 sentence summary explaining the cabinetry grouping and order applied.

Return valid JSON in this exact schema:
{
  "summary": "Re-arranged list: Base Cabinets (X) -> Wall Cabinets (Y) -> Tall Pantries (Z) -> Fillers & Moldings (W) -> Panels (V)",
  "items": [
    ... re-ordered items ...
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    if (parsed.items && Array.isArray(parsed.items) && parsed.items.length === items.length) {
      return {
        items: parsed.items,
        summary: parsed.summary || "Items successfully re-arranged according to cabinetry standards.",
      };
    }

    // If counts don't match, map IDs to guarantee no data loss
    if (parsed.items && Array.isArray(parsed.items)) {
      const idMap = new Map(items.map(i => [i.id, i]));
      const ordered: OrderItem[] = [];
      for (const pi of parsed.items) {
        const orig = idMap.get(pi.id);
        if (orig) {
          ordered.push(orig);
          idMap.delete(pi.id);
        }
      }
      // append any unmapped
      for (const remaining of idMap.values()) {
        ordered.push(remaining);
      }
      return {
        items: ordered,
        summary: parsed.summary || "Items re-arranged to match cabinetry standards.",
      };
    }

    throw new Error("Invalid structure returned by AI");
  } catch (err) {
    console.warn("AI re-ordering fallback to local rule engine:", err);
    // Dynamic import / call local cabinetry rule engine with custom prefixes
    const { reorderCabinetItemsLocally } = await import("./cabinetryUtils.ts");
    return reorderCabinetItemsLocally(items, instruction, customPrefixes as any);
  }
}
