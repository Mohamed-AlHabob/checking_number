const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal'); // For displaying QR code in the terminal
const XLSX = require('xlsx'); // For creating Excel files

// Create a new client with LocalAuth for session persistence
const client = new Client({
    authStrategy: new LocalAuth(), // Saves session data locally to avoid scanning QR code every time
    puppeteer: {
        headless: true, // Run in headless mode (no browser UI)
    },
});

// Event: Generate QR code for authentication
client.on('qr', (qr) => {
    console.log('Scan the QR code below to log in:');
    qrcode.generate(qr, { small: true }); // Display QR code in the terminal
});

// Event: Client is authenticated
client.on('authenticated', () => {
    console.log('Client is authenticated!');
});

// Event: Client is ready to use
client.on('ready', async () => {
    console.log('Client is ready!');

    // Set the contactId to the specified value
    const contactId = '967776200929@c.us'; // Replace with the desired contact ID

    try {
        // Get common groups with the contact
        const commonGroups = await client.getCommonGroups(contactId);

        // Log the shared groups
        if (commonGroups.length > 0) {
            console.log(`Shared groups with ${contactId}:`);

            // Fetch full group details (including names) for each group
            const groupData = [];
            for (const group of commonGroups) {
                if (group && group._serialized) {
                    try {
                        // Fetch the full group details using the group ID
                        const fullGroup = await client.getChatById(group._serialized);
                        groupData.push({
                            GroupId: group._serialized,
                            GroupName: fullGroup.name || 'Unnamed Group', // Fallback for unnamed groups
                        });
                    } catch (error) {
                        console.error(`Error fetching details for group ${group._serialized}:`, error);
                    }
                } else {
                    console.warn('Invalid group object:', group);
                }
            }

            // Create a new workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(groupData);

            // Add the worksheet to the workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Shared Groups');

            // Save the workbook to a file
            const fileName = 'shared_groups.xlsx';
            XLSX.writeFile(workbook, fileName);

            console.log(`Group names and IDs saved to ${fileName}`);
        } else {
            console.log(`No shared groups with ${contactId}.`);
        }
    } catch (error) {
        console.error('Error fetching shared groups:', error);
    }
});

// Event: Handle authentication failure
client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

// Event: Handle disconnection
client.on('disconnected', (reason) => {
    console.log('Client was logged out:', reason);
});

// Initialize the client
client.initialize();
