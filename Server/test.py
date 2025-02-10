import requests
from Metadata import Blockchain_Metadata , Exam_metadata
import base64
from models import Student , Exam_Data
from app import create_app





app = create_app()


def get_crash_exam_from_database(student_id):
    with app.app_context():

        try:
            exam_data_all_rows = Exam_Data.query.filter_by(student_id=student_id).order_by(Exam_Data.EID).all()
            max_index = 0
            resume_data = {}

            if exam_data_all_rows:
                for row in exam_data_all_rows:
                    try:
                        question_number , option = str(row.question_answer).split("-")
                        if int(question_number) > max_index :
                            max_index = int(question_number)
                        
                        resume_data[question_number] = option
                    except:
                        continue
                print("Max index :-" , max_index)
                print("Total questions :-" , Exam_metadata.total_questions)

                if max_index >= Exam_metadata.total_questions:
                    return (-1,-1)
                else:
                    return (max_index , resume_data)
            else:
                # If no records are found then simply return empty resume data with index as 1
                return (1 , {})

        except Exception as e:
            # If error occurs then also return resume data with index as 1
            return (1, {})
        

max_index , resume_data = get_crash_exam_from_database(student_id="admin")
        

print(max_index , resume_data)


# def get_crash_exam_details(student_id):
#     """
#     This functions checks if software crashed while user was giving exam and returns the question index number
#     where the user left the exam.
#     """
#     with app.app_context():
#         try:
#             exam_data_all_rows = Exam_Data.query.filter_by(student_id=student_id).all()
#             max_index = 0
#             resume_data = {}

#             if exam_data_all_rows:
#                 for row in exam_data_all_rows:
#                     try:
#                         question_number , option = str(row.question_answer).split("-")
#                     except:
#                         # If string cannot be splitted it means it is start time
#                         continue

#                     if int(question_number) > max_index :
#                         max_index = int(question_number)
                    
#                     resume_data[question_number] = option
                
#                 return (max_index , resume_data) if max_index < Exam_metadata.total_questions else (-1,-11)
#             else:
#                 return {
#                 "Error" : "No records found"
#             }
#         except Exception as e:
#             return {
#                 "Error" : str(e)
#             }



# def get_all_rows(student_id):
#     with app.app_context():
#         all_rows = Exam_Data.query.filter_by(student_id=student_id).all()
#         for row in all_rows:
#             temp_json = {
#                 "EID" : row.EID,
#                 "student_id" : row.student_id,
#                 "exam_title" : row.exam_title,
#                 "city" : row.city,
#                 "center" : row.center,
#                 "booklet" : row.booklet,
#                 "start_time" : row.start_time,
#                 "que_ans" : row.question_answer,
#                 "suspicious_activity_detected" : row.suspicious_activity,
#                 "end_time" : row.end_time,
#             }
#             print(temp_json)



# get_all_rows(student_id="qqq")
# print(get_crash_exam_details(student_id="ssk"))
