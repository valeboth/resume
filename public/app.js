(async () => {
  const el = document.getElementById("view-count");
  if (!el) return;

  try {
    const res = await fetch("/api/views", { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    el.textContent = Number(data.views).toLocaleString("en-US");
  } catch {
    // If the counter is unreachable, hide it rather than showing an error.
    const footer = el.closest(".views");
    if (footer) footer.style.display = "none";
  }
})();
