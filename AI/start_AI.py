##################################################################################################################################


                                        # Invisible terminal #
import subprocess
import os

current_working_dir = os.getcwd() + "/Application"
activate_script = os.path.join("..", ".venv", "Scripts", "activate.bat")

def start_wireless_screen_AI_model():
    wireless_script = "python AI_model_1.py"
    command = f'{activate_script} && {wireless_script}'
    try:
        # Run the wireless AI model without showing a terminal window
        subprocess.Popen(
            command,
            cwd=current_working_dir,
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    except Exception as e:
        print(f"Failed to start wireless screen AI model: {e}")

def start_wired_screen_AI_model():
    wired_script = "python AI_model_2.py"
    command = f'{activate_script} && {wired_script}'
    try:
        # Run the wired AI model without showing a terminal window
        subprocess.Popen(
            command,
            cwd=current_working_dir,
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    except Exception as e:
        print(f"Failed to start wired screen AI model: {e}")

if __name__ == "__main__":
    start_wireless_screen_AI_model()
    start_wired_screen_AI_model()

##################################################################################################################################

##################################################################################################################################

                                        # Visible terminal #


# import subprocess
# import os

# current_working_dir = os.getcwd() + "/Application"
# activate_script = os.path.join("..", ".venv", "Scripts", "activate.bat")


# def start_wireless_screen_AI_model():
#     wireless_script = "python AI_model_1.py"
#     command = f'start cmd /k "{activate_script} && {wireless_script}"'
#     try:
#         # Open a new terminal to run the wireless AI model
#         subprocess.Popen(command, cwd=current_working_dir, shell=True)
#     except Exception as e:
#         print(f"Failed to start wireless screen AI model: {e}")

# def start_wired_screen_AI_model():
#     wired_script = "python AI_model_2.py"
#     command = f'start cmd /k "{activate_script} && {wired_script}"'
#     try:
#         # Open a new terminal to run the wired AI model
#         subprocess.Popen(command, cwd=current_working_dir, shell=True)
#     except Exception as e:
#         print(f"Failed to start wired screen AI model: {e}")

# if __name__ == "__main__":
    
#     # Start AI models in separate terminals
#     start_wireless_screen_AI_model()
#     start_wired_screen_AI_model()




