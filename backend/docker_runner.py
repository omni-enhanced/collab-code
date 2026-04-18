import subprocess
import uuid
import os

def run_code_in_docker(code: str):
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.py"

    print("🔥 Running Docker execution...")

    try:
        with open(filename, "w") as f:
            f.write(code)

        current_dir = os.getcwd()

        cmd = f'docker run --rm --network none --memory 100m --cpus 0.5 -v "{current_dir}:/app" python:3.10-slim python /app/{filename}'

        print("COMMAND:", cmd)

        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )

        output = result.stdout + result.stderr

    except Exception as e:
        output = str(e)

    finally:
        if os.path.exists(filename):
            os.remove(filename)

    return output