# Supabase AI Agent

> ⚠️ **Warning**: This project is a demonstration project and should not be used in production environments. It's intended for educational and experimental purposes only.

A modern web application built with React, TypeScript, and Supabase, featuring AI capabilities powered by LangChain and Hugging Face Transformers.

## Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **AI Integration**: 
  - LangChain
  - Hugging Face Transformers
  - OpenAI

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Supabase account and project

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd supabase-ai-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode

1. Make sure you have all the prerequisites installed
2. Set up your environment variables in `.env.local`
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

### Production Build

1. Create a production build:
   ```bash
   npm run build
   ```
2. Preview the production build:
   ```bash
   npm run preview
   ```
3. The preview will be available at `http://localhost:4173`

### Data Ingestion

To run the data ingestion script:
```bash
npm run ingest
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run ingest` - Run the data ingestion script

## Project Structure

```
supabase-ai-agent/
├── src/              # Source code
├── public/           # Static assets
├── supabase/         # Supabase configuration
├── scripts/          # Utility scripts
├── .env              # Environment variables
└── vite.config.ts    # Vite configuration
```

## Features

- Modern React application with TypeScript
- AI-powered functionality using LangChain and Transformers
- Supabase integration for backend services
- Tailwind CSS for styling
- ESLint for code quality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 