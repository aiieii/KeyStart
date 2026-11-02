# KeyStart

KeyStart helps fresh graduates and young adults find their first home with confidence. With an AI housing assistant to answer questions at any time and our Smart Budget Planner to keep track of finances, KeyStart makes it easier to choose a home that fits your budget.

The website was created during the DDAS AI Bootcamp Hackathon in June 2026, where my team and I secured **3rd place**. At the bootcamp, we learned AI prompting strategies and how LLMs work. As the team leader, I applied that knowledge to build this website alongside my team, using Antigravity as an AI-assisted development tool.

## Demo

Watch the short demo: https://youtu.be/nJlxgqMyorE

## Features

- **Smart Budget Planner:** suggests listings based on your budget and preferences.
- **AI Housing Assistant:** answers housing-related questions using the Gemini API.
- **Housing Dashboard:** browse and compare listings within your budget and preferences. Each listing links to its PropertyGuru page.

## My Role

I built the website with the help of Antigravity, and my teammate built the feature that lets users compare listings from PropertyGuru.

## Tech Stack

React, Vite, JavaScript, Google Gemini API

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/aiieii/KeyStart.git
   cd KeyStart
   ```
2. Copy `.env.example` to `.env` and add your own Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
3. Install and run:
   ```
   npm install
   npm run dev
   ```