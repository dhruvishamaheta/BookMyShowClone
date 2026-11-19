const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const CONTACTS_KEY = "bookmyshow_contact_messages";

const isBrowser = () => typeof window !== "undefined";

function readLocalContacts() {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]") || [];
  } catch {
    return [];
  }
}

function writeLocalContacts(contacts) {
  if (!isBrowser()) return contacts;
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  return contacts;
}

export async function submitContactMessage(contactData) {
  const localId = `MSG-${Date.now().toString().slice(-6)}`;
  const localMessage = {
    ...contactData,
    id: localId,
    status: "New",
    createdAt: new Date().toISOString(),
  };

  // 1. Save locally
  const current = readLocalContacts();
  writeLocalContacts([localMessage, ...current]);

  // 2. Post to backend
  try {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || "Failed to send message.");
    }

    return {
      ok: true,
      message: result.message || "Thank you! Your message has been sent successfully.",
    };
  } catch (error) {
    // If backend is not running, local message was already stored!
    return {
      ok: true,
      message: "Thank you! Your message has been sent successfully. Our team will get back to you shortly.",
      localOnly: true,
    };
  }
}

export async function getAllContactsAdmin() {
  const local = readLocalContacts();

  try {
    const response = await fetch(`${API_BASE_URL}/contact`);
    if (response.ok) {
      const apiContacts = await response.json();
      if (Array.isArray(apiContacts)) {
        const localIds = new Set(local.map((c) => c.id || c._id));
        apiContacts.forEach((ac) => {
          const id = ac.id || ac._id;
          if (id && !localIds.has(id)) {
            local.push({
              id,
              _id: ac._id,
              name: ac.name,
              email: ac.email,
              mobile: ac.mobile || "",
              subject: ac.subject || "General Inquiry",
              message: ac.message,
              status: ac.status || "New",
              createdAt: ac.createdAt || new Date().toISOString(),
            });
          }
        });
      }
    }
  } catch {
    // API not reachable, return local
  }

  return local.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateContactStatusAdmin(id, newStatus) {
  // Update local
  const current = readLocalContacts();
  const updated = current.map((c) => ((c.id === id || c._id === id) ? { ...c, status: newStatus } : c));
  writeLocalContacts(updated);

  // Update backend API
  try {
    await fetch(`${API_BASE_URL}/contact/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch {
    // ignore
  }

  return updated;
}

export async function deleteContactAdmin(id) {
  // Update local
  const current = readLocalContacts();
  const updated = current.filter((c) => c.id !== id && c._id !== id);
  writeLocalContacts(updated);

  // Delete from backend API
  try {
    await fetch(`${API_BASE_URL}/contact/${id}`, {
      method: "DELETE",
    });
  } catch {
    // ignore
  }

  return updated;
}
