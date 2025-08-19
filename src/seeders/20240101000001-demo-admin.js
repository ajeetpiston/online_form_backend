const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash("admin123", 12);

    await queryInterface.bulkInsert("users", [
      {
        id: uuidv4(),
        name: "Admin User",
        email: "admin@onlineforms.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", {
      email: "admin@onlineforms.com",
    });
  },
};
