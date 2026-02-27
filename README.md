# Smart Lost & Found

Fullstack lost & found application (React + Tailwind, Flask + MongoDB).

Quick start

Backend:

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
# copy .env.example to .env and update values
python app.py
```

### Email/SMTP configuration
The backend sends OTP emails using Flask-Mail. The SMTP settings are read from environment variables (see `backend/app.py`). You can use **any** provider that supports SMTP (Gmail, SendGrid, Mailgun, Outlook, etc.).

Set the following variables in your `.env` file:

```dotenv
# address used as the sender (often the username)
EMAIL_USER=your_smtp_username@example.com
# password or API key for your SMTP account
EMAIL_PASS=your_smtp_password_or_api_key
# optionally override defaults below if your provider differs
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
```

The default `app.py` configuration uses Gmail's server (`smtp.gmail.com:587`) and TLS. For other providers replace `MAIL_SERVER` and `MAIL_PORT` as needed. Example for **SendGrid**:

```dotenv
EMAIL_USER=apikey           # SendGrid uses "apikey" literally as the username
EMAIL_PASS=SG.xxxxxxxx      # your SendGrid API key
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
```

Or for **Mailgun**:

```dotenv
EMAIL_USER=postmaster@mg.yourdomain.com
EMAIL_PASS=your-mailgun-password
MAIL_SERVER=smtp.mailgun.org
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
```

Once the variables are set, restart the backend container (or re-run locally) and test registration.

For development you can also **show the OTP directly in the API response** instead of relying on email. Set the `SHOW_OTP=true` variable in `.env` (already enabled if you followed the earlier instructions) – the registration and claim endpoints will return an `otp` field and the frontend will display it on screen.

If you run into authentication errors, check container logs with:

```bash
cd .. # workspace root
docker-compose logs backend
```Frontend (minimal Vite setup):

```bash
cd frontend
npm install
npm run dev
```
