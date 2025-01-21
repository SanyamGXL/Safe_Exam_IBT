from app import db



class Student(db.Model):

    __tablename__ = "student"


    student_id = db.Column(db.String , primary_key = True)
    student_password = db.Column(db.String , nullable = False)
    student_wallet_address = db.Column(db.String , nullable = False)
    student_private_key = db.Column(db.String , nullable = False)


    def __repr__(self):
        return f"Student ID {self.student_id}"
    


