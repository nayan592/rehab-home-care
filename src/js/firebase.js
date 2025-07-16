// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCbzuu2wUiiz3SYcsns7-lyCBMAl6emqWw",
  authDomain: "rehab-home-care.firebaseapp.com",
  projectId: "rehab-home-care",
  storageBucket: "rehab-home-care.firebasestorage.app",
  messagingSenderId: "464642242934",
  appId: "1:464642242934:web:e9a2c2be98775f25d8a257",
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ✅ Set persistent session across browser sessions
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("✅ Auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("❌ Error setting auth persistence:", error);
  });

const auth = firebase.auth();
const db = firebase.firestore();

// ✅ Login function
// ✅ Login function
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  if (!email || !password) {
    message.style.color = "red";
    message.textContent = "Please enter both email and password.";
    return;
  }
if (email === "admin@rehabmedico.com" && password === "Rehab@123") {
      window.location.href = "Admin.html";
      return;
    }
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      message.style.color = "green";
      message.textContent = "Login successful!";
      setTimeout(() => window.location.href = "profile.html", 1000);  // ✅ Redirect to profile
    })
    .catch((error) => {
      message.style.color = "red";
      message.textContent = "Incorrect";
    });
}

// ✅ Signup with email/password
async function signUp() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;
  const message = document.getElementById("message");

  if (!email || !password || !phone || !name) {
    message.style.color = "red";
    message.textContent = "All fields are required!";
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      phone: phone,
      provider: "email",
      user_name: name
    });

    message.style.color = "green";
    message.textContent = "User created successfully!";
    
    setTimeout(() => window.location.href = "profile.html", 1000);  // ✅ Redirect to profile
  } catch (error) {
    message.style.color = "red";
    message.textContent = "Incorrect";
  }
}

// ✅ Google Sign-In
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
      user_name: user.displayName || "Google User"
    });

    message.style.color = "green";
    message.textContent = "Signed in with Google!";

    setTimeout(() => window.location.href = "profile.html", 1000);  // ✅ Redirect to profile
  } catch (error) {
    message.style.color = "red";
    message.textContent = error.message;
  }
}


// ✅ Logout function
function logout() {
  auth.signOut()
    .then(() => {
      console.log("✅ Logged out");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("❌ Logout failed:", error);
      alert("Error during logout. Try again.");
    });
}

// ✅ Auth state listener to update button dynamically
auth.onAuthStateChanged((user) => {
  const authButton = document.getElementById("authButton");

  if (!authButton) return; // If button not found, exit early

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



document.addEventListener("DOMContentLoaded", () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const appointmentForm = document.getElementById("appointmentForm");

    auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      // Pre-fill user data
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          document.getElementById("inputName").value = data.user_name || "";
          document.getElementById("inputEmail").value = data.email || "";
          document.getElementById("inputPhone").value = data.phone || "";
        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
      }

      // 🟩 Add form submit handler only once Firebase + DOM + Auth is ready
      appointmentForm.addEventListener("submit", async function (e) {
        e.preventDefault();
const createdAt = new Date();
        const appointmentData = {
  name: document.getElementById("inputName").value,
  phone: document.getElementById("inputPhone").value,
  email: document.getElementById("inputEmail").value,
  serviceType: document.getElementById("inputCategory").value,
  address: document.getElementById("inputAddress").value,
  city: document.getElementById("inputCity").value,
  preferredDate: document.getElementById("inputDate").value,
  preferredTime: document.getElementById("inputTime").value,
  instructions: document.getElementById("inputInstructions").value,
  createdAt: createdAt.toISOString()
};


        // 🚫 Check for empty required values (extra safety)
        for (const key in appointmentData) {
          if (
            key !== "instructions" && // optional
            (!appointmentData[key] || appointmentData[key] === "")
          ) {
            alert("⚠️ Please fill all required fields.");
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
  });