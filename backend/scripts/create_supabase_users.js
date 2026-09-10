require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

// Test users to create
const TEST_USERS = [
  {
    name: "Test User",
    email: "user@test.com",
    password: "password123",
    role: "user",
    subscription: "free",
  },
  {
    name: "Admin User",
    email: "admin@test.com",
    password: "admin123",
    role: "admin",
    subscription: "enterprise",
  },
];

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createTestUsers() {
  try {
    console.log("[Script] Starting test user creation...\n");

    // First, delete existing test users
    console.log("[Script] Cleaning up existing test users...");
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .in(
        "email",
        TEST_USERS.map((u) => u.email)
      );

    if (deleteError) {
      console.warn("[Script] Warning during cleanup:", deleteError.message);
    } else {
      console.log("[Script] ✓ Existing test users removed\n");
    }

    // Create new test users
    console.log("[Script] Creating new test users...");

    for (const testUser of TEST_USERS) {
      try {
        const hashedPassword = await hashPassword(testUser.password);

        const { data, error } = await supabase
          .from("users")
          .insert([
            {
              name: testUser.name,
              email: testUser.email,
              password: hashedPassword,
              role: testUser.role,
              subscription: testUser.subscription,
              work_type: "Engineering",
              notifications: true,
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) {
          console.error(
            `[Script] ✗ Failed to create ${testUser.email}:`,
            error.message
          );
        } else {
          console.log(
            `[Script] ✓ Created ${testUser.role}: ${testUser.email} / ${testUser.password}`
          );
        }
      } catch (error) {
        console.error(
          `[Script] ✗ Error creating user ${testUser.email}:`,
          error.message
        );
      }
    }

    console.log(
      "\n[Script] ✓ Test user creation completed successfully!\n"
    );
    console.log("=== TEST CREDENTIALS ===");
    TEST_USERS.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log("---");
    });

    process.exit(0);
  } catch (error) {
    console.error("[Script] Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
createTestUsers();
