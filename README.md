📱 CryptoPulseApp

CryptoPulseApp is a React Native mobile application with a Python Flask backend that allows users to track cryptocurrency prices and receive custom notifications about their favorite coins.
The app integrates with the CoinGecko API to fetch up to 30 cryptocurrencies and provides a clean, modern interface with authentication, scheduling, and dark mode support.

✨ Features

📊 Live Coin Data

View real-time prices and percentage changes of up to 30 cryptocurrencies.

Data is fetched directly from the CoinGecko API
.

⭐ Favorites Page

Mark your favorite coins.

Quickly access them on a dedicated page.

🔔 Custom Notifications

Schedule price alerts and recurring notifications.

Flexible intervals:

Daily (e.g., every morning at 7:00)

Weekly (e.g., every Tuesday at 8:00)

Hourly (e.g., every 8 hours)

Edit or delete existing schedules.

📜 Notification Logs

Keep track of all sent alerts.

Review past notifications at any time.

🎨 Dark Mode

Toggle between light and dark themes.

🔐 User Authentication

Secure login and registration powered by Supabase
.

🛠️ Tech Stack
Frontend (Mobile App)

React Native
 (with Expo)

Tailwind (if used)

State management: [placeholder – e.g., Redux, Context API, Zustand]

Backend

Python Flask

Notification scheduler (custom script or service)

Database & Auth

Supabase
 (Postgres + Auth)

APIs

CoinGecko API

📂 Project Structure
CryptoPulseApp/
│── frontend/         # React Native (Expo) mobile app
│── backend/          # Flask backend
│── scheduler/        # Notification scheduler
│── README.md

🚀 Getting Started
1. Clone the Repository
git clone https://github.com/<your-username>/CryptoPulseApp.git
cd CryptoPulseApp

2. Frontend (React Native with Expo)
cd frontend
npm install
npx expo start

3. Backend (Flask)
cd backend
pip install -r requirements.txt
flask run

4. Notification Scheduler
cd scheduler
python scheduler.py

📸 Screenshots / Demo
<!-- Replace with actual images or video links -->

📱 Home Screen – Live prices and changes

⭐ Favorites – Track your chosen coins

🔔 Notifications – Flexible scheduling

🌙 Dark Mode – Modern UI experience

🎥 Demo Video

🧑‍💻 Roadmap / To-Do

 Improve notification service (push notifications instead of local scheduling)

 Add more coins and filtering options

 Enhance UI with animations and charts

 Add support for multiple languages

🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

📜 License

MIT License

👉 This project was built as a portfolio project to demonstrate skills in mobile development, backend integration, and cloud authentication.