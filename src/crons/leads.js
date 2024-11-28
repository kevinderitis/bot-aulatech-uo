import cron from 'node-cron';
import Lead from '../dao/models/leadModel.js';
import { sendMessageUnofficial, checkIfUserInGroup } from '../routes/whatsappRouter.js';
import config from '../config/config.js';
import messages from './messages/messages.js';

cron.schedule(config.CRON_LEADS_WHATSAPP, async () => {
  console.log('Ejecutando tarea de verificación de mensajes pendientes...');
  const releaseDateEnv = config.RELEASE_DATE;
  const releaseDate = new Date(releaseDateEnv);
  const now = new Date();

  const diffTime = releaseDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const leads = await Lead.find({
    stage: { $ne: 'completed' },
    chatId: { $regex: /@c\.us$/ },
  });

  for (const lead of leads) {
    const hoursSinceLastMessage = lead.lastMessageSentAt
      ? (now - new Date(lead.lastMessageSentAt)) / (1000 * 60 * 60)
      : Infinity;

    switch (lead.stage) {
      case 'welcome': {
        if (hoursSinceLastMessage >= 24) {
          await sendMessageUnofficial(lead.chatId, messages['waiting-group']);
          lead.stage = 'waiting-group';
          lead.lastMessageSentAt = now;
        }
        break;
      }

      case 'waiting-group': {
        if (hoursSinceLastMessage >= 24) {
          await sendMessageUnofficial(lead.chatId, messages['not-in-group']);
          lead.stage = 'not-in-group';
          lead.lastMessageSentAt = now;
        }
        break;
      }

      default: {
        if (diffDays < 12 && typeof lead.stage === 'number' && lead.stage > 0 && lead.stage <= 12) {
          if (hoursSinceLastMessage >= 24) {
            const dayMessage = messages.days[lead.stage];
            if (dayMessage) {
              await sendMessageUnofficial(lead.chatId, dayMessage);
            }

            if (lead.stage === 12) {
              lead.stage = 'completed';
              await sendMessageUnofficial(lead.chatId, messages.completed);
            } else {
              lead.stage += 1;
            }
            lead.lastMessageSentAt = now;
          }
        } else {
          console.log(`Lead ${lead.chatId} no requiere acción.`);
        }
      }
    }

    await lead.save();
  }

  console.log('Tarea de verificación completada.');
},
  {
    scheduled: true,
    timezone: "UTC"
  });