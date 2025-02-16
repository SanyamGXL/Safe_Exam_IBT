from flask import session , jsonify , request
from app import create_app , db
from Metadata import Blockchain_Metadata , Exam_metadata
import algokit_utils
from Blockchain.artifact_file import HelloWorldClient
import threading
import time
from models import Student , Exam_Data
from collections import deque
from sqlalchemy import desc

class QUEUE:

        def __init__(self):
            self.Transactions_Queue = deque()

        def write_transaction(self , json_data):
            student_id = json_data.get("student_id", "-")
            exam_title = Exam_metadata.Exam_title
            city = Exam_metadata.City
            center_name = Exam_metadata.Center
            booklet = Exam_metadata.booklet
            start_time = json_data.get("start_time", "-")
            que_ans = json_data.get("que_ans", "-")
            suspicious_activity_detected = json_data.get("suspicious_activity_detected", "-")
            end_time = json_data.get("end_time", "-")
            # Get the user mnemonic
            with app.app_context():
                student_row = Student.query.filter_by(student_id = student_id).first()

                if student_row:
                    user_mnemonic = student_row.student_mnemonic
                else:
                    print("Student not found !!!")
                    return -1
            
            try:
                deployer = algokit_utils.get_account_from_mnemonic(user_mnemonic)

                app_client = HelloWorldClient(
                Blockchain_Metadata.Algod_Client, creator=deployer, indexer_client=Blockchain_Metadata.Indexer_Client
            )
                response = app_client.quiz_data(
                    student_id=f"{student_id}",
                    exam_title=exam_title,
                    city=city,
                    center_name=center_name,
                    booklet=booklet,
                    start_time=start_time,
                    end_time=end_time,
                    que_ans=que_ans,
                    suspicious_activity_detected=suspicious_activity_detected,
                    wallet_address=deployer.address,
                )
                transaction_id = response.tx_id
                print("Transaction ID :-" , transaction_id)


                with app.app_context():

                    # Now also update the database for transaction ID of a particular row

                    EID = json_data['EID']
                    row_to_be_updated = Exam_Data.query.filter_by(EID=EID).first()

                    if row_to_be_updated:
                        row_to_be_updated.transaction_id = transaction_id
                        db.session.commit()
                        print("Row updated with Transaction ID !!")
                    else:
                        print("Row not found in database")
            
            # Retry logic if transaction fails to get written
            except Exception as e :
                self.Transactions_Queue.appendleft(json_data)

            
        def write_to_database(self,json_data):
            try:
                student_id = json_data.get("student_id", "-")
                exam_title = Exam_metadata.Exam_title
                city = Exam_metadata.City
                center_name = Exam_metadata.Center
                booklet = Exam_metadata.booklet
                start_time = json_data.get("start_time", "-")
                que_ans = json_data.get("que_ans", "-")
                suspicious_activity_detected = json_data.get("suspicious_activity_detected", "-")
                end_time = json_data.get("end_time", "-")

                # Check if this response of user is the last response
                # and matches the highest question number
                
                
                                
                with app.app_context():
                    new_exam_data = Exam_Data(
                        student_id = student_id,
                        exam_title = exam_title,
                        city = city,
                        center = center_name,
                        booklet = booklet,
                        start_time = start_time,
                        question_answer = que_ans,
                        suspicious_activity = suspicious_activity_detected,
                        end_time = end_time,
                        transaction_id = "-", # Transaction ID will be filled when we actually write the transaction to blockchain
                    )

                    db.session.add(new_exam_data)
                    db.session.commit()

                    if que_ans != "-":
                        question_number , option = que_ans.split("-")
                        if int(question_number) >= Exam_metadata.total_questions:
                            # Get all the data of the particular student and 
                            # Send it to be written to blockchain
                            all_rows = Exam_Data.query.filter_by(student_id=student_id).order_by(desc(Exam_Data.EID)).all()
                            for row in all_rows:
                                temp_json = {
                                    "EID" : row.EID,
                                    "student_id" : row.student_id,
                                    "exam_title" : row.exam_title,
                                    "city" : row.city,
                                    "center" : row.center,
                                    "booklet" : row.booklet,
                                    "start_time" : row.start_time,
                                    "que_ans" : row.question_answer,
                                    "suspicious_activity_detected" : row.suspicious_activity,
                                    "end_time" : row.end_time,
                                }
                                self.Transactions_Queue.append(temp_json)

            except Exception as e:
                print("Error writing Exam data to database :-\n" , e)




app = create_app()





@app.route("/write_to_blockchain" , methods = ["POST"])
def write_to_blockchain():

    student_json_data = request.json
    student_id = student_json_data.get("student_id")

    
    if student_id:
        # Add the data to database
        queue_obj.write_to_database(json_data=student_json_data)

        return jsonify({
            "Success" : "Data Added in Queue"
        }) , 200
        
    else:
        print("Student ID is null!!!")
        return jsonify({
                "Error" : "Student ID Not received !!!"
            }) , 400



def transaction_writing_thread():
    global queue_obj , stop_Event

    while not stop_Event.is_set():
        if queue_obj.Transactions_Queue:
            task_json_data = queue_obj.Transactions_Queue.pop()
            if task_json_data:
                
                queue_obj.write_transaction(task_json_data)

if __name__ == "__main__":
    global queue_obj , stop_Event
    stop_Event = threading.Event()
    queue_obj = QUEUE()

    write_transaction_thread = threading.Thread(target=transaction_writing_thread)
    write_transaction_thread.start()
    

    try:
        print("Server is running !!!")
        # app.run(host="0.0.0.0" , port=3333 , debug=False ,ssl_context = "adhoc")
        app.run(host="0.0.0.0" , port=3333 , debug=False)


        # This will run if transactions are pending in queue and user tries to close the server using Ctrl + C
        while len(queue_obj.Transactions_Queue) > 0:
            print("Task pending in queue ")
            time.sleep(1)
        stop_Event.set()

    except Exception as e:
        print("Error Occured" , e)

    finally:
        print("Server Stopped !!")
            