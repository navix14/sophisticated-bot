const Sequelize = require("sequelize");

const sequelize = new Sequelize("sophisticated", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "sophisticated.sqlite",
});

const GameModel = sequelize.define("game", {
  captainAId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  captainBId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  result: {
    type: Sequelize.STRING,
  },
  map: {
    type: Sequelize.STRING,
  },
  incrementPoints: {
    type: Sequelize.INTEGER,
  },
  wasUndone: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  screenshot_url: {
    type: Sequelize.STRING,
    defaultValue: "",
  },
});

module.exports = GameModel;
