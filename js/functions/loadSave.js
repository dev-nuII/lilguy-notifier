// functions/loadSave.js
// (moved out of js/cloud.js)

async function loadSave() {
  try {
    const resp = await fetch("/api/load-save", {
      credentials: "include",
    });

    if (!resp.ok) {
      throw new Error("Server returned " + resp.status);
    }

    const data = await resp.json();
    return data.save;

  } catch (e) {
    console.log("cloud load failed:", e);
    loadFailed = true;
    return null;
  }
}
