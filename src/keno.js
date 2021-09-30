const firebase = require("firebase-admin");
const cheerio = require('cheerio');
const axios = require('axios');
const CronJob = require('cron').CronJob;
const serviceAccount = require("../keno-ae1d3-firebase-adminsdk-ksvbb-2885c22924.json");
const {GoogleSpreadsheet} = require('google-spreadsheet');
const key = require("./credentials.json");

const doc = new GoogleSpreadsheet('1ndlBIPv2kJMd44AMnrpnYxXBTHvAMCZEesNeDP0VFuY');
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://keno-ae1d3-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db = firebase.database();

const job = new CronJob('*/10 * * * *', async function () {
    try {
        const datas = await axios.default({
            method: 'GET',
            url: 'https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/winning-number-keno/',
            httpsAgent: new (require('https').Agent)({rejectUnauthorized: false})
        });

        const $ = cheerio.load(datas.data);
        const selector = '#divRightContent > div.doso_output_nd.doso_keno_output_nd.table-responsive > table > tbody > tr:nth-child(2)';
        $(selector).each(async (index, el) => {
            const ngay = $(el).find('td[style="vertical-align:top;color:#F18806; "]>a[style="color:#F18806"]').text();
            const ky = $(el).find('td[style="vertical-align:top;color:#F18806; "]>div').text();
            const ketqua = $(el).find('.day_so_ket_qua_v2').text();

            const xong = ketqua.split(' ');
            let date = Date.now();

            await db.ref('keno/' + date).set({
                'date': date,
                'ngay': ngay,
                'ky': ky,
                'ketqua': {
                    '0': xong[0],
                    '1': xong[1],
                    '2': xong[2],
                    '3': xong[3],
                    '4': xong[4],
                    '5': xong[5],
                    '6': xong[6],
                    '7': xong[7],
                    '8': xong[8],
                    '9': xong[9],
                    '10': xong[10],
                    '11': xong[11],
                    '12': xong[12],
                    '13': xong[13],
                    '14': xong[14],
                    '15': xong[15],
                    '16': xong[16],
                    '17': xong[17],
                    '18': xong[18],
                    '19': xong[19]
                }
            });
            await doc.useServiceAccountAuth({
                client_email: key.client_email,
                private_key: key.private_key,
            });
            await doc.loadInfo(); // loads sheets
            const sheet = doc.sheetsByIndex[0];
            const larryRow = await sheet.addRow({
                date: date,
                ngay: ngay,
                ky: ky,
                0: xong[0],
                1: xong[1],
                2: xong[2],
                3: xong[3],
                4: xong[4],
                5: xong[5],
                6: xong[6],
                7: xong[7],
                8: xong[8],
                9: xong[9],
                10: xong[10],
                11: xong[11],
                12: xong[12],
                13: xong[13],
                14: xong[14],
                15: xong[15],
                16: xong[16],
                17: xong[17],
                18: xong[18],
                19: xong[19]
            });
        });
        console.log('done');
    } catch (err) {
        console.error(err);
    }
}, null, true, 'Asia/Ho_Chi_Minh');


const job1 = new CronJob('* 6 * * *', function () {
    job.start();
}, null, true, 'Asia/Ho_Chi_Minh');

job1.start();

const job2 = new CronJob('50 21 * * *', function () {
    job.stop();
}, null, true, 'Asia/Ho_Chi_Minh');

job2.start();
