from flask import Flask , request , jsonify , render_template , session , send_file
from flask_sqlalchemy import SQLAlchemy , session
from flask_bcrypt import Bcrypt
from models import Student , Exam_Data , Registered_device
from algosdk import account , transaction
from algokit_utils import account as  algokit_accounts
from algosdk.v2client.algod import AlgodClient
import os
import json
from Blockchain.Create_Blockchain_object import Blockchain_Obj
from Metadata import Exam_metadata
import base64
from Metadata import Blockchain_Metadata
import io
from sqlalchemy import func ,distinct


def create_routes(app : Flask , db : SQLAlchemy , bcrypt : Bcrypt):

    @app.route("/")
    def index():
        return render_template("signup.html")
    

    @app.route("/send_setup_exe/<student_id>", methods=['GET'])
    def send_setup_exe(student_id):

        student_row = Student.query.filter_by(student_id=student_id).first()

        if student_row:

            # Ensure that the exe file exists
            exe_file_path = "setup.exe"  # Provide the correct path if necessary
            if not os.path.exists(exe_file_path):
                return "EXE file not found", 404

            # Return the exe file as a response
            return send_file(exe_file_path, as_attachment=True)
        else:
            return jsonify({"Error" : "Student not registered."})

    @app.route("/send_registration_json/<student_id>", methods=['GET'])
    def send_registration_json(student_id):
        # Ensure the student_id is provided
        if not student_id:
            return "Missing 'student_id'", 400
        

        student_row = Student.query.filter_by(student_id=student_id).first()

        if student_row:


            student_data = {
                "student_id": student_id,
                "backend_url": "http://127.0.0.1:3333",
                "blockchain_endpoint": "/write_to_blockchain",
                "register_endpoint": "/register_device"
            }
            
            # Create a BytesIO stream to hold the JSON data
            json_file = io.BytesIO()
            json_file.write(json.dumps(student_data).encode('utf-8'))
            json_file.seek(0)  # Reset the pointer to the beginning of the stream

            # Return the JSON file as a response
            return send_file(json_file, as_attachment=True, download_name=f"registration_data.json", mimetype="application/json")
        else:
            return jsonify({"Error" : "Student ID not registered."})

    
    @app.route("/signout/<student_id>", methods=["POST"])
    def signout(student_id):
        
        if session.get(student_id):
            session.pop(student_id)  # Remove the user from the session
            return jsonify({"message": f"User {student_id} signed out successfully."}), 200
        else:
            return jsonify({"error": "User not found in session or already signed out."}), 404
    

    @app.route("/login_page")
    def login_page():
        return render_template("login.html")
    
    
    @app.route("/signup", methods = ['POST'])
    def signup():
        
        student_id = request.form.get("student_id")
        student_password = request.form.get("student_password")


        if student_id and student_password:
            # Check if student ID already exists or not
            already_login_check_row = Student.query.filter_by(student_id=student_id).first()

            

            
            if not already_login_check_row:
                student_blockchain_obj = Blockchain_Obj(
                    user_id=student_id,
                    user_already_exist=False,
                    user_json_data=None
                )

                try:
                    hashed_password = bcrypt.generate_password_hash(password=student_password).decode("utf-8")
                    new_student = Student(
                        student_id = student_id,
                        student_password = hashed_password,
                        student_wallet_address = student_blockchain_obj.address,
                        student_private_key = student_blockchain_obj.private_key,
                        student_mnemonic = student_blockchain_obj.new_mnemonic,
                        student_deployed_app_id = student_blockchain_obj.deployed_app
                    )
                    db.session.add(new_student)
                    db.session.commit()

                    return jsonify({
                        "Success" : "User Created !!!"
                    }) ,200

                except Exception as e :
                    print("Error :-" , e)
                    return jsonify({
                        "Error" : "Error inserting data in table"
                    }) ,400

            else:
                return jsonify({
                "Error" : "Student ID already exists."
            }) , 400

        else:
            return jsonify({
                "Error" : "Username or Password is null."
            }) , 400
    

    @app.route("/login", methods=['POST'])
    def login():
        student_id = request.form.get("student_id")
        student_password = request.form.get("student_password")

        if student_id and student_password:
            student_row = Student.query.filter_by(student_id=student_id).first()

            if student_row:
                # Also check if the student ID is registered with IP address or not
                ip_register_check_row = Registered_device.query.filter_by(student_id = student_id).first()

                if ip_register_check_row:

                    if bcrypt.check_password_hash(student_row.student_password, student_password):

                        # Write the logic that when user logs in successfully then check whether there is any previous data written in blockchain
                        max_question_index , question_answer_data = get_crash_exam_from_database(student_id=student_id)
                        if max_question_index == -1 and question_answer_data == -1:
                            return jsonify({"Status": "Exam Completed"}), 400
                        else:
                            
                            return jsonify({
                                "max_question_number" : max_question_index,
                                "question_answer_data" : question_answer_data
                            }), 200
                    else:
                        return jsonify({"Error": "Incorrect password"}), 400
                else:
                    return jsonify({"Error": "IP not registered."}), 400
            else:
                return jsonify({"Error": "Student does not exist"}), 400
        else:
            return jsonify({"Error": "Student ID or password is null"}), 400
        


    @app.route("/get_all_quiz_data" , methods=['GET' , 'POST'])
    def get_all_quiz_data():
        try:

            exam_data_all_rows_with_wallet = db.session.query(Exam_Data , Student.student_wallet_address).join(Student , Student.student_id == Exam_Data.student_id).all()
            exam_data = [{
                "student_id" : row.student_id,
                "exam_title" : row.exam_title,
                "city" : row.city,
                "center" : row.center,
                "booklet" : row.booklet,
                "start_time" : row.start_time,
                "question_answer" : row.question_answer,
                "supicious_activity" : row.suspicious_activity,
                "end_time" : row.end_time,
                "transation_id" : row.transaction_id,
                "wallet_address" : wallet_address
            } for row , wallet_address in exam_data_all_rows_with_wallet]

            return exam_data , 200
        except Exception as e:
            return jsonify({"error" : str(e)}) , 400
        

    @app.route("/get_suspicious_user_count" , methods = ['GET'])
    def get_suspicious_user_count():

        try:
            suspicious_count = db.session.query(Exam_Data.student_id).filter(Exam_Data.suspicious_activity.like("yes%")).distinct().count()
            total_student_count = db.session.query(Exam_Data.student_id).distinct().count()

            return jsonify({
                "suspicious_count" :suspicious_count,
                "total_student_count" : total_student_count
            }) , 200
        except Exception as e :
            return jsonify({"Error" : str(e)})

    @app.route("/get_citywise_count" , methods = ['GET'])
    def get_citywise_count():

        try:
            distinct_count_query = (
                db.session.query(Exam_Data.city, func.count(func.distinct(Exam_Data.student_id)).label("student_count"))
                .group_by(Exam_Data.city)
                .all()
            )
            city_wise_suspicious_count = (
                db.session.query(
                    Exam_Data.city,  
                    func.count(distinct(Exam_Data.student_id))  
                )
                .filter(Exam_Data.suspicious_activity.like("yes%"))  
                .group_by(Exam_Data.city)  
                .all()
            )
            
            citywise_count = [{"city" : data[0] , "count":data[1]} for data in distinct_count_query]
            city_wise_suspicious_count = [{"city" : city , "count" : count} for city , count in city_wise_suspicious_count]
            return jsonify({
                "citywise_count" : citywise_count,
                "citywise_suspicious_count" : city_wise_suspicious_count
            }) , 200
        except Exception as e :
            return jsonify({"Error" : str(e)})


    @app.route("/get_centerwise_count" , methods = ['GET'])
    def get_centerwise_count():

        try:
            distinct_count_query = (
                db.session.query(Exam_Data.center, func.count(func.distinct(Exam_Data.student_id)).label("student_count"))
                .group_by(Exam_Data.city)
                .all()
            )

            center_wise_suspicious_count = (
                db.session.query(
                    Exam_Data.center,  
                    func.count(distinct(Exam_Data.student_id))  
                )
                .filter(Exam_Data.suspicious_activity.like("yes%"))  
                .group_by(Exam_Data.center)  
                .all()
            )
            center_count = [{"center" : data[0] , "count":data[1]} for data in distinct_count_query]
            center_wise_suspicious_count = [{"center" : city , "count" : count} for city , count in center_wise_suspicious_count]

            return jsonify({
                "centerwise_count" : center_count,
                "centerwise_suspicious_count" : center_wise_suspicious_count
            }) , 200
        except Exception as e :
            return jsonify({"Error" : str(e)})

    @app.route("/get_wallet_data/<wallet_address>" , methods = ["GET"])
    def get_wallet_data(wallet_address):
        try:
            wallet_data = (
                db.session.query(Exam_Data)
                .join(Student, Student.student_id == Exam_Data.student_id)  # Join with Student table
                .filter(Student.student_wallet_address == wallet_address)  # Filter by wallet address
                .all()
            )
            
            wallet_data = [
                {
                "student_id" : row.student_id,
                "exam_title" : row.exam_title,
                "city" : row.city,
                "center" : row.center,
                "booklet" : row.booklet,
                "start_time" : row.start_time,
                "question_answer" : row.question_answer,
                "supicious_activity" : row.suspicious_activity,
                "end_time" : row.end_time,
                "transation_id" : row.transaction_id,
                "wallet_address" : wallet_address,
            }
                for row in wallet_data
            ]
            return jsonify(wallet_data) , 200
        except Exception as e :
            return jsonify({"Error" : str(e)}) , 400
    
    @app.route("/get_exam_metadata" , methods = ["GET"])
    def get_question_paper():
        try:
            if Exam_metadata.question_paper:

                    return jsonify({
                        "question_paper" :Exam_metadata.question_paper,
                        "Exam_Title" : Exam_metadata.Exam_title,
                        "City" : Exam_metadata.City,
                        "Center" : Exam_metadata.Center,
                        "Booklet" : Exam_metadata.booklet,
                        "Exam_start_time" : Exam_metadata.Exam_start_time.strftime(format='%H:%M:%S'),
                        "Exam_end_time" : Exam_metadata.Exam_End_time.strftime(format='%H:%M:%S')
                    }) , 200
        except Exception as e:
            return jsonify({"Error" : e}) , 400
    
    @app.route("/register_device", methods=['POST'])
    def register_device():
        try:
            registration_data = request.json
            student_id = registration_data.get('student_id')
            ip_address = registration_data.get('ip_address')

            if not student_id:
                return jsonify({"Error": "StudentID empty"}), 400 

            # Check if student ID is signed up.
            check_student_id = Student.query.filter_by(student_id=student_id).first() 

            if not check_student_id:
                return jsonify({"Error": "User not Signed up."}), 400  

            # Check if student ID exists in registration database
            existing_row = Registered_device.query.filter_by(student_id=student_id).first() 

            if existing_row:
                existing_row.ip_address = ip_address
                db.session.commit()
                return jsonify({"Success": "IP updated"}), 200  # FIX: Proper return statement

            # If no existing record, add new one
            new_registration = Registered_device(
                student_id=student_id,
                ip_address=ip_address
            )
            db.session.add(new_registration)
            db.session.commit()

            return jsonify({"Success": "Device registered"}), 200
        
        except Exception as e:
            return jsonify({"Error": str(e)}), 400  # FIX: Properly convert exception to string

    

    @app.route("/generate_account", methods = ["POST"])
    def generate_account():
        try:
            private_key , wallet_address = generate_and_fund_account()

            return jsonify({
                "private_key" : private_key,
                "wallet_address" : wallet_address
            }) , 200
        
        except Exception as e :
            return jsonify({
                "Error" : "Error generating and funding account"
            }) , 400



    def get_crash_exam_from_database(student_id):
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
        

    
    def get_crash_exam_details(student_id):
        """
        This functions checks if software crashed while user was giving exam and returns the question index number
        where the user left the exam.
        """
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
                    
                    return (max_question_number ,question_answer_data) if max_question_number < Exam_metadata.total_questions else (-1 , -1)
                else:
                    return jsonify({
                        "Error" : "Deployed application not found !!!"
                    }) , 400 
            else:
                return jsonify({
                    "Error" : "Student ID not found !!!"
                }) , 400
        except Exception as e:
            return jsonify({
                "Error" : str(e)
            }) , 400
    def generate_and_fund_account():
        try:
            # Master account for funding
            master_mnemonic = "toss transfer sure frozen real jungle mouse inch smoke derive floor alter ten eagle narrow perfect soap weapon payment chaos amateur height estate absent cabbage"
            master_account = algokit_accounts.get_account_from_mnemonic(mnemonic=master_mnemonic)

            master_wallet_address = master_account.address
            master_private_key = master_account.private_key


            # Algo client
            algod_client = AlgodClient(algod_token= "a"*64 , algod_address="https://testnet-api.algonode.cloud")

            # Student account
            private_key , wallet_address = account.generate_account()

            payment_txn = transaction.PaymentTxn(
                sender=master_wallet_address,
                sp=algod_client.suggested_params(),
                receiver=wallet_address,
                amt=int(1 * 1e6)
            )

            signed_txn = payment_txn.sign(master_private_key)
            txid = algod_client.send_transaction(txn=signed_txn)
            transaction.wait_for_confirmation(algod_client , txid)
            return (private_key , wallet_address)
        except Exception as e:
            return -1

        






        

