import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing Supabase configuration")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
    
    def get_client(self) -> Client:
        return self.supabase
    
    def create_tables(self):
        """Create necessary tables if they don't exist"""
        try:
            # Check if tables exist by trying to query them
            try:
                # Try to query users table
                self.supabase.table('users').select('id').limit(1).execute()
                print("✅ Users table already exists")
            except Exception:
                print("❌ Users table doesn't exist - please create it manually in Supabase dashboard")
                print("""
                Please run this SQL in your Supabase SQL Editor:
                
                CREATE TABLE users (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    is_verified BOOLEAN DEFAULT FALSE,
                    onboarding_data JSONB,
                    is_premium BOOLEAN DEFAULT FALSE,
                    subscription_plan VARCHAR(20),
                    subscription_expires_at TIMESTAMP WITH TIME ZONE  
                );
                
                CREATE TABLE password_reset_tokens (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """)
                return
            # Ensure username and user_type columns exist
            try:
                self.supabase.table('users').select('username, user_type').limit(1).execute()
                print("✅ username and user_type columns exist on users table")
            except Exception:
                print("ℹ️ Add username and user_type columns to users table in Supabase SQL Editor:")
                print(
                    """
 ALTER TABLE users
 ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE NOT NULL,
 ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'user';
                    """
                )

            # Check password_reset_tokens table
            try:
                self.supabase.table('password_reset_tokens').select('id').limit(1).execute()
                print("✅ Password reset tokens table already exists")
            except Exception:
                print("❌ Password reset tokens table doesn't exist - please create it manually in Supabase dashboard")
                print("""
CREATE TABLE password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
                """)
                return
            
            print("✅ Users and password_reset_tokens tables are ready")
            
        except Exception as e:
            print(f"❌ Error checking tables: {e}")
            print("Please create the tables manually in your Supabase dashboard")

# Global database instance
db_config = DatabaseConfig()
