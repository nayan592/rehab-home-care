// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCbzuu2wUiiz3SYcsns7-lyCBMAl6emqWw",
  authDomain: "rehab-home-care.firebaseapp.com",
  projectId: "rehab-home-care",
  storageBucket: "rehab-home-care.firebasestorage.app",
  messagingSenderId: "464642242934",
  appId: "1:464642242934:web:e9a2c2be98775f25d8a257",
};

firebase.initializeApp(firebaseConfig);

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("Auth persistence set to LOCAL"))
  .catch((err) => console.error("Error setting auth persistence:", err));

const auth = firebase.auth();
const db = firebase.firestore();

const GUEST_ID_KEY = "rehab_guest_id";
const APPOINTMENTS_COLLECTION = "appointments";

function getOrCreateGuestId() {
  try {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).slice(2) + "_" + Date.now();
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  } catch (e) {
    return "guest_" + Date.now();
  }
}

// When user logs in, attach their guest appointments to their account
function migrateGuestAppointmentsToUser(userId) {
  const guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) return Promise.resolve();

  return db.collection(APPOINTMENTS_COLLECTION)
    .where("guestId", "==", guestId)
    .get()
    .then((snap) => {
      if (snap.empty) return;
      const batch = db.batch();
      snap.docs.forEach((d) => {
        batch.update(d.ref, { userId, guestId });
      });
      return batch.commit();
    })
    .catch((err) => console.error("Error migrating guest appointments:", err));
}

// Login
function login() {
  const email = document.getElementById("email") && document.getElementById("email").value.trim();
  const password = document.getElementById("password") && document.getElementById("password").value;
  const message = document.getElementById("message");

  if (!email || !password) {
    if (message) {
      message.style.color = "red";
      message.textContent = "Please enter both email and password.";
    }
    return;
  }
  if (email === "admin@rehabmedico.com" && password === "Rehab@123") {
    window.location.href = "Admin.html";
    return;
  }
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      if (message) {
        message.style.color = "green";
        message.textContent = "Login successful!";
      }
      setTimeout(() => { window.location.href = "profile.html"; }, 1000);
    })
    .catch((error) => {
      if (message) {
        message.style.color = "red";
        message.textContent = error.message || "Incorrect email or password.";
      }
    });
}

// Signup
async function signUp() {
  const name = document.getElementById("name") && document.getElementById("name").value.trim();
  const email = document.getElementById("email") && document.getElementById("email").value.trim();
  const password = document.getElementById("password") && document.getElementById("password").value;
  const phone = document.getElementById("phone") && document.getElementById("phone").value.trim();
  const message = document.getElementById("message");

  if (!email || !password || !phone || !name) {
    if (message) {
      message.style.color = "red";
      message.textContent = "All fields are required!";
    }
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      phone,
      provider: "email",
      user_name: name,
    });
    if (message) {
      message.style.color = "green";
      message.textContent = "User created successfully!";
    }
    setTimeout(() => { window.location.href = "profile.html"; }, 1000);
  } catch (error) {
    if (message) {
      message.style.color = "red";
      message.textContent = error.message || "Sign up failed.";
    }
  }
}

// Google Sign-In
async function googleSignUp() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const message = document.getElementById("message");
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      phone: user.phoneNumber || "N/A",
      provider: "google",
      user_name: user.displayName || "Google User",
    }, { merge: true });
    if (message) {
      message.style.color = "green";
      message.textContent = "Signed in with Google!";
    }
    setTimeout(() => { window.location.href = "profile.html"; }, 1000);
  } catch (error) {
    if (message) {
      message.style.color = "red";
      message.textContent = error.message || "Google sign-in failed.";
    }
  }
}

function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout failed:", error);
      alert("Error during logout. Try again.");
    });
}

// Auth button (Log In / My Profile)
auth.onAuthStateChanged((user) => {
  const authButton = document.getElementById("authButton");
  if (!authButton) return;
  if (user) {
    authButton.textContent = "My Profile";
    authButton.href = "profile.html";
    authButton.classList.remove("btn-outline-primary");
    authButton.classList.add("btn-success");
  } else {
    authButton.textContent = "Log In";
    authButton.href = "login.html";
    authButton.classList.remove("btn-success");
    authButton.classList.add("btn-outline-primary");
  }
});

// Render appointment list HTML (used on index and profile)
function renderAppointmentsList(appointments, targetId, options) {
  const container = document.getElementById(targetId);
  if (!container) return;
  const emptyMessage = (options && options.emptyMessage) || "No appointments yet. Create one above.";
  if (!appointments || appointments.length === 0) {
    container.innerHTML = "<p class=\"text-muted mb-0\">" + emptyMessage + "</p>";
    return;
  }
  const now = new Date();
  container.innerHTML = appointments.map((appt, i) => {
    const preferredDate = appt.preferredDate || (appt.createdAt && appt.createdAt.toDate && appt.createdAt.toDate().toISOString().slice(0, 10));
    const preferredTime = appt.preferredTime || "";
    const appointmentTime = new Date(preferredDate + "T" + (preferredTime || "00:00"));
    const diffHrs = (appointmentTime - now) / (1000 * 60 * 60);
    const canEdit = diffHrs > 5;
    const status = appt.status || "Pending";
    return (
      "<div class=\"card mb-3\">" +
      "<div class=\"card-body\">" +
      "<h5 class=\"card-title\">#" + (i + 1) + " - " + (appt.serviceType || "—") + " <span class=\"badge bg-secondary\">" + status + "</span></h5>" +
      "<p class=\"mb-1\"><strong>Date:</strong> " + preferredDate + ", <strong>Time:</strong> " + (preferredTime || "—") + "</p>" +
      "<p class=\"mb-1\"><strong>City:</strong> " + (appt.city || "—") + ", <strong>Address:</strong> " + (appt.address || "—") + "</p>" +
      "<p class=\"mb-1\"><strong>Phone:</strong> " + (appt.phone || "—") + ", <strong>Email:</strong> " + (appt.email || "—") + "</p>" +
      (appt.instructions ? "<p class=\"mb-1\"><strong>Instructions:</strong> " + appt.instructions + "</p>" : "") +
      (canEdit ? "<button type=\"button\" class=\"btn btn-warning btn-sm mt-2\" onclick=\"editAppointmentByIndex(" + i + ")\">Edit</button>" : "<small class=\"text-muted\">Cannot edit within 5 hours of appointment</small>") +
      "</div></div>"
    );
  }).join("");
}

// Fetch "My Appointments" for current user or guest (sort in memory to avoid composite index)
function getMyAppointmentsSnapshot() {
  const user = auth.currentUser;
  let q;
  if (user) {
    q = db.collection(APPOINTMENTS_COLLECTION).where("userId", "==", user.uid);
  } else {
    const guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) return Promise.resolve({ empty: true, docs: [] });
    q = db.collection(APPOINTMENTS_COLLECTION).where("guestId", "==", guestId);
  }
  return q.get().then((snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data(), _createdAt: d.data().createdAt }));
    docs.sort((a, b) => {
      const ta = a._createdAt && a._createdAt.toDate ? a._createdAt.toDate().getTime() : 0;
      const tb = b._createdAt && b._createdAt.toDate ? b._createdAt.toDate().getTime() : 0;
      return tb - ta;
    });
    return { docs, empty: docs.length === 0 };
  });
}

function getMyAppointmentsList() {
  return getMyAppointmentsSnapshot().then((result) => result.docs || []);
}

// Load and render "My Appointments" on index page
function loadMyAppointments() {
  getMyAppointmentsSnapshot().then((result) => {
    const list = result.docs || [];
    renderAppointmentsList(list, "myAppointmentsList", { emptyMessage: "You haven't created any appointments yet. Use the form above to book one." });
  }).catch((err) => {
    console.error("Error loading my appointments:", err);
    const container = document.getElementById("myAppointmentsList");
    if (container) container.innerHTML = "<p class=\"text-danger\">Failed to load appointments. Try again later.</p>";
  });
}

// Profile page: load user doc and appointments from collection; expose edit/save/logout
function initProfilePage() {
  const appointmentsList = document.getElementById("appointmentsList");
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userPhoneEl = document.getElementById("userPhone");
  const editForm = document.getElementById("editProfileForm");
  const editNameEl = document.getElementById("editName");
  const editPhoneEl = document.getElementById("editPhone");
  if (!appointmentsList) return;

  window.editProfile = function () {
    if (editForm) editForm.style.display = "block";
    if (editNameEl && userNameEl) editNameEl.value = userNameEl.textContent || "";
    if (editPhoneEl && userPhoneEl) editPhoneEl.value = userPhoneEl.textContent || "";
  };
  window.cancelEditProfile = function () {
    if (editForm) editForm.style.display = "none";
  };
  window.saveProfile = async function () {
    const user = auth.currentUser;
    if (!user) return;
    const newName = editNameEl ? editNameEl.value.trim() : "";
    const newPhone = editPhoneEl ? editPhoneEl.value.trim() : "";
    try {
      await db.collection("users").doc(user.uid).update({ user_name: newName, phone: newPhone });
      if (userNameEl) userNameEl.textContent = newName;
      if (userPhoneEl) userPhoneEl.textContent = newPhone;
      window.cancelEditProfile();
      alert("Profile updated.");
    } catch (err) {
      alert("Failed to update profile: " + (err.message || ""));
    }
  };

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    window.currentUser = user;

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (userNameEl) userNameEl.textContent = data.user_name || "";
        if (userEmailEl) userEmailEl.textContent = data.email || "";
        if (userPhoneEl) userPhoneEl.textContent = data.phone || "";
      }
      const snap = await db.collection(APPOINTMENTS_COLLECTION).where("userId", "==", user.uid).get();
      let appointments = snap.empty ? [] : snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt }));
      appointments.sort((a, b) => {
        const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });
      renderAppointmentsList(appointments, "appointmentsList", { emptyMessage: "No appointments found." });
    } catch (err) {
      console.error("Error loading profile:", err);
      appointmentsList.innerHTML = "<p class=\"text-danger\">Failed to load appointments.</p>";
    }
  });
}

// Appointment form: allow submit without login; pre-fill when logged in
document.addEventListener("DOMContentLoaded", () => {
  const appointmentForm = document.getElementById("appointmentForm");

  const isProfilePage = document.getElementById("appointmentsList") && !document.getElementById("appointmentForm");
  if (isProfilePage) {
    initProfilePage();
  }

  auth.onAuthStateChanged((user) => {
    if (!user || !appointmentForm) return;
    migrateGuestAppointmentsToUser(user.uid);
    db.collection("users").doc(user.uid).get().then((docSnap) => {
      if (!docSnap.exists || !appointmentForm) return;
      const data = docSnap.data();
      const nameEl = document.getElementById("inputName");
      const emailEl = document.getElementById("inputEmail");
      const phoneEl = document.getElementById("inputPhone");
      if (nameEl) nameEl.value = data.user_name || "";
      if (emailEl) emailEl.value = data.email || "";
      if (phoneEl) phoneEl.value = data.phone || "";
    }).catch(() => {});
  });

  if (!appointmentForm) {
    if (document.getElementById("myAppointmentsList")) loadMyAppointments();
    return;
  }

  appointmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    const appointmentData = {
      name: getVal("inputName"),
      phone: getVal("inputPhone"),
      email: getVal("inputEmail"),
      serviceType: getVal("inputCategory"),
      address: getVal("inputAddress"),
      city: getVal("inputCity"),
      preferredDate: getVal("inputDate"),
      preferredTime: getVal("inputTime"),
      instructions: getVal("inputInstructions"),
      status: "Pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const required = ["name", "phone", "email", "serviceType", "address", "city", "preferredDate", "preferredTime"];
    for (let i = 0; i < required.length; i++) {
      if (!appointmentData[required[i]]) {
        alert("Please fill all required fields.");
        return;
      }
    }

       try {
  // Save to central appointments collection
  await db.collection("appointments").add(appointmentData);

  const userRef = db.collection("users").doc(user.uid);
  const userDoc = await userRef.get();

  if (userDoc.exists && userDoc.data().appointments) {
    // Field exists → use arrayUnion
    await userRef.update({
      appointments: firebase.firestore.FieldValue.arrayUnion(appointmentData)
    });
  } else {
    // Field doesn't exist → set manually as array
    await userRef.set({
      appointments: [appointmentData]
    }, { merge: true });
  }

  alert("✅ Appointment submitted successfully!");
  appointmentForm.reset();
} catch (err) {
  console.error("❌ Error submitting appointment:", err);
  alert("❌ Failed to save appointment. " + err.message);
}
      });
    });
 