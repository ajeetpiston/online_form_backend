const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@onlineforms.com' LIMIT 1"
    );

    if (!adminUser.length) {
      throw new Error(
        "Admin user not found. Please run the admin seeder first."
      );
    }

    const adminId = adminUser[0].id;

    const applications = [
      {
        id: uuidv4(),
        title: "Passport Application",
        description:
          "Apply for a new passport or renew your existing passport online. Required documents include proof of identity, address proof, and birth certificate.",
        category: "Government",
        imageUrl:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
        tutorialUrl: "https://www.youtube.com/watch?v=example1",
        redirectUrl: "https://passportindia.gov.in",
        allowDocumentUpload: true,
        processingFee: 99.0,
        estimatedTime: 30,
        priority: 8,
        tags: ["passport", "government", "identity"],
        requirements:
          "Valid ID proof, Address proof, Birth certificate, Photographs",
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: "Driving License Application",
        description:
          "Apply for a new driving license or renew your existing license. Includes learner's license and permanent license applications.",
        category: "Government",
        imageUrl:
          "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400",
        tutorialUrl: "https://www.youtube.com/watch?v=example2",
        redirectUrl: "https://parivahan.gov.in",
        allowDocumentUpload: true,
        processingFee: 149.0,
        estimatedTime: 25,
        priority: 7,
        tags: ["driving", "license", "transport"],
        requirements:
          "Age proof, Address proof, Medical certificate, Photographs",
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: "College Admission Form",
        description:
          "Submit your college admission application with all required documents and information. Available for undergraduate and postgraduate programs.",
        category: "Education",
        imageUrl:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400",
        tutorialUrl: "https://www.youtube.com/watch?v=example3",
        redirectUrl: "https://admissions.university.edu",
        allowDocumentUpload: true,
        processingFee: 199.0,
        estimatedTime: 45,
        priority: 6,
        tags: ["education", "college", "admission"],
        requirements:
          "10th & 12th certificates, Entrance exam scores, ID proof, Photographs",
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: "Health Insurance Claim",
        description:
          "File a health insurance claim for medical expenses. Upload bills, prescriptions, and medical reports for quick processing.",
        category: "Healthcare",
        imageUrl:
          "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
        tutorialUrl: "https://www.youtube.com/watch?v=example4",
        redirectUrl: "https://insurance.company.com",
        allowDocumentUpload: true,
        processingFee: 49.0,
        estimatedTime: 20,
        priority: 9,
        tags: ["insurance", "health", "claim"],
        requirements:
          "Medical bills, Prescriptions, Discharge summary, ID proof",
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: "Business License Registration",
        description:
          "Register your new business and obtain necessary licenses. Includes GST registration, trade license, and other business permits.",
        category: "Legal",
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        tutorialUrl: "https://www.youtube.com/watch?v=example5",
        redirectUrl: "https://business.gov.in",
        allowDocumentUpload: true,
        processingFee: 299.0,
        estimatedTime: 60,
        priority: 5,
        tags: ["business", "license", "registration"],
        requirements: "Business plan, Address proof, PAN card, Bank statements",
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("applications", applications);

    // Add form fields for each application
    const formFields = [];

    // Passport Application Form Fields
    const passportAppId = applications[0].id;
    formFields.push(
      {
        id: uuidv4(),
        applicationId: passportAppId,
        label: "Full Name",
        fieldType: "text",
        isRequired: true,
        placeholder: "Enter your full name as per documents",
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: passportAppId,
        label: "Date of Birth",
        fieldType: "date",
        isRequired: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: passportAppId,
        label: "Email Address",
        fieldType: "email",
        isRequired: true,
        placeholder: "your.email@example.com",
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: passportAppId,
        label: "Phone Number",
        fieldType: "phone",
        isRequired: true,
        placeholder: "+91 9876543210",
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: passportAppId,
        label: "Address",
        fieldType: "textarea",
        isRequired: true,
        placeholder: "Enter your complete address",
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // Driving License Form Fields
    const dlAppId = applications[1].id;
    formFields.push(
      {
        id: uuidv4(),
        applicationId: dlAppId,
        label: "Full Name",
        fieldType: "text",
        isRequired: true,
        placeholder: "Enter your full name",
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: dlAppId,
        label: "License Type",
        fieldType: "dropdown",
        isRequired: true,
        options: ["Learner License", "Permanent License", "Renewal"],
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: dlAppId,
        label: "Vehicle Category",
        fieldType: "multiSelect",
        isRequired: true,
        options: [
          "Two Wheeler",
          "Four Wheeler",
          "Commercial Vehicle",
          "Heavy Vehicle",
        ],
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    await queryInterface.bulkInsert("form_fields", formFields);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("form_fields", {});
    await queryInterface.bulkDelete("applications", {});
  },
};
