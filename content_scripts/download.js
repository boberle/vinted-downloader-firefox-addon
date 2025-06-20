(() => {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    /*
    Actually make the download the given data when the user clicks on a button.
     */
    const download = (data, filename, mimeType) => {
        const blob = new Blob([data], {type: mimeType});
        const link = document.createElement("a");
        link.download = filename;
        link.href = window.URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /*
    Get the html of the current product page.
    */
    const getCurrentProductPageHtml = async () => {
        const response = await fetch(window.location.href);
        return await response.text();
    }

    /*
    Extract JSON data from the current page html.
    */
    const getCurrentProductPageJsonData = async () => {
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
        const htmlContent = await getCurrentProductPageHtml();

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

        throw new Error("Failed to extract JSON data from the page.");
    }

    /*
    Get the URL of the JSON containing the conversation data.
     */
    const getConversationUrl = () => {
        const conversationId = window.location.href.match(/\d+/).pop();
        const tld = window.location.host
            .match(/\.[a-z]+$/)
            .pop()
            .slice(1);
        const conversationUrl = `https://www.vinted.${tld}/api/v2/conversations/${conversationId}`;
        return [conversationId, conversationUrl, tld];
    };

    /*
    Respond to messages from the popup (the user has clicked on a download button).
     */
    browser.runtime.onMessage.addListener(async (message) => {
        if (message.command === "download-conversation") {
            const [conversationId, conversationUrl] = getConversationUrl();
            const filename = `vinted-conversation-${conversationId}.json`;
            const fetched = await fetch(conversationUrl);
            const data = await fetched.text();
            download(data, filename, "application/json");

        } else if (message.command === "download-shipment") {
            const [conversationId, conversationUrl, tld] = getConversationUrl();
            const fetched = await fetch(conversationUrl);
            const data = await fetched.json();
            const shipmentId = data?.conversation?.transaction?.id;
            if (shipmentId) {
                const filename = `vinted-conversation-${conversationId}-shipment.json`;
                const shipmentUrl = `https://www.vinted.${tld}/api/v2/transactions/${shipmentId}/shipment/journey_summary`;
                const shipmentFetched = await fetch(shipmentUrl);
                const shipmentData = await shipmentFetched.text();
                download(shipmentData, filename, "application/json");
            } else {
                throw new Error("No shipment ID found");
            }

        } else if (message.command === "download-images") {
            const [conversationId, conversationUrl] = getConversationUrl();
            const fetched = await fetch(conversationUrl);
            const data = await fetched.json();
            data?.conversation?.messages?.forEach(message => {
                message.entity?.photos?.forEach(async photo => {
                    const filename = `vinted-conversation-${conversationId}-photo-${photo.id}.jpg`;
                    const photoUrl = photo.full_size_url;
                    const photoFetched = await fetch(photoUrl);
                    const photoData = await photoFetched.arrayBuffer();
                    download(photoData, filename, "image/jpeg");
                })
            })

        } else if (message.command === "download-product") {
            const data = await getCurrentProductPageJsonData();
            if (data === null) {
                throw new Error("No JSON data found for the current product page");
            }
            const productId = data?.id;
            const filename = `vinted-item-${productId}.json`;
            download(JSON.stringify(data), filename, "application/json");

        } else if (message.command === "download-summary") {
            const data = await getCurrentProductPageJsonData();
            if (data === null) {
                throw new Error("No JSON data found for the current product page");
            }
            const productId = data?.id;
            const filename = `vinted-item-${productId}-summary.txt`;
            const summary = (
                `id: ${productId}\n` +
                `source: ${window.location.href}\n` +
                `title: ${data?.title}\n` +
                //`description: ${data.description}\n` +
                //`seller: ${data.user?.login}\n` +
                //`seller id: ${data.user?.id}`
                `seller id: ${data.seller_id}`
            )
            download(summary, filename, "text/plain");

        } else if (message.command === "download-photos") {
            const data = await getCurrentProductPageJsonData();
            if (data === null) {
                throw new Error("No JSON data found for the current product page");
            }
            const productId = data?.id;
            data?.photos?.forEach(async photo => {
                const filename = `vinted-item-${productId}-photo-${photo.id}.jpg`;
                const photoUrl = photo.full_size_url;
                const photoFetched = await fetch(photoUrl);
                const photoData = await photoFetched.arrayBuffer();
                download(photoData, filename, "image/jpeg");
            })
        }

    });
})();
