def run_code(code: str):
    try:
        exec(code)
        return "Code executed"
    except Exception as e:
        return str(e)