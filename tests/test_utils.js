const fs = require('fs');
const path = require('path');
const { extractJsonDataFromHtml } = require('../content_scripts/utils');

const testDir = path.join(__dirname, 'test_html');

const expectedData = {
    "alex.html": {
        "id": 5421609845,
        "title": "Alexander the Great, Fiona Beddall",
        "description": "?",
        "seller": "?",
        "sellerId": 219004843,
        "photos": [
            {
                "id": 21946642988,
                "url": "https://images1.vinted.net/tc/02_01340_QYxkqEu89zq2F84zTY5EkJzL/1732222983.jpeg?s=fbcdb7b6ae6ad5cf55e759d1e07576e638da44ec"
            },
            {
                "id": 21946642994,
                "url": "https://images1.vinted.net/tc/04_00dbd_Qj7GXHUDEsRcKJ3oFdB5Ychu/1732222983.jpeg?s=87e63b309ec51716b6f6b8aaaa6c8ccd0d3d2aef"
            },
            {
                "id": 21946643002,
                "url": "https://images1.vinted.net/tc/04_01fbb_ZvcPp6Ha7wunXCNoLZCKhYMy/1732222983.jpeg?s=7a78c9af9aa4c5d1303ba649f3a887aa824269fc"
            },
            {
                "id": 21946643007,
                "url": "https://images1.vinted.net/tc/04_0021e_o3TPPWBhc83xSLN7CnRHmFgz/1732222983.jpeg?s=142f760b0ef14f5e0144e813733adc8b29fd9214"
            }
        ]
    },
    "civilisation_romaine_grimal.html": {
        "id": 6588031796,
        "title": "La civilisation romaine",
        "description": "Un peu surligné mais tout le livre est intact\n\n#pierregrimal #Rome #antiquité",
        "seller": "moumou94600",
        "sellerId": 138169293,
        "photos": [
            {
                "id": 26777209535,
                "url": "https://images1.vinted.net/tc/04_00ad8_cyoq6265GphHeTHGbFgJPqMy/1751066672.jpeg?s=ce76b1a8fafd3ab9c6a08c43e184f3f2c88f9522"
            },
            {
                "id": 26777209536,
                "url": "https://images1.vinted.net/tc/01_01127_TuteiojHjRoV6rgEuQ9nedwU/1751066672.jpeg?s=9d48e842c37724ed8c73eae8a43b0b70bc17f006"
            },
            {
                "id": 26777209538,
                "url": "https://images1.vinted.net/tc/04_01e3c_41iLY1VxA6XeCQDapr4WoZNv/1751066672.jpeg?s=ceeb02592b89b9d58062f1376c81c05e7979c8a1"
            }
        ]
    },
    "objectif.html": {
        "id": 6507702138,
        "title": "Objectif CRPE : épreuve orale de leçon français/maths",
        "description": "?",
        "seller": "?",
        "sellerId": 173776110,
        "photos": [
            {
                "id": 26441430722,
                "url": "https://images1.vinted.net/tc/01_007f5_8TzvnuKhwdWzApk1Z8b7WPut/1749821886.jpeg?s=f0a532a1a6909a55af151d486a0e5108c6d0b220"
            }
        ]
    },
    "petit_guide_rome.html": {
        "id": 6554254787,
        "title": "Petit guide Rome",
        "description": "?",
        "seller": "?",
        "sellerId": 11784912,
        "photos": [
            {
                "id": 26636802746,
                "url": "https://images1.vinted.net/tc/02_02265_zp7PCmYxR7rsLBJHxKJRdMwV/1750576628.jpeg?s=a1abd08e0a41ccbc8f0477f0d246a40b1494437e"
            },
            {
                "id": 26636802750,
                "url": "https://images1.vinted.net/tc/01_01b3c_Jet5hbvy2r38D7b693MtAyfg/1750576628.jpeg?s=7f521a31a5629bf984b57cd1bd5bc3e8ba3c19db"
            },
            {
                "id": 26636802753,
                "url": "https://images1.vinted.net/tc/01_00736_icgwK2e37fHS1Ur8XEUMSZAN/1750576628.jpeg?s=54b1f5ccb152540be3476a5f10847a12f5dea53f"
            }
        ]
    },
    "rome_par_les_textes.html": {
        "id": 6560307633,
        "title": "Rome par les textes - Anthologie",
        "description": "Livre neuf, jamais ouvert",
        "seller": "00audrey22",
        "sellerId": 214133145,
        "photos": [
            {
                "id": 26661970676,
                "url": "https://images1.vinted.net/tc/01_01719_vg8Gyos9MU7i1YYZac4n7dfH/1750627728.jpeg?s=bdfb2092866dfe902a92d4275ca2989812b569dd"
            },
            {
                "id": 26661970681,
                "url": "https://images1.vinted.net/tc/01_00a11_QTZStM289LvYsKpR893vzLXk/1750627728.jpeg?s=dc8a55607e477f5b5a3f31d1268841fed5d8dd4d"
            }
        ]
    },
    "uno.html": {
        "id": 6535414510,
        "title": "Jeux de carte Uno Express",
        "description": "Jeux de 56 cartes UNO EXPRESS neuf",
        "seller": "olivier83136",
        "sellerId": 28355102,
        "photos": [
            {
                "id": 26557138632,
                "url": "https://images1.vinted.net/tc/02_019a2_N52NeXZqje8f2ZA8U1R7n32y/1750246697.jpeg?s=bcf3797a28ecaa9a50a34241f6eae6369ca4b365"
            },
            {
                "id": 26557138636,
                "url": "https://images1.vinted.net/tc/03_00864_fkgPkPagyE81wypLsfabkCL8/1750246697.jpeg?s=03a5d9110943fb8a573cd7cd42d6a3a2eb5732d6"
            },
            {
                "id": 26557138642,
                "url": "https://images1.vinted.net/tc/04_0236a_es6HAGq4pKNzT8RNXKKbPWbP/1750246697.jpeg?s=9188ceec88aa1575566c897e02119245ea11fa9d"
            },
            {
                "id": 26557138646,
                "url": "https://images1.vinted.net/tc/02_02367_fyhCPLAhaQkYSFP1jSxFGosB/1750246697.jpeg?s=70b1bb28c328e8304c32c8f54eb49e7524382634"
            },
            {
                "id": 26557138649,
                "url": "https://images1.vinted.net/tc/02_02551_Yj7wfwx7jQ8ZDZ6xGjq2WtVq/1750246697.jpeg?s=ba2a2f34ac030946bbbbc5315f0078e261d86400"
            }
        ]
    },
    "empire_romain.html": {
        id: 6791564867,
        title: "L'empire romain Que sais-je ?",
        description: 'Très bon état !',
        seller: 'mxxnooon',
        sellerId: 24410350,
        photos: [
            {
                id: 27624304282,
                url: 'https://images1.vinted.net/tc/03_00622_WdCbTzUy64XKFf11J3xczS82/1754060921.webp?s=821dafdfc1ec337aca1b0ab08925ec33b9a7cf7a'
            },
            {
                id: 27624304294,
                url: 'https://images1.vinted.net/tc/03_0086d_r5eeHrE2gVeKnx3tYaAYvX1P/1754060921.webp?s=8c735dcb5818832966be11d211e392740eb95433'
            },
            {
                id: 27624304305,
                url: 'https://images1.vinted.net/tc/02_01aa5_NdvYmUxBRpTPsPvQZbcannr6/1754060921.webp?s=b54f1de2e9c0056568e1258dbe94932ba4afc07f'
            }
        ]
    }
}

function deepEqual(a, b) {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
}

fs.readdir(testDir, (err, files) => {
    if (err) {
        console.error('Failed to read test directory:', err);
        return;
    }

    const htmlFiles = files.filter(file => file.endsWith('.html'));

    htmlFiles.forEach(file => {
        const fullPath = path.join(testDir, file);
        const htmlContent = fs.readFileSync(fullPath, 'utf8');

        try {
            const {data} =extractJsonDataFromHtml(htmlContent);
            if (deepEqual(data, expectedData[file])) {
                console.log(`✅ ${file}: Success`);
            } else {
                console.log(`❌ ${file}: Failed expected data`);
            }
        } catch (e) {
            console.error(`❌ ${file}: Failed`, e.message);
        }
    });
});