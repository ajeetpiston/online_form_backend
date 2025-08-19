const { Sequelize } = require("sequelize");
const config =
  require("../config/database")[process.env.NODE_ENV || "development"];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Import models
const User = require("./User")(sequelize, Sequelize.DataTypes);
const Application = require("./Application")(sequelize, Sequelize.DataTypes);
const FormField = require("./FormField")(sequelize, Sequelize.DataTypes);
const UserApplication = require("./UserApplication")(
  sequelize,
  Sequelize.DataTypes
);
const Payment = require("./Payment")(sequelize, Sequelize.DataTypes);
const Document = require("./Document")(sequelize, Sequelize.DataTypes);

// Define associations
const models = {
  User,
  Application,
  FormField,
  UserApplication,
  Payment,
  Document,
};

// Set up associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  ...models,
};
