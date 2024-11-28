import express from 'express';
import whatsappRouter from './src/routes/whatsappRouter.js';
import leadsRouter from './src/routes/leadsRouter.js';
import config from './src/config/config.js';
import { initializeClient } from './src/routes/whatsappRouter.js';
import './src/crons/leads.js';
import ejs from 'ejs';

const app = express();
const port = config.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/whatsapp', whatsappRouter);
app.use('/leads', leadsRouter);

initializeClient();

const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

server.on('error', error => console.log(error));
