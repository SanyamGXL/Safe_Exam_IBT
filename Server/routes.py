from flask import Flask , request , jsonify , render_template
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from models import Student
from algosdk import account , transaction
from algokit_utils import account as  algokit_accounts
from algosdk.v2client.algod import AlgodClient
from werkzeug.security import check_password_hash

def create_routes(app : Flask , db : SQLAlchemy , bcrypt : Bcrypt):

    @app.route("/")
    def index():
        return render_template("signup.html")
    

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
                # Student does not exists

                # Create a wallet address and private key and fund it
                try:
                    student_private_key , student_wallet_address = generate_and_fund_account()
                except Exception as e:
                    return jsonify({
                            "Error" : "Error generating account"
                        })

                try:

                    hashed_password = bcrypt.generate_password_hash(password=student_password).decode("utf-8")
                    new_student = Student(
                        student_id = student_id,
                        student_password = hashed_password,
                        student_wallet_address = student_wallet_address,
                        student_private_key = student_private_key
                    )
                    db.session.add(new_student)
                    db.session.commit()

                    return jsonify({
                        "Success" : "User Created !!!"
                    })

                except Exception as e :
                    print("Error :-" , e)
                    return jsonify({
                        "Error" : "Error inserting data in table"
                    })

            else:
                return jsonify({
                "Error" : "Student ID already exists."
            })


        else:
            return jsonify({
                "Error" : "Username or Password is null."
            })
        
    @app.route("/login", methods = ['POST'])
    def login():
        try:
            student_id = request.form.get("student_id")
            student_password = request.form.get("student_password")

            if student_id and student_password:
                # Query the database for the student
                student_row = Student.query.filter_by(student_id=student_id).first()

                if student_row:
                    # Use bcrypt to check if the entered password matches the stored hashed password
                    if bcrypt.check_password_hash(student_row.student_password, student_password):
                        return jsonify({
                            "Success": "User Logged In !!"
                        })
                    else:
                        return jsonify({
                            "Error": "Incorrect password"
                        })
                else:
                    return jsonify({
                        "Error": "Student does not exist"
                    })
            else:
                return jsonify({
                    "Error": "Student ID or password is null"
                })

        except Exception as e:
            return jsonify({
                "Error": str(e)
            }) 
    
    @app.route("/generate_account", methods = ["POST"])
    def generate_account():
        try:

            private_key , wallet_address = generate_and_fund_account()

            return jsonify({
                "private_key" : private_key,
                "wallet_address" : wallet_address
            })
        
        except Exception as e :
            return jsonify({
                "Error" : "Error generating and funding account"
            }) 
    
    
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






        

