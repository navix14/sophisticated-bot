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
    type: Sequelize.DATE,
  },
  player3: {
    type: Sequelize.DATE,
  },
  player4: {
    type: Sequelize.DATE,
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
  phase: {
    type: Sequelize.STRING,
  },
});

module.exports = Games;
