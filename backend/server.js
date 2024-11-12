const cors = require('cors');

// or wherever your CORS configuration is
app.use(cors({
  origin: [
    'http://localhost:5173',  // Local development
    'https://stirring-longma-bc41fd.netlify.app', // Your Netlify domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})); 