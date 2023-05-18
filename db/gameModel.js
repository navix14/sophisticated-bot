const Sequelize = require("sequelize");

const sequelize = new Sequelize("sophisticated", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "sophisticated.sqlite",
});

const Games = sequelize.define("ranked_games", {
  captainA: {
    type: Sequelize.STRING,
    unique: true,
  },
  captainB: {
    type: Sequelize.STRING,
    unique: true,
  },
  player1: {
    type: Sequelize.INTEGER,
    defaultValue: 100,
    allowNull: false,
  },
  player2: {
    type: Sequelize.STRING,
  },
  player3: {
    type: Sequelize.STRING,
  },
  player4: {
    type: Sequelize.STRING,
  },
  result: {
    type: Sequelize.INTEGER,
  },
  time_start: {
    type: Sequelize.DATE,
  },
  time_end: {
    type: Sequelize.DATE,
  },
  screenshot_url: {
    type: Sequelize.STRING,
  },
  state: {
    type: Sequelize.STRING,
  },
});

module.exports = Games;
