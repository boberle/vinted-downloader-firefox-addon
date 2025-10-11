// MV2 background – open a temp tab to the JSON (real navigation), capture bytes, return to original tab.

const TARGET_PATTERNS = [
    "https://www.vinted.fr/api/v2/*",
    "https://www.vinted.at/api/v2/*",
    "https://www.vinted.be/api/v2/*",
    "https://www.vinted.cz/api/v2/*",
    "https://www.vinted.de/api/v2/*",
    "https://www.vinted.dk/api/v2/*",
    "https://www.vinted.es/api/v2/*",
    "https://www.vinted.fi/api/v2/*",
    "https://www.vinted.hr/api/v2/*",
    "https://www.vinted.hu/api/v2/*",
    "https://www.vinted.it/api/v2/*",
    "https://www.vinted.lt/api/v2/*",
    "https://www.vinted.lu/api/v2/*",
    "https://www.vinted.nl/api/v2/*",
    "https://www.vinted.pl/api/v2/*",
    "https://www.vinted.pt/api/v2/*",
    "https://www.vinted.ro/api/v2/*",
    "https://www.vinted.se/api/v2/*",
    "https://www.vinted.si/api/v2/*",
    "https://www.vinted.sk/api/v2/*",
    "https://www.vinted.com/api/v2/*",
    "https://www.vinted.co.uk/api/v2/*",
];

const tempToOrig = new Map(); // tempTabId -> { origTabId }

browser.runtime.onMessage.addListener(async (msg, sender) => {
    if (msg?.type !== "navigate-and-capture" || !msg.url) return;

    // sender.tab is defined because the message comes from a content script
    const origTabId = sender.tab && sender.tab.id;
    const cookieStoreId = sender.tab && sender.tab.cookieStoreId;

    if (!origTabId) return;

    const createOpts = { url: msg.url, active: false };
    if (cookieStoreId) createOpts.cookieStoreId = cookieStoreId; // same container
    const tempTab = await browser.tabs.create(createOpts);
    tempToOrig.set(tempTab.id, { origTabId });
});

// Capture *all* requests, but only keep those from our temp tab(s).
browser.webRequest.onBeforeRequest.addListener(details => {
    if (!tempToOrig.has(details.tabId)) return;

    try {
        const filter = browser.webRequest.filterResponseData(details.requestId);
        const chunks = [];
        filter.ondata = e => chunks.push(e.data);
        filter.onstop = async () => {
            let total = new Uint8Array(0);
            for (const c of chunks) {
                const next = new Uint8Array(total.length + c.byteLength);
                next.set(total); next.set(new Uint8Array(c), total.length);
                total = next;
            }

            const map = tempToOrig.get(details.tabId);
            tempToOrig.delete(details.tabId);

            try {
                await browser.tabs.sendMessage(map.origTabId, {
                    type: "json-captured",
                    url: details.url,
                    body: total.buffer // ArrayBuffer
                });
            } catch (_) {}

            try { await browser.tabs.remove(details.tabId); } catch (_) {}
            filter.close();
        };
    } catch (_) {}
}, { urls: TARGET_PATTERNS }, ["blocking"]);
