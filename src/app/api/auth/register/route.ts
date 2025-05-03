import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define the user type
interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
}

// In-memory storage for development mode
const DEV_USERS_FILE = path.join(process.cwd(), 'dev-users.json');

// Function to read users from the JSON file
const readUsers = (): User[] => {
  try {
    if (fs.existsSync(DEV_USERS_FILE)) {
      const data = fs.readFileSync(DEV_USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return [];
};

// Function to write users to the JSON file
const writeUsers = (users: User[]) => {
  try {
    fs.writeFileSync(DEV_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users file:', err);
  }
};

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // In development mode, use local file storage
    if (process.env.NODE_ENV === 'development') {
      const users = readUsers();
      
      // Check if user already exists
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create the user
      const newUser: User = {
        id: uuidv4(),
        email,
        password_hash: hashedPassword,
        name: name || null,
        created_at: new Date().toISOString()
      };

      // Add the user to our list and save
      users.push(newUser);
      writeUsers(users);

      return NextResponse.json(
        {
          message: "User registered successfully",
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
        },
        { status: 201 }
      );
    } else {
      // For production, you would use Supabase or another DB
      // This is a placeholder until you set up your Supabase properly
      return NextResponse.json(
        { error: "Database configuration not available. Please check your environment variables." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 