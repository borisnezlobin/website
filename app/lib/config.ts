const CONFIG = {
    API_URL: process.env.NODE_ENV === 'production' ? 'https://bn-flame.vercel.app' : 'http://localhost:3000',
};

export default CONFIG;