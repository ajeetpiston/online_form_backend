module.exports = (sequelize, DataTypes) => {
  const FormField = sequelize.define(
    "FormField",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "applications",
          key: "id",
        },
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 200],
        },
      },
      fieldType: {
        type: DataTypes.ENUM(
          "text",
          "email",
          "phone",
          "number",
          "dropdown",
          "multiSelect",
          "date",
          "file",
          "textarea",
          "checkbox",
          "radio"
        ),
        allowNull: false,
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      options: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      placeholder: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      validationPattern: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      helpText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      minLength: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maxLength: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      minValue: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      maxValue: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
    },
    {
      tableName: "form_fields",
      timestamps: true,
      indexes: [
        {
          fields: ["applicationId"],
        },
        {
          fields: ["order"],
        },
      ],
    }
  );

  // Associations
  FormField.associate = (models) => {
    FormField.belongsTo(models.Application, {
      foreignKey: "applicationId",
      as: "application",
    });
  };

  return FormField;
};
