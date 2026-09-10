const supabase = require('./supabase');

const connectDB = async () => {
    try {
        // Test Supabase connection by making a simple query
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            throw new Error(`Supabase connection failed: ${error.message}`);
        }
        
        console.log(`[Database] Supabase Connected Successfully`);
    } catch (error) {
        console.error(`[Database Error]: ${error.message}`);
        // Don't kill the Vercel serverless process — login would 404/500 on cold start
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
