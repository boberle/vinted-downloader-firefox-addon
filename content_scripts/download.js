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
        const htmlContent = await getCurrentProductPageHtml();
        const arrayStr = extractItemDtoData(htmlContent)
        if (arrayStr == null) {
            return null;
        }
        const array = JSON.parse(arrayStr)
        let jsonData = null;
        for (let item of array) {
            if (typeof item === "string" && item.startsWith("c:")) {
                jsonData = JSON.parse(item.slice(2));
                break;
            }
        }
        return jsonData[0][3]["itemDto"];
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
        const conversationUrl = `https://www.vinted.${tld}/web/api/core/conversations/${conversationId}`;
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
                const shipmentUrl = `https://www.vinted.${tld}/web/api/core/transactions/${shipmentId}/shipment/journey_summary`;
                const shipmentFetched = await fetch(shipmentUrl);
                const shipmentData = await shipmentFetched.text();
                download(shipmentData, filename, "application/json");
            } else {
                throw new Error("No shipment ID found");
            }

        } else if (message.command === "download-images") {
            const [conversationId, conversationUrl, tld] = getConversationUrl();
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
                `description: ${data.description}\n` +
                `seller: ${data.user?.login}\n` +
                `seller id: ${data.user?.id}`
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
