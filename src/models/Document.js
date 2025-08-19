module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    "Document",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userApplicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "user_applications",
          key: "id",
        },
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cloudinaryPublicId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      documentType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verifiedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "documents",
      timestamps: true,
      indexes: [
        {
          fields: ["userApplicationId"],
        },
        {
          fields: ["isVerified"],
        },
      ],
    }
  );

  // Associations
  Document.associate = (models) => {
    Document.belongsTo(models.UserApplication, {
      foreignKey: "userApplicationId",
      as: "userApplication",
    });
    Document.belongsTo(models.User, {
      foreignKey: "verifiedBy",
      as: "verifier",
    });
  };

  return Document;
};
