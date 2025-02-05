from flask import Flask , request , jsonify , render_template , session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from models import Student , Exam_Data
from algosdk import account , transaction
from algokit_utils import account as  algokit_accounts
from algosdk.v2client.algod import AlgodClient
import os
import json
from Blockchain.Create_Blockchain_object import Blockchain_Obj
from Metadata import Exam_metadata
import base64
from Metadata import Blockchain_Metadata




def create_routes(app : Flask , db : SQLAlchemy , bcrypt : Bcrypt):

    @app.route("/")
    def index():
        return render_template("signup.html")
    
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
            check_row = Student.query.filter_by(student_id=student_id).first()
            
            if not check_row:
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
                if bcrypt.check_password_hash(student_row.student_password, student_password):

                    # Write the logic that when user logs in successfully then check whether there is any previous data written in blockchain
                    max_question_index , question_answer_data = get_crash_exam_from_database(student_id=student_id)
                    print(max_question_index , question_answer_data)
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
                return jsonify({"Error": "Student does not exist"}), 400
        else:
            return jsonify({"Error": "Student ID or password is null"}), 400
    

    @app.route("/get_exam_metadata" , methods = ["GET"])
    def get_question_paper():
        try:
            if Exam_metadata.question_paper:

                    return jsonify({
                        "question_paper" :Exam_metadata.question_paper,
                        "Exam_Title" : Exam_metadata.Exam_title,
                        "City" : Exam_metadata.City,
                        "Center" : Exam_metadata.Center,
                        "Booklet" : Exam_metadata.booklet
                    }) , 200
        except Exception as e:
            return jsonify({"Error" : e}) , 400
    

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
            exam_data_all_rows = Exam_Data.query.filter_by(student_id=student_id).all()
            max_index = 0
            resume_data = {}

            if exam_data_all_rows:
                for row in exam_data_all_rows:
                    try:
                        question_number , option = str(row.question_answer).split("-")
                    except:
                        continue
                    if int(question_number) > max_index :
                        max_index = int(question_number)
                    
                    resume_data[question_number] = option
                
                return (max_index , resume_data) if max_index < Exam_metadata.total_questions else (-1,-11)
            else:
                return jsonify({
                "Error" : "No records found"
            })

        except Exception as e:
            return jsonify({
                "Error" : str(e)
            })

    
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

        






        

