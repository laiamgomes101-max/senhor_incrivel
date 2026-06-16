from extensions import db
import bcrypt

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode('utf-8'), 
            self.password_hash.encode('utf-8')
        )