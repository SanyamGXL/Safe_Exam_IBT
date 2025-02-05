import requests
from Metadata import Blockchain_Metadata , Exam_metadata
import base64
from models import Student , Exam_Data
from app import create_app


app = create_app()


def get_crash_exam_details(student_id):
    """
    This functions checks if software crashed while user was giving exam and returns the question index number
    where the user left the exam.
    """
    with app.app_context():

        try:
            exam_data_all_rows = Exam_Data.query.filter_by(student_id=student_id).all()
            max_index = 0
            resume_data = {}

            if exam_data_all_rows:
                for row in exam_data_all_rows:
                    try:
                        question_number , option = str(row.question_answer).split("-")
                    except:
                        # If string cannot be splitted it means it is start time
                        continue

                    if int(question_number) > max_index :
                        max_index = int(question_number)
                    
                    resume_data[question_number] = option
                
                return (max_index , resume_data) if max_index < Exam_metadata.total_questions else (-1,-11)
            else:
                return {
                "Error" : "No records found"
            }
        except Exception as e:
            return {
                "Error" : str(e)
            }



print(get_crash_exam_details(student_id="ssk"))
