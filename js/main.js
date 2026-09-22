// The HBC Volleyball Club — shared page behavior
document.addEventListener("DOMContentLoaded", () => {
  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // Reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("visible"));
  }

  // Contact form: open the visitor's email app with the message pre-filled
  const form = document.querySelector("#contact-form");
  if (form) {
    // Preselect the program when arriving from the boys or girls wing (?program=boys)
    const program = new URLSearchParams(location.search).get("program");
    const select = form.querySelector("[name=program]");
    if (select && program) {
      const match = [...select.options].find((o) => o.value.toLowerCase() === program.toLowerCase());
      if (match) select.value = match.value;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const subject = `HBC ${d.get("program")} Inquiry: ${d.get("interest")} — ${d.get("name")}`;
      const body = [
        `Name: ${d.get("name")}`,
        `Email: ${d.get("email")}`,
        `Phone: ${d.get("phone") || "-"}`,
        `Program: ${d.get("program")}`,
        `Player age: ${d.get("age") || "-"}`,
        `Interested in: ${d.get("interest")}`,
        "",
        d.get("message"),
      ].join("\n");
      location.href = `mailto:kimlucerohb@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
});
