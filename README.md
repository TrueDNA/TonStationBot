# Use Node.Js 18 or later

## Functionality

| Functional                            | Supported |
| ------------------------------------- | :-------: |
| Auto farming                          |    ✅     |
| Claiming task                         |    ✅     |
| Multithreading                        |    ✅     |
| Caching session data                  |    ✅     |
| Using a session/query_id              |    ✅     |
| Binding a proxy to a session/query_id |    ✅     |
| Random sleep time between clicks      |    ✅     |

### [How to add query id](https://github.com/Freddywhest/RockyRabbitBot/blob/main/AddQueryId.md)

## [Settings](https://github.com/FreddyWhest/TonStationBot/blob/main/.env-example)

| Settings                       | Description                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| **API_ID / API_HASH**          | Platform data from which to launch a Telegram session (stock - Android)    |
| **AUTO_FARM**                  | Whether the bot should farm (True / False)                                 |
| **AUTO_CLAIM_TASKS**           | Whether the bot claim tasks (True / False)                                 |
| **SLEEP_BETWEEN_REQUESTS**     | Delay between taps in seconds (eg. [200, 700])                             |
| **DELAY_BETWEEN_STARTING_BOT** | Delay between starting in seconds (eg. [20, 30])                           |
| **DELAY_BETWEEN_PAINTING**     | Delay between painting in seconds (eg. [20, 30])                           |
| **DELAY_BETWEEN_TASKS**        | Delay between tasks in seconds (eg. [20, 30])                              |
| **USE_PROXY_FROM_JS_FILE**     | Whether to use proxy from the `bot/config/proxies.js` file (True / False)  |
| **USE_PROXY_FROM_TXT_FILE**    | Whether to use proxy from the `bot/config/proxies.txt` file (True / False) |

## Installation

You can download [**Repository**](https://github.com/truedna/TonStationBot) by cloning it to your system and installing the necessary dependencies:

```shell
~ >>> git clone https://github.com/truedna/TonStationBot.git
~ >>> cd TonStationBot

#Linux and MocOS
~/TonStationBot >>> chmod +x check_node.sh
~/TonStationBot >>> ./check_node.sh

OR

~/TonStationBot >>> npm install
~/TonStationBot >>> cp .env-example .env
~/TonStationBot >>> nano .env # Here you must specify your API_ID and API_HASH , the rest is taken by default
~/TonStationBot >>> node index.js

#Windows
1. Double click on INSTALL.bat in TonStationBot directory to install the dependencies
2. Double click on START.bat in TonStationBot directory to start the bot

OR

~/TonStationBot >>> npm install
~/TonStationBot >>> cp .env-example .env
~/TonStationBot >>> # Specify your API_ID and API_HASH, the rest is taken by default
~/TonStationBot >>> node index.js
```

Also for quick launch you can use arguments, for example:

```shell
~/TonStationBot >>> node index.js --action=1

OR

~/TonStationBot >>> node index.js --action=2 #session

OR

~/TonStationBot >>> node index.js --action=3 #query_id

#1 - Create session
#2 - Run clicker
```
