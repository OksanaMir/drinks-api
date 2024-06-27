import express from 'express';
// import * as cors from 'cors';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setting up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(
	cors({
		allowedHeaders: [
			'sessionId',
			'Content-Type',
			'Authorization',
			'authorization'
		],
		exposedHeaders: ['sessionId'],
		origin: ['https://cafelora-2024.vercel.app', 'http://localhost:5173'],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: false,
		preflightContinue: false
	})
);
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "assets" directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Path to drinks data
const drinksFilePath = path.join(__dirname, 'drinks.json');

// Load drinks data
let drinks = JSON.parse(await fs.readFile(drinksFilePath, 'utf-8'));

// Get all drinks
app.get('/api/drinks', (req, res) => {
	res.json(drinks);
});

// Update drink order status
app.patch('/api/drinks/:id', async (req, res) => {
	const { id } = req.params;
	const { op, path, value } = req.body[0];

	if (op === 'replace' && path === '/ordered') {
		const drink = drinks.find(d => d.id === parseInt(id));
		if (drink) {
			drink.ordered = value;
			await fs.writeFile(drinksFilePath, JSON.stringify(drinks, null, 2));
			res.json(drink);
		} else {
			res.status(404).json({ error: 'Drink not found' });
		}
	} else {
		res.status(400).json({ error: 'Invalid operation' });
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
