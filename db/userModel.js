const Sequelize = require("sequelize");

const sequelize = new Sequelize("sophisticated", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "sophisticated.sqlite",
});

const Users = sequelize.define("users", {
  discord_name: {
    type: Sequelize.STRING,
    unique: true,
  },
  ingame_name: {
    type: Sequelize.STRING,
    unique: true,
  },
  points: {
    type: Sequelize.INTEGER,
    defaultValue: 100,
    allowNull: false,
  },
  wins: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  last_link: {
    type: Sequelize.DATE,
  },
});

module.exports = Users;
