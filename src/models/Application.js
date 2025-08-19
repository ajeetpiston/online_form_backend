module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    "Application",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 200],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          isIn: [
            [
              "Government",
              "Education",
              "Healthcare",
              "Finance",
              "Legal",
              "Other",
            ],
          ],
        },
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      tutorialUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      redirectUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
      allowDocumentUpload: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      processingFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      estimatedTime: {
        type: DataTypes.INTEGER, // in minutes
        allowNull: true,
        validate: {
          min: 1,
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 10,
        },
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      requirements: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "applications",
      timestamps: true,
      indexes: [
        {
          fields: ["category"],
        },
        {
          fields: ["isActive"],
        },
        {
          fields: ["priority"],
        },
        {
          fields: ["createdAt"],
        },
      ],
    }
  );

  // Associations
  Application.associate = (models) => {
    Application.hasMany(models.FormField, {
      foreignKey: "applicationId",
      as: "formFields",
      onDelete: "CASCADE",
    });
    Application.hasMany(models.UserApplication, {
      foreignKey: "applicationId",
      as: "submissions",
    });
    Application.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });
  };

  return Application;
};
