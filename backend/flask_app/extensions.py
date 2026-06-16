# Instâncias de extensões usadas pela aplicação Flask
# Aqui definimos os objetos que serão inicializados no app principal
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()