from app import db
from flask_login import UserMixin


class Student(db.Model , UserMixin):
    __tablename__ = "student"

    SID = db.Column(db.Integer, primary_key=True, autoincrement=True)  # auto-increment SID
    student_id = db.Column(db.String, nullable=False, unique=True)  # student_id is now unique and not a primary key
    student_password = db.Column(db.String, nullable=False)
    student_wallet_address = db.Column(db.String, nullable=False)
    student_private_key = db.Column(db.String, nullable=False)
    student_mnemonic = db.Column(db.String, nullable=False)
    student_deployed_app_id = db.Column(db.String, nullable=False)

    def __repr__(self):
        return f"Student ID {self.SID}"
    
    
    def get_id(self):
        return self.SID
    

class Exam_Data(db.Model):

    __tablename__ = "exam"

    EID = db.Column(db.Integer , primary_key = True , autoincrement = True)
    student_id = db.Column(db.String, nullable=False, unique=False) # Since one student ID can write multiple answers
    exam_title = db.Column(db.String , nullable = False)
    city = db.Column(db.String , nullable = False)
    center = db.Column(db.String , nullable = False)
    booklet = db.Column(db.String , nullable = False)
    start_time = db.Column(db.String , nullable = False)
    question_answer = db.Column(db.String , nullable = False)
    suspicious_activity = db.Column(db.String , nullable = False)
    end_time = db.Column(db.String , nullable = False)
    transaction_id = db.Column(db.String , nullable = False)