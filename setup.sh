#!/bin/bash

# Meesho E-Commerce Setup Script

echo "🚀 Setting up Meesho E-Commerce Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB."
    echo "   Visit: https://www.mongodb.com/try/download/community"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your MongoDB URI and JWT secret!"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your MongoDB URI"
echo "2. Start MongoDB: mongod (or 'brew services start mongodb-community' on macOS)"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:3000"
echo "5. Admin panel: http://localhost:3000/admin/login"
echo ""
echo "Create admin user:"
echo "curl -X POST http://localhost:3000/api/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\":\"Admin\",\"email\":\"admin@example.com\",\"password\":\"admin123456\"}'"
echo ""
echo "Then update role to 'admin' in MongoDB:"
echo "db.users.updateOne({email:'admin@example.com'},{$set:{role:'admin'}})"
echo ""
