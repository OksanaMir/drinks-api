import express from 'express';
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
app.use(
	'/assets',
	(req, res, next) => {
		console.log(`Serving static file request: ${req.path}`);
		next();
	},
	express.static(path.join(__dirname, 'assets'))
);

// Path to drinks data
const drinksFilePath = path.join(__dirname, 'drinks.json');

// Load drinks data
let drinks;
try {
	drinks = JSON.parse(await fs.readFile(drinksFilePath, 'utf-8'));
} catch (error) {
	console.error('Error reading drinks file:', error);
	drinks = [];
}

// Get all drinks
app.get('/api/drinks', (req, res) => {
	res.json(drinks);
});

// Get one drink by ID
app.get('/api/drinks/:id', (req, res) => {
	const { id } = req.params;
	const drink = drinks.find(d => d.id === parseInt(id, 10));

	if (drink) {
		res.json(drink);
	} else {
		res.status(404).json({ error: 'Drink not found' });
	}
});

// Update drink order status
app.patch('/api/drinks/:id', async (req, res) => {
	const { id } = req.params;
	const { op, path, value } = req.body[0];

	if (op === 'replace' && path === '/ordered') {
		const drink = drinks.find(d => d.id === parseInt(id, 10));
		if (drink) {
			drink.ordered = value;
			try {
				await fs.writeFile(
					drinksFilePath,
					JSON.stringify(drinks, null, 2)
				);
				res.json(drink);
			} catch (error) {
				res.status(500).json({ error: 'Failed to update drink data' });
			}
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
