const http = require('http');
const chalk = require('chalk');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World!\n');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(chalk.bgRed(`Server is running on http://localhost:${PORT}`));
});
