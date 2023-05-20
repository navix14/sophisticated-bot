const GameModel = require("./gameModel");
const UserModel = require("./userModel");
const ParticipantModel = require("./participantModel");

GameModel.belongsTo(UserModel, { as: "captainA", foreignKey: "captainAId" });
GameModel.belongsTo(UserModel, { as: "captainB", foreignKey: "captainBId" });

UserModel.belongsToMany(GameModel, { through: ParticipantModel });
GameModel.belongsToMany(UserModel, { through: ParticipantModel });

module.exports = {
  GameModel,
  UserModel,
  ParticipantModel,
};
