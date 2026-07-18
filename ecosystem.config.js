module.exports = {
    apps: [
        {
            name: 'gemi-dompet', // Give it a unique name
            script: 'npm',
            args: 'start',
            env: {
                PORT: 3005,           // Change this to your desired port
                NODE_ENV: 'production',
            },
        },
    ],
};
