const app = require("../config/app");

const headers = {
  "content-type": "application/json",
  accept: "*/*",
  "sec-fetch-site": "cross-site",
  "accept-encoding": "gzip, deflate",
  "accept-language": "en-US,en;q=0.9",
  "sec-fetch-mode": "cors",
  origin: app.origin,
  "user-agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  "sec-fetch-dest": "empty",
  "X-Requested-With": "org.telegram.messenger.web",
  "Sec-Ch-Ua-Mobile": "?1",
  "Sec-Ch-Ua": `"Android WebView";v="129", "Not=A?Brand";v="8", "Chromium";v="129"`,
  "Sec-Ch-Ua-Platform": "Android",
};

module.exports = headers;
