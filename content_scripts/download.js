(() => {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    /*
    Actually make the download the given data when the user clicks on a button.
     */
    const download = (data, filename, mimeType) => {
        let blob;
        if (data instanceof Blob) {
            blob = data;
        } else {
            blob = new Blob([data], {type: mimeType});
        }
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
            if (typeof item === "string" && item.includes("itemDto")) {
                const jsonString = item.replace(/^[a-zA-Z0-9]+:/, "");
                jsonData = JSON.parse(jsonString);
                break;
            }
        }
        if (jsonData == null) {
            throw new Error("Failed to extract JSON data from the page.");
        }
        return jsonData[1][3]["itemDto"];
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
    Build a tar file in order to download all the images at once.
     */
    const downloadFilesAsTar = async (files) => {
        const encoder = new TextEncoder();
        const tarParts = [];

        function padTo512(data) {
            const extra = 512 - (data.length % 512 || 512);
            const padding = new Uint8Array(extra);
            return new Uint8Array([...data, ...padding]);
        }

        function makeHeader(name, size) {
            const buf = new Uint8Array(512);
            const writeStr = (str, offset, len) => {
                encoder.encodeInto(str.padEnd(len, '\0'), buf.subarray(offset, offset + len));
            };

            writeStr(name, 0, 100);                        // File name
            writeStr('0000777', 100, 8);                   // File mode
            writeStr('0000000', 108, 8);                   // Owner's numeric ID
            writeStr('0000000', 116, 8);                   // Group's numeric ID
            writeStr(size.toString(8).padStart(11, '0'), 124, 12);  // File size in octal
            writeStr(Math.floor(Date.now() / 1000).toString(8), 136, 12); // Mod time
            writeStr('        ', 148, 8);                  // Checksum placeholder
            writeStr('0', 156, 1);                         // Type flag
            writeStr('ustar', 257, 6);                     // UStar magic
            writeStr('00', 263, 2);                        // UStar version

            // Compute checksum
            let checksum = 0;
            for (let i = 0; i < 512; i++) {
                checksum += buf[i];
            }
            const chk = checksum.toString(8).padStart(6, '0') + '\0 ';
            encoder.encodeInto(chk, buf.subarray(148, 156));
            return buf;
        }

        for (const file of files) {
            const response = await fetch(file.url);
            const data = new Uint8Array(await response.arrayBuffer());
            const header = makeHeader(file.name, data.length);
            tarParts.push(header);
            tarParts.push(padTo512(data));
        }

        // Add 2 empty 512-byte blocks to end the TAR
        tarParts.push(new Uint8Array(1024));

        const tarBlob = new Blob(tarParts, { type: 'application/x-tar' });
        download(tarBlob, "vinted-photos.tar");
    }

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

        } else if (message.command === "download-photos-in-one-file") {
            const data = await getCurrentProductPageJsonData();
            if (data === null) {
                throw new Error("No JSON data found for the current product page");
            }
            const productId = data?.id;
            const files = data?.photos?.map(photo => {
                const filename = `vinted-item-${productId}-photo-${photo.id}.jpg`;
                const photoUrl = photo.full_size_url;
                return { name: filename, url: photoUrl };
            })
            await downloadFilesAsTar(files);
        }

    });
})();
