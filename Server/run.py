from flask import session , jsonify , request
from app import create_app
from Metadata import Blockchain_Metadata , Exam_metadata
import algokit_utils
from Blockchain.artifact_file import HelloWorldClient
import threading
import time
from models import Student
from collections import deque

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
            user_mnemonic = json_data.get("user_mnemonic", "-")


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
                sender_wallet = response.tx_info["txn"]["txn"]["snd"]
                return transaction_id, sender_wallet
            
            # Retry logic if transaction fails to get written
            except Exception as e :
                self.Transactions_Queue[0] = json_data
            


app = create_app()




@app.route("/write_to_blockchain" , methods = ["POST"])
def write_to_blockchain():

    student_json_data = request.json
    student_id = student_json_data.get("student_id")

    
    if student_id:
        student_row = Student.query.filter_by(student_id = student_id).first()
        
        if student_row:
            student_menmonic = student_row.student_mnemonic

            student_json_data.update({
                "user_mnemonic" : student_menmonic,
            })


            queue_obj.Transactions_Queue.appendleft(student_json_data)
            

            return jsonify({
                "Success" : "Data Added in Queue"
            }) , 200
        else:
            print("ID not found in session")
            return jsonify({
                "Error" : "ID not found in session , Login Again !!!"
            }) , 400
        
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
            