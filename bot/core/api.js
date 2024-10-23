const app = require("../config/app");
const logger = require("../utils/logger");
var _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.bot_name = bot_name;
    this.session_name = session_name;
  }

  async access_token(http_client, initData) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/userprofile/api/v1/users/auth`,
        JSON.stringify({ initData })
      );
      return response?.data;
    } catch (error) {
      console.log(error);

      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting access token: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting access token: ${error.message}`
        );
      }

      return null;
    }
  }

  async validate_query_id(http_client, initData) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/userprofile/api/v1/users/auth`,
        JSON.stringify({ initData })
      );
      return response?.data;
    } catch (error) {
      return false;
    }
  }

  async create_user(http_client, initData) {
    try {
      await http_client.post(
        `${app.apiUrl}/userprofile/api/v1/users`,
        JSON.stringify({ initData })
      );
      return true;
    } catch (error) {
      return true;
    }
  }

  async check_user_exist(http_client, user_id) {
    try {
      await http_client.get(
        `${app.apiUrl}/userprofile/api/v1/users/${user_id}/by-telegram-id`
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async user_wallet(http_client, user_id) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/userprofile/api/v1/users/${user_id}/by-telegram-id`
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting wallet info: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting wallet info: ${error.message}`
        );
      }

      return null;
    }
  }

  async get_mine_info(http_client, user_id) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/farming/api/v1/farming/${user_id}/running`
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting mine info: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting mine info: ${error.message}`
        );
      }

      return null;
    }
  }

  async get_balance_info(http_client, wallet) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/balance/api/v1/balance/${wallet}/by-address`
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting balance info: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting balance info: ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_mine(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/farming/api/v1/farming/claim`,
        JSON.stringify(data)
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while claiming mine: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while claiming mine: ${error.message}`
        );
      }

      return null;
    }
  }

  async get_user_info(http_client, userId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/farming/api/v1/user-rates/login`,
        JSON.stringify({ userId })
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while user info: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while user info: ${error.message}`
        );
      }

      return null;
    }
  }

  async start_mine(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/farming/api/v1/farming/start`,
        JSON.stringify(data)
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while starting mine: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while starting mine: ${error.message}`
        );
      }

      return null;
    }
  }

  async get_tasks(http_client, user_id) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/quests/api/v1/quests?userId=${user_id}`
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting tasks: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting tasks: ${error.message}`
        );
      }

      return null;
    }
  }

  async start_task(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/quests/api/v1/start`,
        JSON.stringify(data)
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while starting task: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while starting task: ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_task(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/quests/api/v1/claim`,
        JSON.stringify(data)
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.error) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while claiming task: ${error?.response?.data?.error}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while claiming task: ${error.message}`
        );
      }

      return null;
    }
  }
}

module.exports = ApiRequest;
