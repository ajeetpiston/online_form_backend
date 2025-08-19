module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
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
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "INR",
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
        defaultValue: "pending",
      },
      paymentGateway: {
        type: DataTypes.ENUM("razorpay", "stripe", "paypal"),
        allowNull: false,
      },
      gatewayOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gatewayPaymentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gatewaySignature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      refundedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      refundReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "payments",
      timestamps: true,
      indexes: [
        {
          fields: ["userId"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["paymentGateway"],
        },
        {
          fields: ["gatewayOrderId"],
        },
        {
          fields: ["gatewayPaymentId"],
        },
      ],
    }
  );

  // Associations
  Payment.associate = (models) => {
    Payment.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    Payment.hasMany(models.UserApplication, {
      foreignKey: "paymentId",
      as: "applications",
    });
  };

  return Payment;
};
