const Sequelize = require("sequelize");

const sequelize = new Sequelize("sophisticated", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "sophisticated.sqlite",
});

const ParticipantModel = sequelize.define("participant", {
  gameId: {
    type: Sequelize.INTEGER,
  },
  userId: {
    type: Sequelize.INTEGER,
  },
  team: {
    type: Sequelize.ENUM("A", "B"),
    allowNull: false,
  },
});

module.exports = ParticipantModel;
