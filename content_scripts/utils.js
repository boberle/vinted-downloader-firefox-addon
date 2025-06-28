/*
Extract JSON data from the page html using itemDto.
*/
function extractJsonDataFromHtmlUsingItemDto (htmlContent)  {
    const extractItemDtoData = (str) => {
        const regex = /<script\b[^>]*>self\.__next_f\.push\((.*?)\)<\/script>/gi;
        let match;
        while ((match = regex.exec(str)) !== null) {
            const content = match[1];
            if (content.includes("itemDto")) {
                return content;
            }
        }
        return null;
    }
    const arrayStr = extractItemDtoData(htmlContent)
    if (arrayStr == null) {
        return null;
    }
    const array = JSON.parse(arrayStr)
    let jsonData = null;
    for (let item of array) {
        if (typeof item === "string" && item.includes("itemDto")) {
            const jsonString = item.replace(/^[a-zA-Z0-9]+:/, "");
            jsonData = JSON.parse(jsonString);
            break;
        }
    }
    if (jsonData == null) {
        return null;
    }
    for (let e of jsonData) {
        if (Array.isArray(e)) {
            for (let f of e) {
                if (typeof f === 'object' && f !== null && !Array.isArray(f) && 'itemDto' in f) {
                    return f["itemDto"];
                }
            }
        }
    }
    return null;
}

function extractJsonDataFromHtmlUsingFullSizeUrl (htmlContent) {
    const getItemDict = (data) => {
        if (typeof data === 'object' && !Array.isArray(data) && data.hasOwnProperty('item')) {
            return data['item'];
        }
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item != null && typeof item === 'object') {
                    const res = getItemDict(item);
                    if (res) return res;
                }
            }
        } else if (typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                if (value != null && typeof value === 'object') {
                    const res = getItemDict(value);
                    if (res) return res;
                }
            }
        } else {
            throw new Error("Invalid data type");
        }
        return null;
    }
    const regex = /<script\b[^>]*>self\.__next_f\.push\((.*?)\)<\/script>/gs;
    const matches = htmlContent.matchAll(regex);
    for (const match of matches) {
        if (!match[1].includes('full_size_url')) {
            continue;
        }
        const outerList = JSON.parse(match[1]);
        for (const outerItem of outerList) {
            if (typeof outerItem !== 'string') {
                continue;
            }
            const modified = outerItem.replace(/^[a-zA-Z0-9]+:\[/, '[');
            if (modified !== outerItem) {
                const parsed = JSON.parse(modified);
                const found = getItemDict(parsed);
                if (found) {
                    return found;
                }
            }
        }
    }
    return null;
}


/*
Extract JSON data from the page html trying different methods.
*/
function extractJsonDataFromHtml(htmlContent) {
    let rawJson = extractJsonDataFromHtmlUsingItemDto(htmlContent);
    if (rawJson != null) {
        const data = {
            "id": rawJson?.id,
            "title": rawJson?.title,
            "description": rawJson?.description,
            "seller": rawJson.user?.login,
            "sellerId": rawJson.user?.id,
            "photos": rawJson?.photos?.map(photo => {
                return { id: photo?.id, url: photo?.full_size_url };
            })
        }
        return {rawJson, data};
    }
    rawJson = extractJsonDataFromHtmlUsingFullSizeUrl(htmlContent);
    if (rawJson!= null) {
        const data = {
            "id": rawJson?.id,
            "title": rawJson?.title,
            "description": "?",
            "seller": "?",
            "sellerId": rawJson?.seller_id,
            "photos": rawJson?.photos?.map(photo => (
                { id: photo?.id, url: photo?.full_size_url }
            ))
        }
        return {rawJson, data};
    }
    throw new Error("Failed to extract JSON data from the page.");
}

if (typeof module !== 'undefined') {
    module.exports = { extractJsonDataFromHtml };
}