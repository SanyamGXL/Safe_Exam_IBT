from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt




db = SQLAlchemy()



def create_app():
    app = Flask(__name__ , template_folder="templates")
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Database config

    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///users.db"
    app.secret_key = "sanyamssk"
    
    # Database initialization
    db.init_app(app)
    migrate = Migrate(app , db)

    # Encryption
    bcrypt = Bcrypt(app)

    # Import routes
    from routes import create_routes
    create_routes(app , db , bcrypt)


    return app


