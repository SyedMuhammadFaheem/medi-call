// Build rows with textContent, never innerHTML: medicine names/instructions are
// free text and must not be able to inject markup into the admin page.
function makeRow(cells, buttons = []) {
  const tr = document.createElement("tr");
  for (const value of cells) {
    const td = document.createElement("td");
    td.textContent = value;
    tr.appendChild(td);
  }
  const actions = document.createElement("td");
  for (const { label, className, onClick } of buttons) {
    const button = document.createElement("button");
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener("click", onClick);
    actions.appendChild(button);
  }
  if (buttons.length > 0) tr.appendChild(actions);
  return tr;
}

async function loadMedications() {
  const res = await fetch("/api/medications");
  const meds = await res.json();
  const tbody = document.querySelector("#medTable tbody");
  tbody.replaceChildren();
  for (const med of meds) {
    tbody.appendChild(
      makeRow([med.name, med.dosage, med.quantity, med.instructions, med.slot, med.active ? "yes" : "no"], [
        { label: "edit", onClick: () => fillForm(med) },
        { label: "delete", className: "danger", onClick: () => deleteMedication(med.id) },
      ]),
    );
  }
}

function fillForm(med) {
  document.querySelector("#medId").value = med.id;
  document.querySelector("#name").value = med.name;
  document.querySelector("#dosage").value = med.dosage;
  document.querySelector("#quantity").value = med.quantity;
  document.querySelector("#instructions").value = med.instructions;
  document.querySelector("#slot").value = med.slot;
  document.querySelector("#active").checked = med.active;
}

async function deleteMedication(id) {
  if (!confirm("Delete this medicine?")) return;
  await fetch(`/api/medications/${id}`, { method: "DELETE" });
  await loadMedications();
}

document.querySelector("#medForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.querySelector("#medId").value;
  const body = {
    name: document.querySelector("#name").value,
    dosage: document.querySelector("#dosage").value,
    quantity: document.querySelector("#quantity").value,
    instructions: document.querySelector("#instructions").value,
    slot: document.querySelector("#slot").value,
    active: document.querySelector("#active").checked,
  };
  const url = id ? `/api/medications/${id}` : "/api/medications";
  const method = id ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { error } = await res.json();
    alert(error);
    return;
  }
  e.target.reset();
  document.querySelector("#medId").value = "";
  await loadMedications();
});

async function loadCallLog() {
  const res = await fetch("/api/call-log");
  const entries = await res.json();
  const tbody = document.querySelector("#logTable tbody");
  tbody.replaceChildren();
  for (const entry of entries) {
    tbody.appendChild(makeRow([entry.calledAt, entry.slot, entry.status, entry.error ?? ""]));
  }
}

loadMedications();
loadCallLog();
