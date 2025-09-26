# Safe Exam IBT (Internet Based Examination)

This project is a the replica of CBT version of Safe Exam , blockchain-integrated online examination system. It leverages Flask for the backend, SQLAlchemy for database management, and Algorand blockchain for recording exam transactions. The frontend is built using a modern React application.

---

## Prerequisites

- Python 3.10+
- Node.js and npm

---

### Project Structure

Safe_Exam_IBT/
│
├─ Blockchain/           # Blockchain interaction and smart contract logic
├─ Metadata/             # Exam and blockchain metadata
├─ Server/               # Flask backend, database models, routes, and executables
│   ├─ app.py
│   ├─ models.py
│   ├─ Routes.py
│   ├─ run.py
│   └─ setup.exe
├─ safeexam-frontend/    # React frontend
│   └─ package.json
└─ README.md

---

## Setup Instructions


### Frontend Installation

1. Navigate to the frontend directory (safeexam-frontend) for installation:


```
npm install
```

---

### Backend Setup (Windows)

<p> Run setup.exe </p>

- This is a one-time step.

- The executable will:

    - Create a Python virtual environment.

    - Install all required Python libraries.

    - Initialize the Flask server structure.

<p> Database Initialization </p>

- Navigate to the backend server directory and initialize the database using Flask-Migrate:

```
flask db init
flask db migrate
flask db upgrade
```

- This step sets up the SQLite database (users.db) and applies the required schema.

---


### Start the Backend Server

```
python run.py
```

- This will start the Flask server at http://0.0.0.0:3333.


---

### Access the Application

<p> Open the server URL in a browser.

- The signup page will load where new students can register to take the exam.

<p> Student Signup </p>

- Fill in the required details (Student ID and Password).

- A blockchain wallet will automatically be generated for the student.

- This wallet will be used to record exam responses on the Algorand Testnet.

---


### Start the Examination

- After successful signup, run Run.exe to start the exam application.</p>

    - This executable will open the exam interface.

    - Each response is recorded both in the backend database and queued for blockchain recording.

- The system ensures that any unfinished exams (due to software crashes or network issues) can be resumed from the last answered question.

---


### Additional Notes

- The exam data is queued and written asynchronously to the blockchain to prevent delays in the student interface.

- IP registration ensures that only registered devices can access the exam.

- Suspicious activity tracking is integrated and stored in the database.

- Admin APIs are available to:

- Fetch all exam data

- View city-wise and center-wise participation

- Identify suspicious users


---


### Workflow

1. Install frontend dependencies (npm install in safeexam-frontend).

2. Run setup.exe to prepare Python environment and libraries.

3. Initialize the database (flask db init/migrate/upgrade).

4. Start the server (python run.py).

5. Signup students via the server URL.

6. Launch Run.exe to begin the examination.