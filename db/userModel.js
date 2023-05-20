const Sequelize = require("sequelize");

const sequelize = new Sequelize("sophisticated", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "sophisticated.sqlite",
});

const UserModel = sequelize.define("user", {
  discordName: {
    type: Sequelize.STRING,
    unique: true,
  },
  ingameName: {
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
  lastLink: {
    type: Sequelize.DATE,
  },
  bannedUntil: {
    type: Sequelize.DATE,
    defaultValue: new Date(0),
  },
});

module.exports = UserModel;
