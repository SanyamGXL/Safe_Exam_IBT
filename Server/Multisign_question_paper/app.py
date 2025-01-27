from flask import Flask , request , redirect , url_for , render_template , jsonify
import sqlite3
from algokit_utils import account
from algosdk import account as generate_account
from algosdk import transaction
from algosdk.v2client.algod import AlgodClient
from algosdk.transaction import Multisig , MultisigTransaction
import pickle
import requests
import json
import random
import os


app = Flask(__name__)



algod_client = AlgodClient(
    algod_token= "a" * 64,
    algod_address= "https://testnet-api.algonode.cloud",
)

master_Account = account.get_account_from_mnemonic(
        mnemonic= "toss transfer sure frozen real jungle mouse inch smoke derive floor alter ten eagle narrow perfect soap weapon payment chaos amateur height estate absent cabbage"

)

master_Wallet = master_Account.address
master_private_key = master_Account.private_key





def generate_and_fund_Account(fund_account_address = None):

    ## New user account
    user_private_key , user_wallet_address = generate_account.generate_account()


    ## If wallet address if provided for funding (Multisign address in our case)
    if fund_account_address != None:
        fund_transaction = transaction.PaymentTxn(
        sender=master_Wallet,
        receiver=fund_account_address,
        sp=algod_client.suggested_params(),
        amt=int(1 * 1e6)
    )
    else:
        fund_transaction = transaction.PaymentTxn(
        sender=master_Wallet,
        receiver=user_wallet_address,
        sp=algod_client.suggested_params(),
        amt=int(1 * 1e6)
    )

    signed_fund_Transaction = fund_transaction.sign(master_private_key)

    txid = algod_client.send_transaction(txn=signed_fund_Transaction)

    transaction.wait_for_confirmation(algod_client=algod_client , txid=txid)

    print("Account Funded !!!")

    return (user_private_key , user_wallet_address) if fund_account_address == None else 1




def get_connection():
    conn = sqlite3.connect("multisign.db", check_same_thread=False)
    return conn


def create_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS USERS (
        username VARCHAR PRIMARY KEY, 
        password VARCHAR NOT NULL, 
        transaction_id INT,
        transaction_blob BLOB,
        wallet_address VARCHAR,
        private_key VARCHAR,
        is_signed BOOLEAN
    )
    """)

    conn.commit()
    conn.close()






def create_multisign_transaction():

    ### Create Database
    create_db()



    ## User 1 (Paper host)
    username_1 = "host"
    username_password_1 = "host"
    user1_private_key , user1_wallet_address = generate_and_fund_Account()
    
    ## User 2 (Paper receiver)
    username_2 = "center"
    username_password_2 = "center"
    user2_private_key , user2_wallet_address = generate_and_fund_Account()



    # Multisig setup
    version = 1
    threshold = 2  # Minimum signatures required
    public_keys = [user1_wallet_address, user2_wallet_address]

    multisig = Multisig(
        version=version,
        threshold=threshold,
        addresses=public_keys,
    )

    multisig_address = multisig.address()

    # Only fund the multisign address
    generate_and_fund_Account(fund_account_address=multisig_address)


    # Dummy payment transaction
    dummy_private_key ,dummy_wallet  = generate_account.generate_account()

    dummy_payment_txn = transaction.PaymentTxn(
        sender=multisig_address,
        sp = algod_client.suggested_params(),
        receiver=dummy_wallet,
        amt=0
    )

    multisig_txn = MultisigTransaction(dummy_payment_txn, multisig=multisig)

    pickled_multisign_txn = pickle.dumps(obj=multisig_txn)



    ## Get SQL connection 
    conn = get_connection()
    cursor = conn.cursor()

    transaction_id = random.randint(2000 , 7000)

    cursor.execute(
        "INSERT INTO USERS VALUES (? , ? , ? , ? , ? , ? , ?)",
        (
            username_1,
            username_password_1,
            transaction_id,
            pickled_multisign_txn,
            user1_wallet_address,
            user1_private_key,
            False
        )
    )

    cursor.execute(
        "INSERT INTO USERS VALUES (? , ? , ? , ? , ? , ? , ?)",
        (
            username_2,
            username_password_2,
            transaction_id,
            pickled_multisign_txn,
            user2_wallet_address,
            user2_private_key,
            False
        )
    )

    conn.commit()
    conn.close()


@app.route("/")
def LoginPage():

    return render_template("login.html")


@app.route("/show_transaction" , methods = ["GET","POST"])
def show_transaction():
    try:
        if request.method == "POST":

            user_name = request.form.get("username")

            if not user_name:
                return jsonify({
                    "Invalid" :"User name NULL."
                })

            conn = get_connection()
            cursor = conn.cursor()


            user_row = cursor.execute("SELECT * FROM USERS WHERE username = ?" , (user_name,)).fetchone()
            is_transaction_signed = user_row[6]

            if user_row :
                if not is_transaction_signed:
                    transaction_id = user_row[2]
                    return render_template("show_transaction.html" , username = user_name , transaction_id = transaction_id)
                else:
                    return jsonify({
                        "Done" : "User Already signed the transaction."
                    })
            else:
                return jsonify({
                    "Failure" : "User row not found !!!"
                })
            


        #     pickled_multisign_transaction = pickle.loads(user_row[3])
        #     private_key = user_row[5]
        #     signed_multisign_txn = pickled_multisign_transaction.sign(private_key)


        #     # Check if any user is left to sign the transaction
        #     check_signature_left = cursor.execute(
        #         "SELECT * FROM USERS WHERE is_signed = ?" , (False,)
        #     ).fetchall()


        #     if check_signature_left :
        #         serialized_multisign_transaction = pickle.dumps(obj=signed_multisign_txn)
        #         cursor.execute("UPDATE TABLE USERS SET transaction_blob = ?" , (serialized_multisign_transaction))
        #         cursor.execute("UPDATE TABLE USERS SET is_signed = ?" , (True ,))
        #         return jsonify({
        #                 "Message" : "Not all users have signed Transaction."
        #             })
            
        #     else:
        #         print("ALL users have signed the transaction !!!")

        #         txid = algod_client.send_transaction(signed_multisign_txn)
        #         transaction.wait_for_confirmation(algod_client=algod_client , txid=txid)

        #         print("Transaction successfull !!")
        #         print("Downloading question paper !!")

                
        #         quiz_data_api_url = "https://flask-quiz-app-xi.vercel.app/"
        #         response = requests.get(quiz_data_api_url)
        #         if response.status_code == 200:
        #             print("Questions Data Received !!!")
        #             quiz_question_data = json.loads(response.text)

        #             with open("question_paper.json" , "w") as file:
        #                 json.dump(obj=quiz_question_data , fp=file)
        #             return jsonify({
        #                 "Success" : "Question Set Downloaded !!"
        #             })
        #         else:
        #             return jsonify({
        #                 "Failure" : "Flask server Error."
        #             })
        
        # elif request.method == "GET":
        #     pass


            
            
    except Exception as e :
        return jsonify ({
            "Error" : str(e)
        })


@app.route("/sign_transaction" , methods= ["POST"])
def sign_transaction():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        user_name = request.form.get("username")


        # Check if all users have signed the transaction or not
        check_all_signed_users = len(list(cursor.execute("SELECT username FROM USERS where is_signed = ?" ,(False,)).fetchall())) > 1
        if check_all_signed_users:
            # Not all users have signed hence sign the transaction and save it again
            user_row = cursor.execute("SELECT * FROM USERS WHERE username = ?" , (user_name,)).fetchone()
            multisign_txn = pickle.loads(user_row[3])    
            private_key = user_row[5]

            multisign_txn.sign(private_key)

            

            # Again serialize the transaction and store
            serialized_multisign_transaction = pickle.dumps(obj=multisign_txn)
            cursor.execute("UPDATE USERS SET transaction_blob = ?" , (serialized_multisign_transaction,))
            cursor.execute("UPDATE USERS SET is_signed = ? where username = ?" , (True , user_name))


            conn.commit()
            return jsonify({
                "Success": "Transaction Signed !!!"
            })
        else:
            user_row = cursor.execute("SELECT * FROM USERS WHERE username = ?" , (user_name,)).fetchone()
            multisign_txn = pickle.loads(user_row[3])    
            private_key = user_row[5]

            multisign_txn.sign(private_key)
            txid = algod_client.send_transaction(multisign_txn)
            transaction.wait_for_confirmation(algod_client=algod_client , txid=txid)
            
            # update the db once transactin is confirmed
            cursor.execute("UPDATE USERS SET is_signed = ? where username = ?" , (True , user_name))
            print("Transaction successfull !!")
            print("Downloading question paper !!")

            
            quiz_data_api_url = "https://flask-quiz-app-xi.vercel.app/"
            response = requests.get(quiz_data_api_url)
            if response.status_code == 200:
                print("Questions Data Received !!!")
                quiz_question_data = json.loads(response.text)

                with open("question_paper.json" , "w") as file:
                    json.dump(obj=quiz_question_data , fp=file)
                
                return jsonify({
                        "Success" : "Question Set Downloaded !!"
                    })
            else:

                return jsonify({
                    "Failure" : "Flask server Error."
                })

    except Exception as e :
        print("Error :- \n" , e)

        return jsonify ({
            "Error" : str(e)
        })

    
if __name__ == "__main__":

    if not os.path.exists("multisign.db"):
        create_multisign_transaction()
    
    app.run(host="0.0.0.0" , port=4545 , debug=False)
