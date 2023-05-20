const axios = require("axios");
const cheerio = require("cheerio");
const XeroPlayer = require("./xeroProfile");

class XeroClient {
  async fetchPlayer(playerName) {
    try {
      const res = await axios.get(`https://xero.gg/player/${playerName}`);
      const $ = cheerio.load(res.data);

      const level = $(
        "#player-profile-header > div > div.pointer-events-none.user-select-none > div:nth-child(1) > div > div"
      ).attr().title;

      const clanEl = $("#uniteddb-player-view-clan > a");
      let clanNameEncoded = "";
      let clanNameDecoded = "";

      if (clanEl.length !== 0) {
        const clanHref = clanEl.attr("href");
        clanNameEncoded = clanHref.substring("/clan/".length);
        clanNameDecoded = decodeURIComponent(clanNameEncoded);
      }

      let imageUrl = $(
        "#player-profile-header-heading > div:nth-child(1) > div > span > img"
      ).attr("src");

      if (imageUrl.startsWith("/")) {
        imageUrl = "https://xero.gg" + imageUrl;
      }

      return new XeroPlayer(playerName, level, clanNameDecoded, imageUrl);
    } catch (err) {
      console.log(err);
    }
  }

  async playerExists(playerName) {
    try {
      await axios.get(`https://xero.gg/player/${playerName}`);
      return true;
    } catch (err) {
      const body = err.response.data;
      return !body.includes("Player doesn't exist.");
    }
  }
}

module.exports = XeroClient;
