/**
 * Generates a WhatsApp link for a given phone number and message.
 * Handles various phone number formats (stripping symbols, adding country code if missing).
 */
export const getWhatsAppLink = (phone: string, text?: string) => {
    if (!phone) return '';

    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Add Nigeria country code (234) if missing and seems like a local mobile number
    // E.g. 080... -> 23480...
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
        formattedPhone = `234${cleanPhone.substring(1)}`;
    } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('234')) {
        // Assumption: 10 digit number without leading 0 is missing country code
        formattedPhone = `234${cleanPhone}`;
    }

    const encodedText = text ? `&text=${encodeURIComponent(text)}` : '';
    return `https://wa.me/${formattedPhone}?${encodedText}`;
};

/**
 * Generates a mailto link with subject and body.
 */
export const getEmailLink = (email: string, subject: string, body: string) => {
    if (!email) return '';
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
