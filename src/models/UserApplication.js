module.exports = (sequelize, DataTypes) => {
  const UserApplication = sequelize.define(
    "UserApplication",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "applications",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("pending", "inProgress", "completed", "rejected"),
        defaultValue: "pending",
      },
      submissionType: {
        type: DataTypes.ENUM("form", "document"),
        allowNull: false,
      },
      formData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      paymentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "payments",
          key: "id",
        },
      },
      amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      submittedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      trackingNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      externalApplicationId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "user_applications",
      timestamps: true,
      indexes: [
        {
          fields: ["userId"],
        },
        {
          fields: ["applicationId"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["submittedAt"],
        },
        {
          fields: ["trackingNumber"],
        },
      ],
    }
  );

  // Hooks
  UserApplication.addHook("beforeCreate", (userApplication) => {
    // Generate tracking number
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    userApplication.trackingNumber = `TRK-${timestamp}-${random}`.toUpperCase();
  });

  // Associations
  UserApplication.associate = (models) => {
    UserApplication.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    UserApplication.belongsTo(models.Application, {
      foreignKey: "applicationId",
      as: "application",
    });
    UserApplication.belongsTo(models.Payment, {
      foreignKey: "paymentId",
      as: "payment",
    });
    UserApplication.hasMany(models.Document, {
      foreignKey: "userApplicationId",
      as: "documents",
    });
  };

  return UserApplication;
};
