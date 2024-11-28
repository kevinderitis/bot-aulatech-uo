import { getLeadByChatId, createLead, getAllLeads, getLastPendingLeads } from "../dao/leadDAO.js";

export const formatNumber = number => {
    return `${number}@c.us`;
}

export const formatChatId = chatId => {
    let number = chatId.split("@")[0];
    return number;
}

export const createResponse = async chatId => {
    let number;
    let response;
    let text;
    try {
        console.log(`Buscando lead chatId:  ${chatId}`);
        let lead = await getLeadByChatId(chatId);
        if (lead) {
            number = lead.clientPhone;
            text = 'Veo que ya te comunicaste anteriormente. Te envio el contacto de tu cajero para que te pongas en contacto.';
        } else {
            let clientData = await getNextClient();
            await createLeadService(chatId, clientData.phoneNumber);
            number = clientData.phoneNumber;
            text = `¡Hola! 👋 ¿Estas listo para jugar? Para darte la mejor atención, tenés un cajero personal para hablar con vos. Acá te envío el numero. ¡Mucha suerte! 🍀`;
        }

        response = {
            formated: formatNumber(number),
            number,
            text
        };

        return response;
    } catch (error) {
        throw error;
    }

}

export const createLeadService = async (chatId, clientPhone) => {
    try {
        let newLead = await createLead(chatId, clientPhone);
        return newLead;
    } catch (error) {
        throw error;
    }
}

export const getLeads = async filter => {
    try {
        let leads = await getAllLeads(filter);
        return leads;
    } catch (error) {
        throw error;
    }
}

export const getLastPendingLeadsService = async () => {
    try {
        let leads = await getLastPendingLeads();
        return leads;
    } catch (error) {
        throw error;
    }
}

export const getLeadByChatIdService = async chatId => {
    try {
        let leads = await getLeadByChatId(chatId);
        return leads;
    } catch (error) {
        throw error;
    }
}

export const validateLeadPayment = async (chatId) => {
    try {
        let lead = await getLeadByChatId(chatId);

        if (!lead) {
            return true;
        }

        if (!lead.payment) {
            return false;
        }

        const paymentDate = new Date(lead.payment);
        const now = new Date();

        const differenceInMs = now - paymentDate;

        const differenceInHours = differenceInMs / (1000 * 60 * 60);

        if (differenceInHours < 15) {
            console.log('El pago se realizó hace menos de 15 horas.');
            return true;
        } else {
            console.log('El pago se realizó hace más de 15 horas.');
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const saveLeadPayment = async (chatId) => {
    try {
        let lead = await Lead.findOne({ chatId });

        if (!lead) {
            throw new Error('Lead no encontrado');
        }

        lead.payment = new Date();

        await lead.save();

        console.log(`Fecha de pago registrada para el lead con chatId: ${chatId}`);
        return lead;
    } catch (error) {
        console.log('Error al registrar el pago:', error);
        throw error;
    }
};

export const createWelcomeMessage = async chatId => {
    try {
        let preference = await createPaymentPreference(chatId);
        let welcomeMessage = `Para proceder con el pago y revelar lo que el tarot tiene para vos, hacelo a través del siguiente link de pago seguro: ${preference}. Una vez realizada la transacción, avisame para verificar la confirmación del pago y así proceder con la tirada de cartas de tarot. Estoy aquí para brindarte orientación y claridad en este momento.`;
        return welcomeMessage;
    } catch (error) {
        console.log(error);
        throw error;
    }

}

export const createPaymentMessage = async chatId => {
    try {
        let preference = await createPaymentPreference(chatId);
        let welcomeMessage = `Hola! para acceder a otra tirada de cartas te dejo el link de pago seguro: ${preference}. Cuando se acredite el pago comenzaremos con la nueva tirada.`;
        return welcomeMessage;
    } catch (error) {
        console.log(error);
        throw error;
    }

}

export const createLinkMessage = async (message, chatId) => {
    const regex = /https:\/\/www\.linkdepago\.com\/pagar/g;
    let preference = await createPaymentPreference(chatId);

    if (regex.test(message)) {
        return message.replace(regex, preference);
    }

    return message;
}