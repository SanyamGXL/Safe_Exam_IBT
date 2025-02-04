import requests
from Metadata import Blockchain_Metadata , Exam_metadata
import base64
from models import Student
from app import create_app


app = create_app()



student_json = {
    "student_id" : "admin",
    # "que_ans" : " 1-C"
}


def get_crash_Exam_Details(student_id):
    with app.app_context():

        try:

            # Get the deployed application ID from Student's ID

            student_row = Student.query.filter_by(student_id=student_id).first()

            if student_row:

                application_id = student_row.student_deployed_app_id


                if application_id:
                    max_question_number = 0
                    # We are picking wallet address and appid from deploy locale file which is imported in this folder
                    question_answer_data = {}
                    response = Blockchain_Metadata.Indexer_Client.search_transactions(
                        application_id=application_id
                    )
                    
                    all_transactions = response["transactions"]

                    for single_transaction in all_transactions:
                        if "global-state-delta" in single_transaction:
                            global_state_delta = single_transaction["global-state-delta"]
                            for single_delta in global_state_delta:
                                try:
                                    attribute = single_delta.get("key")
                                    value = single_delta.get("value").get("bytes")
                                    decoded_attribute = base64.b64decode(attribute).decode("utf-8")
                                    decoded_value = base64.b64decode(value).decode("utf-8")
                                    
                                    # Since sequentially data is retrieved if user has selected multiple answer for same question traversing back and forth then
                                    # The latest answer will be overwritten automatically
                                    if (
                                        decoded_attribute == "global_que_ans"
                                        and value.strip() != "-"
                                    ):
                                        
                                        question_num, answer = decoded_value.strip().split("-")
                                        

                                        question_num = question_num.strip()
                                        if question_num.isdigit():
                                            question_num = int(question_num)

                                            # Apply the logic to replace the maximum of question number 
                                            if question_num > max_question_number:

                                                max_question_number = question_num
                                                

                                            # This logic is for creating dicitonary of question and answers ex.{"1" : "B"} 
                                            
                                            question_answer_data[str(question_num)] = (
                                                answer.strip()
                                            )
                                except:
                                    continue
                    
                    return (max_question_number ,question_answer_data) if max_question_number < len(Exam_metadata.question_paper) else (-1 , -1)
        except Exception as e:
            print("Error :- " , e)

response = get_crash_Exam_Details(student_id="admin")

print(response)
# print("Max question :-" , max_question_number)
# print("Question answer :-" ,question_answer_data)

# response = requests.post(url="http://127.0.0.1:3333//write_to_blockchain" , json=student_json)

# print(response.json())



