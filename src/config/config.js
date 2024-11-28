import dotenv from 'dotenv';
dotenv.config();

const config = {
    APP_DOMAIN: process.env.APP_DOMAIN,
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    ASSISTANT_ID: process.env.ASSISTANT_ID,
    WHATSAPP_GROUP_ID: process.env.WHATSAPP_GROUP_ID,
    CRON_LEADS_WHATSAPP: process.env.CRON_LEADS_WHATSAPP,
    RELEASE_DATE: process.env.RELEASE_DATE

};

export default config;
