const { Client, LocalAuth } = require('whatsapp-web.js');
const XLSX = require('xlsx');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
    },
});

const targetNumber = "967776200929@c.us";
const groupsWithNumber = [];

client.on('ready', async () => {
    console.log('Client is ready!');

    try {
        const chats = await client.getChats();
        const groups = chats.filter(chat => chat.isGroup);

        for (const group of groups) {
            console.log(`Checking group: ${group.name}`);

            try {
                const participants = await group.fetchParticipants();

                const isNumberInGroup = participants.some(participant => {
                    const participantNumber = participant.id.user; // Get the number in the format "number@c.us"
                    return participantNumber === targetNumber;
                });

                if (isNumberInGroup) {
                    console.log(`Number found in group: ${group.name}`);
                    groupsWithNumber.push(group.name);
                }
            } catch (error) {
                console.error(`Error fetching participants for group ${group.name}:`, error.message);
            }
        }

        if (groupsWithNumber.length > 0) {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet([["Group Name"], ...groupsWithNumber.map(name => [name])]);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Groups");
            XLSX.writeFile(workbook, 'groups_with_number.xlsx');
            console.log('Excel file saved: groups_with_number.xlsx');
        } else {
            console.log('Number not found in any group.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.destroy();
    }
});

client.on('qr', (qr) => {
    console.log('Scan the QR code to log in:');
    qrcode.generate(qr, { small: true });
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

client.initialize();