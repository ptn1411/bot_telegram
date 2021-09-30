const TelegramBot = require('node-telegram-bot-api');

const token = '1541034705:AAHoOrzxlNCra82J5tk_DSotJWlK4OSrzz8';

const bot = new TelegramBot(token, {polling: true});

// youtube link 
const YouTube = require('youtube-node');

const youTube = new YouTube();

youTube.setKey('AIzaSyDp59CYB74jNp6PL07rdnCwuFK3meSJAv4');

//qr code
const QRCode = require('qrcode');
// request 
const request = require('request');

// lưu file 
const fs = require('fs');
const qrCode = require('qrcode-reader');

const Jimp = require("jimp");

const firebase = require('firebase-admin');
const serviceAccount = require("../bottelegram-af2de-firebase-adminsdk-sjx2g-a85813419b.json");
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://bottelegram-af2de-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db = firebase.database();

bot.onText(/\/start/, (msg) => {
    let first_name = msg.chat.first_name;
    let last_name = msg.chat.last_name;

    let data = `<b>Xin chào ${first_name} ${last_name} </b>, Mình là bot bạn có thể gọi mình là Nam.

Mình có thể làm những việc sau giúp bạn.
Khởi động Bot
<a href="/start">/start</a>

Tìm bài hát trên YouTuBe
<a href="/yt">/yt Tên Video </a>
 
Tạo mã QR 
<a href="/qr">/qr Văn bản bạn muốn tạo</a>

Tạo mã Random
<a href="/random">/random min max </a>

Số liệu Covid Việt Nam
<a href="/covid">/covid</a>

Liên hệ 
Telegram : <a href="https://t.me/Ptn1411">https://t.me/Ptn1411</a>
Email : <a href="mailto:phamthanhnamdev@gmail.com">phamthanhnamdev@gmail.com</a>
`;

    let opts = {
        parse_mode: "HTML",
        reply_markup: {
            keyboard: [["/start", "/covid"], ["/yt son tung", "/qr son tung"], ["/random 1 100", "🎲"]]
        }
    }
    bot.sendMessage(msg.chat.id, data, opts);

});

// bot tim link video youtube 

bot.onText(/\/yt (.+)/, function (msg, match) {

    const resp = match[1];
    let idvideo;
    let urls;
    let opts;
    let date = Date.now();
    const username = msg.chat.username;

    youTube.search(resp, 2, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            idvideo = result.items[0].id.videoId;

            urls = `https://www.youtube.com/watch?v=${idvideo}`;
            opts = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                "text": "Open link",
                                "url": urls
                            }
                        ]
                    ]
                }
            };

            bot.sendMessage(msg.chat.id, urls, opts);
        }
    });
    db.ref('YT/' + date).set({
        'ten': username,
        'tutimkiem': resp,
        'date': date
    });
});

// tạo mã qr 

bot.onText(/\/qr (.+)/, function (msg, match) {

    const resp = match[1];
    let username;
    if (msg.chat.type == 'group') {
        username = msg.form.username;
    } else {
        username = msg.chat.username;
    }

    let date = Date.now();
    let path = `./public/images/${date}.png`;
    let opts = {
        caption: resp
    };
    QRCode.toFile(path, resp, {
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    }, function (err) {
        //if (err) throw err
        bot.sendPhoto(msg.chat.id, path, opts).then(r => {
            console.error(r);
        });


    });
    db.ref('QR/' + date).set({
        'ten': username,
        'maqr': resp,
        'image': path,
        'date': date
    })


});

// gửi hình 

bot.on('message', async (msg) => {
    if (msg.photo && msg.photo[0]) {
        const image = await bot.getFile(msg.photo[0].file_id);
        const download = (url, path, callback) => {
            request.head(url, (err, res) => {
                request(url)
                    .pipe(fs.createWriteStream(path))
                    .on('close', callback)
            })
        };
        let date = Date.now();
        const url = `https://api.telegram.org/file/bot1541034705:AAHoOrzxlNCra82J5tk_DSotJWlK4OSrzz8/${image.file_path}`;
        let path = `./public/images/${date}.png`;


        download(url, path, () => {
            const buffer = fs.readFileSync(`./public/images/${date}.png`);

            Jimp.read(buffer, function(err, image) {
                if (err) {
                    console.error(err);
                }
                // Creating an instance of qrcode-reader module
                let qrcode = new qrCode();
                qrcode.callback = function(err, value) {
                    if (err) {
                        console.error(err);
                    }
                    // Printing the decrypted value

                    const text = value.result;
                    bot.sendPhoto(msg.chat.id, path, {
                        caption: `${text}`,
                        width :"2560",
                        height:"2560"
                    });
                    bot.sendMessage(msg.chat.id, text);

                };
                // Decoding the QR code
                qrcode.decode(image.bitmap);
            });

        });
    }
});

// ramdom
bot.onText(/\/random (.+)/, function (msg, match) {

    const resp = match[1];
    let username = msg.chat.username;
    let date = Date.now();
    const xong = resp.split(' ');
    const min = Math.ceil(xong[0]);
    const max = Math.floor(xong[1]);
    const gui = Math.floor(Math.random() * (max - min) + min);

    bot.sendMessage(msg.chat.id, gui);

    db.ref('random/' + date).set({
        'ten': username,
        'khoang': resp,
        'ra': gui,
        'date': date
    });
});
//covid
bot.onText(/\/covid/, (msg) => {
    request.get('https://corona.lmao.ninja/v2/countries/vn', function (error, response, body) {
        const info = JSON.parse(body);
        const cases = info.cases;
        const recovered = info.recovered;
        const deaths = info.deaths;
        const active = info.active;
        const data = `<b>Việt Nam</b>
Số ca nhiễm: ${cases}
Đang điều trị: ${active}
Đã hồi phục: ${recovered}
Tử vong: ${deaths}
`;
        let opts = {
            parse_mode: "HTML"
        }
        bot.sendMessage(msg.chat.id, data, opts);

    });

});



