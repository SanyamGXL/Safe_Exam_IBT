import os
import sys
import ctypes
import subprocess
def is_admin():
    """Check if the script is running with administrator privileges."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False

def run_as_admin():
    """Re-run the script as administrator if not already elevated."""
    if not is_admin():
        script = os.path.abspath(sys.argv[0])
        params = " ".join([f'"{arg}"' for arg in sys.argv[1:]])
        
        try:
            subprocess.run(["powershell", "Start-Process", "python", f"'{script}' {params}", "-Verb", "RunAs"], check=True)
        except subprocess.CalledProcessError:
            print("Failed to elevate to admin privileges. Please run manually as administrator.")
        sys.exit()

def register_protocol():
    """Runs the batch file to register the protocol in Windows Registry."""
    script_path = os.path.join(os.getcwd(), "register_protocol.bat")
    
    if os.path.exists(script_path):
        subprocess.run(["cmd", "/c", script_path], shell=True)
    else:
        print("Error: register_protocol.bat not found.")

if __name__ == "__main__":
    run_as_admin()  # Ensures script runs with admin privileges
    register_protocol()  # Runs the registry modification script
    print("Protocol registration complete.")
