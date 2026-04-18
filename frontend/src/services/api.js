export const runCode = async (code) => {
  try {
    const res = await fetch("http://localhost:8000/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    return data.output;
  } catch (err) {
    return "Error connecting to server";
  }
};