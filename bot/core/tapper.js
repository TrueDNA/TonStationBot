const { default: axios } = require("axios");
const logger = require("../utils/logger");
const headers = require("./header");
const { Api } = require("telegram");
const { HttpsProxyAgent } = require("https-proxy-agent");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../config/userAgents");
const fs = require("fs");
const sleep = require("../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const parser = require("../utils/parser");
const path = require("path");
const taskFilter = require("../utils/taskFilter");
const _isArray = require("../utils/_isArray");
const FdyTmp = require("fdy-tmp");
const Fetchers = require("../utils/fetchers");
const moment = require("moment");

class Tapper {
  constructor(tg_client) {
    this.bot_name = "tonstation";
    this.session_name = tg_client.session_name;
    this.tg_client = tg_client.tg_client;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
    this.sleep_floodwait = 0;
    this.runOnce = false;
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #clean_tg_web_data(queryString) {
    let cleanedString = queryString.replace(/^tgWebAppData=/, "");
    cleanedString = cleanedString.replace(
      /&tgWebAppVersion=.*?&tgWebAppPlatform=.*?(?:&tgWebAppBotInline=.*?)?$/,
      ""
    );
    return cleanedString;
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    logger.info(
      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Generating new user agent...`
    );
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxy_url;
      if (!proxy.password && !proxy.username) {
        proxy_url = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new HttpsProxyAgent(proxy_url);
    } catch (e) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${
          this.session_name
        } | Proxy agent error: ${e}\nProxy: ${JSON.stringify(proxy, null, 2)}`
      );
      return null;
    }
  }

  async #get_tg_web_data() {
    try {
      const tmp = new FdyTmp({
        fileName: `${this.bot_name}.fdy.tmp`,
        tmpPath: path.join(process.cwd(), "cache/queries"),
      });
      if (tmp.hasJsonElement(this.session_name)) {
        const queryStringFromCache = tmp.getJson(this.session_name);
        if (!_.isEmpty(queryStringFromCache)) {
          const va_hc = axios.create({
            headers: this.headers,
            withCredentials: true,
          });

          const validate = await this.api.validate_query_id(
            va_hc,
            queryStringFromCache
          );

          if (validate && !_.isEmpty(validate)) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🔄 Getting data from cache...`
            );
            if (this.tg_client.connected) {
              await this.tg_client.disconnect();
              await this.tg_client.destroy();
            }
            await sleep(5);
            return {
              data: validate,
              fromCache: true,
              userId: parser.toJson(queryStringFromCache).user.id,
            };
          } else {
            tmp.deleteJsonElement(this.session_name);
          }
        }
      }
      await this.tg_client.connect();
      await this.tg_client.start();
      const platform = this.#get_platform(this.#get_user_agent());

      if (!this.bot) {
        this.bot = await this.tg_client.getInputEntity(app.bot);
      }

      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 📡 Waiting for authorization...`
        );
        const botHistory = await this.tg_client.invoke(
          new Api.messages.GetHistory({
            peer: this.bot,
            limit: 10,
          })
        );
        if (botHistory.messages.length < 1) {
          await this.tg_client.invoke(
            new Api.messages.SendMessage({
              message: "/start",
              silent: true,
              noWebpage: true,
              peer: this.bot,
            })
          );
        }
      }

      await sleep(_.random(2, 5));

      const result = await this.tg_client.invoke(
        new Api.messages.RequestAppWebView({
          peer: this.bot,
          app: new Api.InputBotAppShortName({
            botId: this.bot,
            shortName: "app",
          }),
          writeAllowed: true,
          platform,
          from_bot_menu: true,
          url: app.webviewUrl,
          startParam: "ref_2tlw9mceetaoz8qu3abj7r",
        })
      );

      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💾 Storing data in cache...`
      );

      await sleep(_.random(2, 5));

      tmp
        .addJson(
          this.session_name,
          decodeURIComponent(this.#clean_tg_web_data(tgWebData))
        )
        .save();
      return {
        data: decodeURIComponent(this.#clean_tg_web_data(tgWebData)),
        fromCache: false,
        userId: parser.toJson(
          decodeURIComponent(this.#clean_tg_web_data(tgWebData))
        ).user.id,
      };
    } catch (error) {
      if (error.message.includes("AUTH_KEY_DUPLICATED")) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | The same authorization key (session file) was used in more than one place simultaneously. You must delete your session file and create a new session`
        );
        return null;
      }
      const regex = /A wait of (\d+) seconds/;
      if (
        error.message.includes("FloodWaitError") ||
        error.message.match(regex)
      ) {
        const match = error.message.match(regex);

        if (match) {
          this.sleep_floodwait =
            new Date().getTime() / 1000 + parseInt(match[1], 10) + 10;
        } else {
          this.sleep_floodwait = new Date().getTime() / 1000 + 50;
        }
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Some flood error, waiting ${
            this.sleep_floodwait - new Date().getTime() / 1000
          } seconds to try again...`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
        );
      }
      return null;
    } finally {
      if (this.tg_client.connected) {
        await this.tg_client.disconnect();
        await this.tg_client.destroy();
      }
      this.runOnce = true;
      if (this.sleep_floodwait > new Date().getTime() / 1000) {
        await sleep(this.sleep_floodwait - new Date().getTime() / 1000);
        return await this.#get_tg_web_data();
      }
      await sleep(3);
    }
  }

  async run(proxy) {
    let http_client;
    let access_token_created_time = 0;
    let access_token;

    let profile_data;
    let mine_data;
    let balance_data;
    let userId;
    let error_in = false;

    const fetchers = new Fetchers(this.api, this.session_name, this.bot_name);

    if (
      (settings.USE_PROXY_FROM_TXT_FILE || settings.USE_PROXY_FROM_JS_FILE) &&
      proxy
    ) {
      http_client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true,
      });
      const proxy_result = await fetchers.check_proxy(http_client, proxy);
      if (!proxy_result) {
        http_client = axios.create({
          headers: this.headers,
          withCredentials: true,
        });
      }
    } else {
      http_client = axios.create({
        headers: this.headers,
        withCredentials: true,
      });
    }
    while (true) {
      try {
        const currentTime = _.floor(Date.now() / 1000);
        if (currentTime - access_token_created_time >= 3590) {
          const tg_web_data = await this.#get_tg_web_data();

          if (
            _.isNull(tg_web_data?.data) ||
            _.isUndefined(tg_web_data?.fromCache) ||
            _.isNull(tg_web_data?.fromCache) ||
            _.isUndefined(tg_web_data?.data) ||
            !tg_web_data ||
            _.isEmpty(tg_web_data)
          ) {
            continue;
          }
          const check_user = await this.api.check_user_exist(
            http_client,
            tg_web_data.userId
          );

          if (!check_user) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Creating user...`
            );
            await this.api.create_user(http_client, tg_web_data.data);
          }

          if (tg_web_data.fromCache == true) {
            access_token = tg_web_data.data;
          } else {
            access_token = await this.api.access_token(
              http_client,
              tg_web_data.data
            );
          }
          userId = String(tg_web_data.userId);
          http_client.defaults.headers[
            "authorization"
          ] = `${access_token?.tokenType} ${access_token?.accessToken}`;
          access_token_created_time = currentTime;

          await sleep(2);
        }

        profile_data = await this.api.get_user_info(http_client, userId);
        mine_data = await this.api.get_mine_info(http_client, userId);
        const wallet = await this.api.user_wallet(http_client, userId);
        balance_data = await this.api.get_balance_info(
          http_client,
          wallet?.address
        );

        if (
          _.isEmpty(profile_data) ||
          _.isEmpty(wallet) ||
          _.isEmpty(balance_data?.data)
        ) {
          error_in = true;
          access_token_created_time = 0;
          continue;
        }

        if (!_.isEmpty(balance_data?.data?.balance)) {
          for (let balance of balance_data?.data?.balance) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${
                this.session_name
              } | Balance for <pi>${balance?.tokenName}</pi>: <la>${
                balance?.balance
              } ${balance?.tokenName?.toUpperCase()}</la>`
            );
          }
        }

        if (settings.AUTO_FARM) {
          if (
            !_.isEmpty(mine_data?.data) &&
            mine_data?.code == 200 &&
            mine_data?.message?.toLowerCase() == "success"
          ) {
            const current_mine = mine_data?.data[0];
            if (moment(current_mine?.timeEnd).isBefore(moment())) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Claiming mine...`
              );
              //claim mine
              const claim_mine = await this.api.claim_mine(http_client, {
                userId: userId,
                taskId: current_mine?._id,
              });
              if (
                !_.isEmpty(claim_mine?.data) &&
                claim_mine?.code == 200 &&
                claim_mine?.message?.toLowerCase() == "success"
              ) {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Mine claimed <gr>+${claim_mine?.data?.amount}</gr> <la>SOON</la>`
                );
              } else {
                logger.warning(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to claim mine`
                );
              }
              await sleep(5);
              //start mine
              const start_mine = await this.api.start_mine(http_client, {
                userId: userId,
                taskId: "1",
              });
              if (
                !_.isEmpty(start_mine) &&
                start_mine?.code == 200 &&
                start_mine?.message?.toLowerCase() == "success"
              ) {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${
                    this.session_name
                  } | Mine started | Mine ends <la>${moment(
                    start_mine?.timeEnd
                  ).fromNow()}</la>`
                );
              } else {
                logger.warning(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to start mine`
                );
              }
            } else {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | Mine ends <la>${moment(
                  current_mine?.timeEnd
                ).fromNow()}</la>`
              );
            }
          } else if (
            _.isEmpty(mine_data?.data) &&
            mine_data?.code == 200 &&
            mine_data?.message?.toLowerCase() == "success"
          ) {
            //start mine
            const start_mine = await this.api.start_mine(http_client, {
              userId: userId,
              taskId: "1",
            });
            if (
              !_.isEmpty(start_mine) &&
              start_mine?.code == 200 &&
              start_mine?.message?.toLowerCase() == "success"
            ) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | Mine started | Mine ends <la>${moment(
                  start_mine?.timeEnd
                ).fromNow()}</la>`
              );
            } else {
              logger.warning(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to start mine`
              );
            }
          }
        }

        const tasks = await this.api.get_tasks(http_client, userId);
        if (
          !_.isEmpty(tasks?.data) &&
          tasks?.code == 200 &&
          tasks?.message?.toLowerCase() == "success" &&
          settings.AUTO_CLAIM_TASKS
        ) {
          const filtered_tasks = taskFilter(tasks?.data, "social");
          if (!_.isEmpty(filtered_tasks)) {
            for (let task of filtered_tasks) {
              const sleep_task = _.random(
                settings.DELAY_BETWEEN_TASKS[0],
                settings.DELAY_BETWEEN_TASKS[1]
              );
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${sleep_task} seconds before starting task <la>${task?.description}</la>`
              );

              await sleep(sleep_task);

              const data = {
                project: task?.project,
                userId,
                questId: task?.id,
              };

              const start_task = await this.api.start_task(http_client, data);
              await sleep(5);
              if (
                start_task?.code == 200 &&
                start_task?.message?.toLowerCase() == "success"
              ) {
                const claim_task = await this.api.claim_task(http_client, data);
                if (
                  !_.isEmpty(claim_task?.data) &&
                  claim_task?.code == 200 &&
                  claim_task?.message?.toLowerCase() == "success"
                ) {
                  logger.info(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Claimed task: <la>${task?.description}</la> | Reward: <gr>+${task?.reward?.amount} ${task?.reward?.type}</gr>`
                  );
                } else {
                  logger.warning(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to claim task: <la>${task?.description}</la>`
                  );
                }
              } else {
                logger.warning(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to start task: <la>${task?.description}</la>`
                );
              }
            }
          }
        }

        await sleep(10);

        balance_data = await this.api.get_balance_info(
          http_client,
          wallet?.address
        );

        if (_.isEmpty(balance_data?.data)) {
          continue;
        }

        if (!_.isEmpty(balance_data?.data?.balance)) {
          for (let balance of balance_data?.data?.balance) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${
                this.session_name
              } | Balance for <pi>${balance?.tokenName}</pi>: <la>${
                balance?.balance
              } ${balance?.tokenName?.toUpperCase()}</la>`
            );
          }
        }
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        if (error_in) {
          error_in = false;
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for 30 seconds before retrying...`
          );
          await sleep(30);
        } else {
          let ran_sleep;
          if (_isArray(settings.SLEEP_BETWEEN_REQUESTS)) {
            if (
              _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[0]) &&
              _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[1])
            ) {
              ran_sleep = _.random(
                settings.SLEEP_BETWEEN_REQUESTS[0],
                settings.SLEEP_BETWEEN_REQUESTS[1]
              );
            } else {
              ran_sleep = _.random(450, 800);
            }
          } else if (_.isInteger(settings.SLEEP_BETWEEN_REQUESTS)) {
            const ran_add = _.random(20, 50);
            ran_sleep = settings.SLEEP_BETWEEN_REQUESTS + ran_add;
          } else {
            ran_sleep = _.random(450, 800);
          }

          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${ran_sleep} seconds...`
          );
          await sleep(ran_sleep);
        }
      }
    }
  }
}
module.exports = Tapper;
